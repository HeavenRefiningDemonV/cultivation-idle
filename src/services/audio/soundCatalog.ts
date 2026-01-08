import type { SoundId } from './soundIds';

export type SoundCategory = 'ui' | 'sfx' | 'amb' | 'stg';

export type SoundDef = {
  id: SoundId;
  category: SoundCategory;
  loop?: boolean;
  defaultVolume: number;
};

export const SOUND_CATALOG: Record<SoundId, SoundDef> = {
  'ui_click_primary': { id: 'ui_click_primary', category: 'ui', defaultVolume: 0.6 },
};
