import type { CultivatorStatDef } from '../../content/types.js';

export const CANONICAL_CULTIVATOR_STAT_IDS = [
  'dantian_depth',
  'meridian_throughput',
  'qi_purity',
  'body_integrity',
  'mind_clarity',
  'dao_stability',
  'spirit_sense',
  'dao_resonance',
  'qi_control',
  'divine_sense',
  'law_weaving',
  'tribulation_insight',
  'star_rhythm',
  'body_tempering',
  'meridian_fortitude',
  'blood_essence',
  'rooted_guard',
  'armor_harmony',
  'recovery_depth',
  'weapon_intent',
  'battle_rhythm',
  'flow_step',
  'precision',
  'counter_sense',
  'killing_momentum',
  'weapon_bond',
  'artifact_attunement',
  'medicine_familiarity',
] as const;

export type CanonicalCultivatorStatId = (typeof CANONICAL_CULTIVATOR_STAT_IDS)[number];

export function isCanonicalCultivatorStatId(id: string): id is CanonicalCultivatorStatId {
  return (CANONICAL_CULTIVATOR_STAT_IDS as readonly string[]).includes(id);
}

export function buildCultivatorStatMap(stats: readonly CultivatorStatDef[]): Map<string, CultivatorStatDef> {
  return new Map(stats.map((stat) => [stat.id, stat]));
}
