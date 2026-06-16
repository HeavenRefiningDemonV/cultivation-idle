import {
  effectiveMeridianCap,
  type MeridianCapState,
  type SpiritRootGrade,
} from './meridianModel.js';

/**
 * W3 — the one-meridian training state + the single advance path (advanceMeridian)
 * that BOTH the Court tick and the combat passive hook (W5) call. ADDITIVE: this is a
 * new state shape; the legacy tri-stat training store is untouched until W13. The
 * caller computes `amount` (baseRate × computeMeridianRate().mult × dt); this module
 * applies it — rating up to the realm cap, overflow into mastery, mastery time-share,
 * and the comprehension warm-up — at NO resource cost (§2.12, test-enforced).
 */

/** Per-exercise mastery milestones (realm-uncapped; canonical training milestones). */
export const MERIDIAN_MASTERY_MILESTONES = [100, 260, 520, 900, 1450, 2200, 3200, 4500, 6200, 8400] as const;

/** Mastery XP earned alongside rating, as a share of the tick amount (§2.6) ‹tune W12›. */
export const MASTERY_TIME_SHARE = 0.33;

/** Freshly-unlocked exercise starts here and ramps to 1 (§2.7) ‹tune W12›. */
export const COMPREHENSION_FLOOR = 0.5;

/** Comprehension gained per unit of tick amount, scaled by Perception (§2.7) ‹tune W12›. */
export const COMPREHENSION_RAMP = 0.0015;
const COMPREHENSION_PERCEPTION_PIVOT = 20;
const COMPREHENSION_PERCEPTION_SLOPE = 0.01;

export const MERIDIAN_CAP_NEAR_THRESHOLD = 0.92;

export interface MeridianProgress {
  rating: number; // 0..effectiveCap (hard-capped)
  ratingXp: number; // carry toward the next rating point
  masteryXp: number; // realm-uncapped
  comprehension: number; // COMPREHENSION_FLOOR..1
}

export interface MeridianTrainingState {
  activeMeridianId: string | null;
  rootByMeridianId: Record<string, SpiritRootGrade>;
  progressByMeridianId: Record<string, MeridianProgress>;
}

export function createMeridianProgress(fresh = false): MeridianProgress {
  return { rating: 0, ratingXp: 0, masteryXp: 0, comprehension: fresh ? COMPREHENSION_FLOOR : 1 };
}

export function createDefaultMeridianTrainingState(): MeridianTrainingState {
  return { activeMeridianId: null, rootByMeridianId: {}, progressByMeridianId: {} };
}

/** XP to advance from `rating` to `rating + 1` (mirrors the training rating curve). */
export function xpToNextMeridianRating(rating: number): number {
  return Math.ceil(8 + 1.1 * rating + 0.035 * rating * rating);
}

/** Mastery rank 0..10 from accumulated mastery XP (§2.6). */
export function masteryRankFromXp(masteryXp: number): number {
  let rank = 0;
  for (const milestone of MERIDIAN_MASTERY_MILESTONES) {
    if (masteryXp >= milestone) rank += 1;
    else break;
  }
  return rank;
}

/** cap-state thresholds (§2.8): open <0.92, near_cap 0.92–<1, capped ≥1. */
export function meridianCapState(capPct: number): MeridianCapState {
  if (capPct >= 1) return 'capped';
  if (capPct >= MERIDIAN_CAP_NEAR_THRESHOLD) return 'near_cap';
  return 'open';
}

export interface AdvanceMeridianInput {
  state: MeridianTrainingState;
  meridianId: string;
  /** baseRate × computeMeridianRate().mult × dt — precomputed by the caller. */
  amount: number;
  source: 'court' | 'combat';
  realmIndex1to7: number;
  /** the meridian's unlockRealm (sealed while > current realm). */
  unlockRealm: number;
  perception?: number;
}

export interface AdvanceMeridianResult {
  state: MeridianTrainingState;
  ratingGained: number;
  masteryGained: number;
  overflowToMastery: number;
  comprehensionGained: number;
  cap: number;
  capState: MeridianCapState;
  source: 'court' | 'combat';
  /** Training costs nothing — the no-resource-cost invariant (§2.12, N16). */
  resourceCost: 0;
  rejected: null | 'sealed';
}

function comprehensionGainFor(amount: number, perception: number | undefined): number {
  const p = perception ?? COMPREHENSION_PERCEPTION_PIVOT;
  const perceptionFactor = Math.max(0, 1 + (p - COMPREHENSION_PERCEPTION_PIVOT) * COMPREHENSION_PERCEPTION_SLOPE);
  return Math.max(0, amount) * COMPREHENSION_RAMP * perceptionFactor;
}

/**
 * Apply `amount` to exactly one meridian. Rating advances to the realm cap; any
 * overflow (and the parallel time-share) feeds mastery; comprehension ramps toward 1.
 * Returns a NEW state — sibling meridians are never mutated (N1). Sealed meridians
 * (unlockRealm > realm) are rejected with no change (N2).
 */
export function advanceMeridian(input: AdvanceMeridianInput): AdvanceMeridianResult {
  const { state, meridianId, amount, source, realmIndex1to7, unlockRealm, perception } = input;
  const grade: SpiritRootGrade = state.rootByMeridianId[meridianId] ?? 'true';
  const cap = effectiveMeridianCap(realmIndex1to7, grade);
  const prev = state.progressByMeridianId[meridianId] ?? createMeridianProgress(false);

  if (unlockRealm > realmIndex1to7) {
    return {
      state,
      ratingGained: 0,
      masteryGained: 0,
      overflowToMastery: 0,
      comprehensionGained: 0,
      cap,
      capState: meridianCapState(prev.rating / Math.max(1, cap)),
      source,
      resourceCost: 0,
      rejected: 'sealed',
    };
  }

  const applied = Math.max(0, amount);
  let rating = prev.rating;
  let pool = prev.ratingXp + applied;

  while (rating < cap && pool >= xpToNextMeridianRating(rating)) {
    pool -= xpToNextMeridianRating(rating);
    rating += 1;
  }

  let ratingXp = pool;
  let overflowToMastery = 0;
  if (rating >= cap) {
    // Hard-capped: leftover rating XP overflows into mastery (§2.8) instead of being lost.
    overflowToMastery = pool;
    ratingXp = 0;
  }

  const masteryGained = applied * MASTERY_TIME_SHARE + overflowToMastery;
  const comprehensionGained = prev.comprehension >= 1 ? 0 : comprehensionGainFor(applied, perception);
  const comprehension = Math.min(1, prev.comprehension + comprehensionGained);

  const next: MeridianProgress = {
    rating,
    ratingXp,
    masteryXp: prev.masteryXp + masteryGained,
    comprehension,
  };

  return {
    state: {
      ...state,
      progressByMeridianId: { ...state.progressByMeridianId, [meridianId]: next },
    },
    ratingGained: rating - prev.rating,
    masteryGained,
    overflowToMastery,
    comprehensionGained: comprehension - prev.comprehension,
    cap,
    capState: meridianCapState(rating / Math.max(1, cap)),
    source,
    resourceCost: 0,
    rejected: null,
  };
}
