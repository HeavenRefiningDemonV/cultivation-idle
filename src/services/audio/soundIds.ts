export const SOUND_IDS = [
  'ui_click_primary',
] as const;

export type SoundId = (typeof SOUND_IDS)[number];

export function isSoundId(value: string): value is SoundId {
  return (SOUND_IDS as readonly string[]).includes(value);
}
