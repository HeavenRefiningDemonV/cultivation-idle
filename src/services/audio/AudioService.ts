import type { SoundCategory, SoundDef } from './soundCatalog';
import { SOUND_CATALOG } from './soundCatalog';
import type { SoundId } from './soundIds';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';

export type AudioPlayOptions = {
  volume?: number;
  rate?: number;
};

export type AmbienceOptions = {
  fadeMs?: number;
};

const AUDIO_EXTENSIONS = ['.ogg', '.mp3', '.wav'];
const DEFAULT_FADE_MS = 800;
const MAX_POOL_SIZE = 4;

const SILENT_AUDIO_DATA =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

export class AudioService {
  private initialized = false;
  private unlocked = false;
  private missingIds = new Set<string>();
  private urlCache = new Map<string, string | null>();
  private pools = new Map<string, HTMLAudioElement[]>();
  private ambienceAudio: HTMLAudioElement | null = null;
  private ambienceId: SoundId | null = null;
  private ambienceFadeFrame: number | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      const silent = new Audio(SILENT_AUDIO_DATA);
      silent.volume = 0;
      void silent.play().catch(() => undefined);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    this.unsubscribeSettings = useAudioSettingsStore.subscribe(() => {
      this.refreshAmbienceVolume();
    });
  }

  play(id: SoundId, options?: AudioPlayOptions): void {
    void this.playByKey(id, id, options);
  }

  playUi(id: SoundId, options?: AudioPlayOptions): void {
    void this.playByKey(id, id, options, 'ui');
  }

  playSfx(id: SoundId, options?: AudioPlayOptions): void {
    void this.playByKey(id, id, options, 'sfx');
  }

  playStinger(id: SoundId, options?: AudioPlayOptions): void {
    void this.playByKey(id, id, options, 'stg');
  }

  playVariant(id: SoundId, variantCount: number, options?: AudioPlayOptions): void {
    if (variantCount <= 0) {
      this.play(id, options);
      return;
    }

    const variantIndex = Math.floor(Math.random() * variantCount) + 1;
    const variantKey = `${id}__${variantIndex}`;
    void this.playByKey(id, variantKey, options, undefined, { allowFallback: true });
  }

  startAmbience(id: SoundId, options?: AmbienceOptions): void {
    void this.startAmbienceInternal(id, options);
  }

  stopAmbience(options?: AmbienceOptions): void {
    void this.stopAmbienceInternal(options);
  }

  private getEffectiveVolume(category: SoundCategory, def: SoundDef, options?: AudioPlayOptions): number {
    const settings = useAudioSettingsStore.getState();
    if (settings.muted) return 0;

    const channelVolume = this.getChannelVolume(settings, category);
    const optionVolume = options?.volume ?? 1;
    return this.clampVolume(settings.masterVolume * channelVolume * def.defaultVolume * optionVolume);
  }

  private getChannelVolume(settings: ReturnType<typeof useAudioSettingsStore.getState>, category: SoundCategory): number {
    switch (category) {
      case 'ui':
        return settings.uiVolume;
      case 'sfx':
        return settings.sfxVolume;
      case 'amb':
        return settings.ambVolume;
      case 'stg':
        return settings.stgVolume;
      default: {
        const _exhaustive: never = category;
        return settings.masterVolume;
      }
    }
  }

  private clampVolume(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.min(1, Math.max(0, value));
  }

  private async playByKey(
    id: SoundId,
    key: string,
    options?: AudioPlayOptions,
    categoryOverride?: SoundCategory,
    settings?: { allowFallback?: boolean },
  ): Promise<void> {
    const def = SOUND_CATALOG[id];
    const category = categoryOverride ?? def.category;
    const volume = this.getEffectiveVolume(category, def, options);
    if (volume <= 0) return;

    const url = await this.resolveUrlForKey(key, id, settings?.allowFallback);
    if (!url) {
      if (settings?.allowFallback && key !== id) {
        await this.playByKey(id, id, options, categoryOverride);
      }
      return;
    }

    const audio = this.borrowAudio(key, url);
    audio.volume = volume;
    audio.playbackRate = options?.rate ?? 1;
    audio.loop = false;
    audio.currentTime = 0;

    try {
      await audio.play();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[audio] Unable to play sound', id, error);
      }
    }
  }

  private async startAmbienceInternal(id: SoundId, options?: AmbienceOptions): Promise<void> {
    const def = SOUND_CATALOG[id];
    const targetVolume = this.getEffectiveVolume(def.category, def);
    if (targetVolume <= 0) return;

    const url = await this.resolveUrlForKey(id, id);
    if (!url) return;

    const fadeMs = options?.fadeMs ?? DEFAULT_FADE_MS;

    if (this.ambienceAudio && this.ambienceId === id) {
      this.ambienceAudio.loop = def.loop ?? true;
      this.fadeVolume(this.ambienceAudio, targetVolume, fadeMs);
      return;
    }

    const nextAudio = new Audio(url);
    nextAudio.loop = def.loop ?? true;
    nextAudio.volume = 0;
    nextAudio.preload = 'auto';

    try {
      await nextAudio.play();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[audio] Unable to start ambience', id, error);
      }
      return;
    }

    if (this.ambienceAudio) {
      await this.fadeOutAndStop(this.ambienceAudio, fadeMs);
    }

    this.ambienceAudio = nextAudio;
    this.ambienceId = id;
    this.fadeVolume(nextAudio, targetVolume, fadeMs);
  }

  private async stopAmbienceInternal(options?: AmbienceOptions): Promise<void> {
    if (!this.ambienceAudio) return;
    const fadeMs = options?.fadeMs ?? DEFAULT_FADE_MS;
    await this.fadeOutAndStop(this.ambienceAudio, fadeMs);
    this.ambienceAudio = null;
    this.ambienceId = null;
  }

  private refreshAmbienceVolume(): void {
    if (!this.ambienceAudio || !this.ambienceId) return;
    const def = SOUND_CATALOG[this.ambienceId];
    const targetVolume = this.getEffectiveVolume(def.category, def);
    this.ambienceAudio.volume = targetVolume;
  }

  private borrowAudio(key: string, url: string): HTMLAudioElement {
    const pool = this.pools.get(key) ?? [];
    let audio = pool.find((entry) => entry.paused || entry.ended);

    if (!audio) {
      audio = new Audio(url);
      audio.preload = 'auto';
      pool.push(audio);
      if (pool.length > MAX_POOL_SIZE) {
        pool.shift();
      }
    }

    if (audio.src !== url) {
      audio.src = url;
    }

    this.pools.set(key, pool);
    return audio;
  }

  private async resolveUrlForKey(
    key: string,
    idForLogging: SoundId,
    allowFallback?: boolean,
  ): Promise<string | null> {
    if (this.urlCache.has(key)) {
      return this.urlCache.get(key) ?? null;
    }

    for (const extension of AUDIO_EXTENSIONS) {
      const url = `/audio/${key}${extension}`;
      const exists = await this.checkUrl(url);
      if (exists) {
        this.urlCache.set(key, url);
        return url;
      }
    }

    this.urlCache.set(key, null);
    if (!allowFallback && !this.missingIds.has(idForLogging)) {
      this.missingIds.add(idForLogging);
      if (import.meta.env.DEV) {
        console.warn(
          `[audio] missing asset for ${idForLogging} (expected /audio/${idForLogging}.ogg|mp3|wav)`,
        );
      }
    }

    return null;
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return true;
      if (response.status === 405) {
        const getResponse = await fetch(url, { method: 'GET' });
        return getResponse.ok;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private fadeVolume(audio: HTMLAudioElement, targetVolume: number, durationMs: number): void {
    if (this.ambienceFadeFrame !== null) {
      cancelAnimationFrame(this.ambienceFadeFrame);
      this.ambienceFadeFrame = null;
    }

    const startVolume = audio.volume;
    if (durationMs <= 0) {
      audio.volume = targetVolume;
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;
      if (progress < 1) {
        this.ambienceFadeFrame = requestAnimationFrame(step);
      }
    };

    this.ambienceFadeFrame = requestAnimationFrame(step);
  }

  private async fadeOutAndStop(audio: HTMLAudioElement, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      if (durationMs <= 0) {
        audio.pause();
        audio.currentTime = 0;
        resolve();
        return;
      }

      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        audio.volume = startVolume * (1 - progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          audio.pause();
          audio.currentTime = 0;
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }
}
