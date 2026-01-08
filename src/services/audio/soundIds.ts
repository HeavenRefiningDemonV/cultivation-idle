export const SOUND_IDS = [
  'ui_click_primary',
  'ui_click_secondary',
  'ui_dropdown_open',
  'ui_dropdown_select',
  'ui_locked',
  'ui_modal_close',
  'ui_modal_open',
  'ui_tab_switch',
  'ui_toast_critical',
  'ui_toast_info',
  'ui_toast_success',
  'ui_toast_warning',
] as const;

export type SoundId = (typeof SOUND_IDS)[number];

export function isSoundId(value: string): value is SoundId {
  return (SOUND_IDS as readonly string[]).includes(value);
}
