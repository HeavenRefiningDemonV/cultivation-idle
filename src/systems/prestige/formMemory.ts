/**
 * W11 — the prestige Form-Memory floor (§2.11), as a pure, deterministic module.
 *
 * On reincarnation the meridian ratings reset, but each meridian keeps a permanent
 * floor = floor((Σ lifetime rating invested in it)^e) × m — so re-leveling is faster
 * each life (the idle-prestige "permanent floor", the Room's "Tempering Wind"). Spirit
 * roots re-roll (§2.3, the only re-roll). The floor is applied as a STARTING RATING,
 * not a rate multiplier: formMemoryMult in the rate (§2.5) stays 1.00 during a life —
 * do NOT touch the rate. Lifetime totals persist across resets.
 *
 * ADDITIVE: this is standalone, like the W2-W6 engine modules. It is NOT wired into the
 * live PrestigeResetService (off-limits, legacy-bound) — the live wiring happens at the
 * W13 cutover. Coefficients are ‹tune W12›; the structure is the fixed contract.
 */

import { SPIRIT_ROOT_GRADES, type MeridianRootRoll, type SpiritRootGrade } from '../meridians/meridianModel.js';
import { COMPREHENSION_FLOOR, type MeridianTrainingState } from '../meridians/meridianTrainingState.js';

/** Carry-over exponent e ∈ [0.5, 0.8] (§3.6 / §2.11) ‹tune W12›. */
export const MERIDIAN_FORM_MEMORY_EXPONENT = 0.6;
/** Floor multiplier m (small) ‹tune W12›. */
export const MERIDIAN_FORM_MEMORY_MULT = 0.5;

/** Persisted per-meridian sum of all rating ever invested, across reincarnations. */
export type MeridianLifetimeTotals = Record<string, number>;

/** floor((lifetime)^e) × m — the permanent starting rating granted after reincarnation. */
export function formMemoryFloor(lifetimeRating: number): number {
  if (!Number.isFinite(lifetimeRating) || lifetimeRating <= 0) return 0;
  return Math.floor(Math.pow(lifetimeRating, MERIDIAN_FORM_MEMORY_EXPONENT) * MERIDIAN_FORM_MEMORY_MULT);
}

/** Fold this life's per-meridian ratings into the persisted lifetime totals. */
export function accumulateLifetimeRatings(
  lifetime: MeridianLifetimeTotals,
  state: MeridianTrainingState,
): MeridianLifetimeTotals {
  const next: MeridianLifetimeTotals = { ...lifetime };
  for (const [id, progress] of Object.entries(state.progressByMeridianId)) {
    next[id] = (next[id] ?? 0) + Math.max(0, progress.rating);
  }
  return next;
}

/**
 * Re-roll grade weights ‹tune W12›. Cover every SPIRIT_ROOT_GRADE; sum to 1.
 * Mortal/earthly common, heavenly/chaos rare — talent is real and mostly fixed (§3.7),
 * reincarnation is the only re-roll.
 */
export const MERIDIAN_ROOT_ROLL_WEIGHTS: Record<SpiritRootGrade, number> = {
  heavenly: 0.05,
  true: 0.2,
  earthly: 0.35,
  mortal: 0.3,
  chaos: 0.1,
};

/** Roll one spirit-root grade from the weighted table using a [0,1) rng. */
export function rollSpiritRootGrade(rng: () => number): SpiritRootGrade {
  const r = Math.min(0.9999999, Math.max(0, rng()));
  let acc = 0;
  for (const grade of SPIRIT_ROOT_GRADES) {
    acc += MERIDIAN_ROOT_ROLL_WEIGHTS[grade];
    if (r < acc) return grade;
  }
  return SPIRIT_ROOT_GRADES[SPIRIT_ROOT_GRADES.length - 1];
}

/** Re-roll the spirit root of every meridian (reincarnation, §2.3). */
export function rerollMeridianRoots(meridianIds: readonly string[], rng: () => number): MeridianRootRoll {
  const roll: MeridianRootRoll = {};
  for (const id of meridianIds) roll[id] = rollSpiritRootGrade(rng);
  return roll;
}

export interface FormMemoryResetResult {
  /** Updated persisted lifetime totals (this life folded in). */
  lifetime: MeridianLifetimeTotals;
  /** The fresh next-life training state: ratings = floor, comprehension reset, roots re-rolled. */
  state: MeridianTrainingState;
}

/**
 * Apply a reincarnation: fold this life into lifetime totals, then build the next life's
 * training state — each meridian starts at its Form-Memory floor (not 0), comprehension
 * resets to the floor (relearn), mastery resets, and roots re-roll. activeMeridianId is
 * carried (the player keeps their chosen active meridian).
 */
export function applyFormMemoryReset(
  lifetime: MeridianLifetimeTotals,
  state: MeridianTrainingState,
  meridianIds: readonly string[],
  rng: () => number,
): FormMemoryResetResult {
  const nextLifetime = accumulateLifetimeRatings(lifetime, state);
  const rootByMeridianId = rerollMeridianRoots(meridianIds, rng);
  const progressByMeridianId: MeridianTrainingState['progressByMeridianId'] = {};
  for (const id of meridianIds) {
    progressByMeridianId[id] = {
      rating: formMemoryFloor(nextLifetime[id] ?? 0),
      ratingXp: 0,
      masteryXp: 0,
      comprehension: COMPREHENSION_FLOOR,
    };
  }
  return {
    lifetime: nextLifetime,
    state: { activeMeridianId: state.activeMeridianId, rootByMeridianId, progressByMeridianId },
  };
}
