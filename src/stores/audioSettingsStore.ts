import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SoundCategory } from '../services/audio/soundCatalog.js';

export type AudioSettingsState = {
  muted: boolean;
  masterVolume: number;
  uiVolume: number;
  sfxVolume: number;
  ambVolume: number;
  stgVolume: number;
};

export type AudioSettingsActions = {
  setMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setChannelVolume: (category: SoundCategory, volume: number) => void;
  resetAudioSettings: () => void;
};

export type AudioSettingsStore = AudioSettingsState & AudioSettingsActions;

const DEFAULT_AUDIO_SETTINGS: AudioSettingsState = {
  muted: false,
  masterVolume: 1,
  uiVolume: 1,
  sfxVolume: 1,
  ambVolume: 1,
  stgVolume: 1,
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const setChannelValue = (state: AudioSettingsState, category: SoundCategory, volume: number) => {
  const value = clamp(volume);
  switch (category) {
    case 'ui':
      return { ...state, uiVolume: value };
    case 'sfx':
      return { ...state, sfxVolume: value };
    case 'amb':
      return { ...state, ambVolume: value };
    case 'stg':
      return { ...state, stgVolume: value };
    default: {
      const _exhaustive: never = category;
      return state;
    }
  }
};

export const useAudioSettingsStore = create<AudioSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_AUDIO_SETTINGS,
      setMuted: (muted) => set({ muted }),
      setMasterVolume: (volume) => set({ masterVolume: clamp(volume) }),
      setChannelVolume: (category, volume) =>
        set((state) => ({
          ...setChannelValue(state, category, volume),
        })),
      resetAudioSettings: () => set({ ...DEFAULT_AUDIO_SETTINGS }),
    }),
    {
      name: 'cultivation-idle-audio-settings',
    },
  ),
);

export const selectAudioMuted = (state: AudioSettingsStore) => state.muted;
export const selectAudioMasterVolume = (state: AudioSettingsStore) => state.masterVolume;
export const selectAudioUiVolume = (state: AudioSettingsStore) => state.uiVolume;
export const selectAudioSfxVolume = (state: AudioSettingsStore) => state.sfxVolume;
export const selectAudioAmbVolume = (state: AudioSettingsStore) => state.ambVolume;
export const selectAudioStgVolume = (state: AudioSettingsStore) => state.stgVolume;
