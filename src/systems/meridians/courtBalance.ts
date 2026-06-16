/**
 * W12 — the single balance-tuning surface (D6/D7: "expose as a single balance
 * constant"). Every coefficient authored across the meridian engine as a ‹tune W12›
 * starting value is aggregated here into ONE audit object, REFERENCING (not redefining)
 * the live consts so nothing can drift. The structure — which source feeds which derived
 * stat (Appendix B), the rate-formula shape (§2.5), the floor formula (§2.11) — is the
 * fixed contract; only these NUMBERS are tunable. A balance pass edits the source consts;
 * this object + courtBalanceGuard.test.ts are the single place to see and lock them.
 *
 * Appendix B leaves the derived k's as ‹tune W12› (no canonical "tuned reals"), so W12
 * ships the documented starting values and reconciles the derived SOURCE STRUCTURE with
 * Appendix B (4 fixes in derivedStats: marrow→maxHp, body-temper→physAttack,
 * iron-skin→physDefense, mountain-stance→staggerResist). Real number tuning awaits
 * playtest/sim; the structure is now canon-locked by the guard test.
 */

import { COURT_INTENSITY_RATE, MERIDIAN_RATE_CLAMP, MERIDIAN_RATE_TUNING } from './computeMeridianRate.js';
import { COMPREHENSION_FLOOR, COMPREHENSION_RAMP, MASTERY_TIME_SHARE } from './meridianTrainingState.js';
import { DEFAULT_PER_FIGHT_PASSIVE_CAP, PASSIVE_RATE } from './passiveCombatTraining.js';
import { DERIVED_BASE, DERIVED_WEIGHT_COEF } from './derivedStats.js';
import {
  MERIDIAN_FORM_MEMORY_EXPONENT,
  MERIDIAN_FORM_MEMORY_MULT,
  MERIDIAN_ROOT_ROLL_WEIGHTS,
} from '../prestige/formMemory.js';

export const COURT_BALANCE = {
  /** §2.5 — training rate. */
  rate: {
    intensity: COURT_INTENSITY_RATE,
    clamp: MERIDIAN_RATE_CLAMP,
    tuning: MERIDIAN_RATE_TUNING,
  },
  /** §2.6 / §2.7 — mastery share + comprehension ramp. */
  training: {
    masteryTimeShare: MASTERY_TIME_SHARE,
    comprehensionFloor: COMPREHENSION_FLOOR,
    comprehensionRamp: COMPREHENSION_RAMP,
  },
  /** §2.9 — passive combat training. */
  passive: {
    rate: PASSIVE_RATE,
    perFightCap: DEFAULT_PER_FIGHT_PASSIVE_CAP,
  },
  /** Appendix B — Tier-3 derived weights + bases (k's are ‹tune W12›). */
  derived: {
    weight: DERIVED_WEIGHT_COEF,
    base: DERIVED_BASE,
  },
  /** §2.11 — prestige Form-Memory floor + root re-roll. */
  formMemory: {
    exponent: MERIDIAN_FORM_MEMORY_EXPONENT,
    mult: MERIDIAN_FORM_MEMORY_MULT,
    rootRollWeights: MERIDIAN_ROOT_ROLL_WEIGHTS,
  },
} as const;
