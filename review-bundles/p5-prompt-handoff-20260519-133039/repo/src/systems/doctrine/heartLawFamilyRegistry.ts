import type { HeartLawFamily } from './heartLawTypes.js';

export const HEART_LAW_FAMILY_ORDER: readonly HeartLawFamily[] = Object.freeze([
  'circulation',
  'stability',
  'insight',
  'endurance',
  'burst',
  'breakthrough',
]);

export const HEART_LAW_FAMILY_BY_ID: Readonly<Record<string, HeartLawFamily>> = Object.freeze({
  heart_quiet_breath_method: 'circulation',
  heart_stone_root_tempering: 'stability',
  heart_ember_thread_sutra: 'burst',
  heart_river_mirror_art: 'endurance',
  heart_verdant_pulse_canon: 'endurance',
  heart_iron_intent_scripture: 'burst',
  heart_heaven_flame_manual: 'burst',
  heart_black_tortoise_codex: 'stability',
  heart_sword_river_heart_law: 'insight',
  heart_stormstep_diagram: 'burst',
  heart_soul_lantern_sutra: 'insight',
  heart_bloodseal_scripture: 'burst',
  heart_void_palm_record: 'burst',
  heart_moment_thread_chronicle: 'insight',
  heart_nine_heavens_scripture: 'breakthrough',
  heart_earth_dragon_spine_manual: 'breakthrough',
  heart_star_core_refinement_law: 'circulation',
  heart_unbroken_will_method: 'stability',
});

export function getHeartLawFamily(id: string | null): HeartLawFamily | null {
  if (id === null) {
    return null;
  }

  return HEART_LAW_FAMILY_BY_ID[id] ?? null;
}
