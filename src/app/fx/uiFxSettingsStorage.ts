import type { UiFxSettingsState } from '../../stores/uiStore.js';

export const UI_FX_SETTINGS_STORAGE_KEY = 'ui.fx.settings.v1';

export const DEFAULT_UI_FX_SETTINGS: UiFxSettingsState = {
  enabled: true,
  quality: 'auto',
  allowAtmosphere: true,
  allowHeroFx: true,
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const QUALITY_SET = new Set<UiFxSettingsState['quality']>(['auto', 'high', 'medium', 'low']);

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function sanitizeUiFxSettingsLike(input: unknown): UiFxSettingsState {
  const value = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_UI_FX_SETTINGS.enabled,
    quality: typeof value.quality === 'string' && QUALITY_SET.has(value.quality as UiFxSettingsState['quality'])
      ? (value.quality as UiFxSettingsState['quality'])
      : DEFAULT_UI_FX_SETTINGS.quality,
    allowAtmosphere: typeof value.allowAtmosphere === 'boolean'
      ? value.allowAtmosphere
      : DEFAULT_UI_FX_SETTINGS.allowAtmosphere,
    allowHeroFx: typeof value.allowHeroFx === 'boolean'
      ? value.allowHeroFx
      : DEFAULT_UI_FX_SETTINGS.allowHeroFx,
  };
}

export function readPersistedUiFxSettings(storage: StorageLike | null = getBrowserStorage()): UiFxSettingsState {
  if (!storage) {
    return { ...DEFAULT_UI_FX_SETTINGS };
  }

  try {
    const raw = storage.getItem(UI_FX_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_UI_FX_SETTINGS };
    }

    return sanitizeUiFxSettingsLike(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_UI_FX_SETTINGS };
  }
}

export function writePersistedUiFxSettings(
  settings: UiFxSettingsState,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    const sanitized = sanitizeUiFxSettingsLike(settings);
    storage.setItem(UI_FX_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('[uiFxSettingsStorage] Failed to persist uiFx settings.', error);
  }
}
