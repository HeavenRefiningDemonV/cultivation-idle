import type { CanonicalCultivatorStatId } from '../../systems/cultivatorStats/statDefinitions.js';
import type { CourtStatView } from '../../systems/meridians/index.js';

/**
 * W13a-3 — the live source for the Court's 13 SHARED tier stats (7 Tier-1 Cultivation
 * Axes + 6 Tier-0 Mortal Foundation), shown read-only in the Constitution panel.
 *
 * The running game stores these under the LEGACY 28-stat ids (statDefinitions.ts /
 * useTrainingStore.statRatingsById) — there is no `cultivation_base` / `physique` id in
 * the live save. So each Three-Treasures shared stat maps to the canonical live stat that
 * feeds its value. This mapping mirrors the W8 observatory node map (spine ← axes, earth
 * ← foundation) so the Court and the Observatory read the same source. It is a documented
 * design mapping (tunable), not a 1:1 — the legacy roster and the Three-Treasures model
 * are different shapes.
 */
export interface CourtSharedStatDef {
  /** Three-Treasures stat id (Court-model). */
  id: string;
  zi: string;
  name: string;
  /** The canonical live cultivator stat whose rating supplies this stat's value. */
  liveStatId: CanonicalCultivatorStatId;
  tier: 'axis' | 'foundation';
}

export const COURT_SHARED_STATS: readonly CourtSharedStatDef[] = [
  // Tier-1 Cultivation Axes (7) — universal spine in the W8 map.
  { id: 'cultivation_base', zi: '修为', name: 'Cultivation Base', liveStatId: 'dantian_depth', tier: 'axis' },
  { id: 'qi_pool', zi: '灵力', name: 'Qi Pool', liveStatId: 'body_integrity', tier: 'axis' },
  { id: 'qi_purity', zi: '气纯', name: 'Qi Purity', liveStatId: 'qi_purity', tier: 'axis' },
  { id: 'meridian_openness', zi: '经脉', name: 'Meridian Openness', liveStatId: 'meridian_throughput', tier: 'axis' },
  { id: 'spiritual_sense', zi: '神识', name: 'Spiritual Sense', liveStatId: 'spirit_sense', tier: 'axis' },
  { id: 'soul_strength', zi: '魂', name: 'Soul Strength', liveStatId: 'mind_clarity', tier: 'axis' },
  { id: 'dao_comprehension', zi: '道', name: 'Dao Comprehension', liveStatId: 'dao_stability', tier: 'axis' },
  // Tier-0 Mortal Foundation (6) — earth branch in the W8 map.
  { id: 'physique', zi: '体', name: 'Physique', liveStatId: 'body_tempering', tier: 'foundation' },
  { id: 'vitality', zi: '元', name: 'Vitality', liveStatId: 'blood_essence', tier: 'foundation' },
  { id: 'agility', zi: '敏', name: 'Agility', liveStatId: 'armor_harmony', tier: 'foundation' },
  { id: 'perception', zi: '悟', name: 'Perception', liveStatId: 'recovery_depth', tier: 'foundation' },
  { id: 'willpower', zi: '志', name: 'Willpower', liveStatId: 'meridian_fortitude', tier: 'foundation' },
  { id: 'luck', zi: '运', name: 'Luck', liveStatId: 'rooted_guard', tier: 'foundation' },
];

/** The Three-Treasures id used by the rate formula's Perception term. */
export const COURT_PERCEPTION_STAT_ID = 'perception';

/** The live cultivator stat id whose rating supplies Perception (for the rate formula). */
export const COURT_PERCEPTION_LIVE_STAT_ID =
  COURT_SHARED_STATS.find((s) => s.id === COURT_PERCEPTION_STAT_ID)?.liveStatId ?? 'recovery_depth';

/** Perception value from the live cultivator ratings — the rate's Perception term. */
export function courtPerceptionValue(statRatingsById: Record<string, number>): number {
  return Math.round(statRatingsById[COURT_PERCEPTION_LIVE_STAT_ID] ?? 0);
}

export interface CourtSharedStats {
  axes: CourtStatView[];
  foundation: CourtStatView[];
  /** Perception value (Tier-0), fed to computeMeridianRate. */
  perception: number;
}

/**
 * Resolve the 13 shared-tier CourtStatViews from the live cultivator ratings
 * (useTrainingStore.statRatingsById, keyed by canonical legacy ids). Pure.
 */
export function resolveCourtSharedStats(statRatingsById: Record<string, number>): CourtSharedStats {
  const axes: CourtStatView[] = [];
  const foundation: CourtStatView[] = [];
  let perception = 0;
  for (const def of COURT_SHARED_STATS) {
    const value = Math.round(statRatingsById[def.liveStatId] ?? 0);
    const view: CourtStatView = { id: def.id, zi: def.zi, name: def.name, value };
    if (def.tier === 'axis') axes.push(view);
    else foundation.push(view);
    if (def.id === COURT_PERCEPTION_STAT_ID) perception = value;
  }
  return { axes, foundation, perception };
}
