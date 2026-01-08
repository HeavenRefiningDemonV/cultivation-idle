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
  'ui_click_secondary': { id: 'ui_click_secondary', category: 'ui', defaultVolume: 0.6 },
  'ui_dropdown_open': { id: 'ui_dropdown_open', category: 'ui', defaultVolume: 0.6 },
  'ui_dropdown_select': { id: 'ui_dropdown_select', category: 'ui', defaultVolume: 0.6 },
  'ui_locked': { id: 'ui_locked', category: 'ui', defaultVolume: 0.6 },
  'ui_modal_close': { id: 'ui_modal_close', category: 'ui', defaultVolume: 0.6 },
  'ui_modal_open': { id: 'ui_modal_open', category: 'ui', defaultVolume: 0.6 },
  'ui_tab_switch': { id: 'ui_tab_switch', category: 'ui', defaultVolume: 0.6 },
  'ui_toast_critical': { id: 'ui_toast_critical', category: 'ui', defaultVolume: 0.6 },
  'ui_toast_info': { id: 'ui_toast_info', category: 'ui', defaultVolume: 0.6 },
  'ui_toast_success': { id: 'ui_toast_success', category: 'ui', defaultVolume: 0.6 },
  'ui_toast_warning': { id: 'ui_toast_warning', category: 'ui', defaultVolume: 0.6 },
};
