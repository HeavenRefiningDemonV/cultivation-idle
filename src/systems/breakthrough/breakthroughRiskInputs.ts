/**
 * M.II.1 — CULT-MECH sub-objective A: map the LIVE cultivator-stat ratings to the four
 * breakthrough-risk inputs that the resolver already accepts but that gameStore.breakthrough()
 * currently omits (so they read 0 / are inert today). This is the SOLE consumer that makes
 * qi_purity / body_integrity / dao_stability mechanically real for the first time.
 *
 * Gameplay-truth note (current-build-is-truth): those stats live in
 * useTrainingStore.statRatingsById and carry `deferredEffect: true` in stats.json — which the
 * content validator REQUIRES (validators.ts: "must mark effect as deferred for Mega Prompt 0").
 * `deferredEffect` means "no system consumes this stat yet", NOT "the value is zero". We do not
 * flip that flag (out of scope; content/D15 own it); we simply become the first reader. When
 * the source is unavailable (no bootstrap, fresh char), every input is 0 — byte-identical to
 * today's behavior (the §K.1 fallback; never a regression).
 *
 * Pure (no stores, no React). Every magnitude is [tune] → D15; the ceilings mirror the
 * authored maxEffectSummary in stats.json: qi_purity "risk -8", dao_stability "risk -12",
 * body_integrity "injury -8".
 */

export interface BreakthroughRiskStatInput {
  /** statRatingsById['qi_purity'] — purer qi steadies the breakthrough. */
  qiPurity: number;
  /** statRatingsById['body_integrity'] — a tempered body resists breakthrough injury. */
  bodyIntegrity: number;
  /** statRatingsById['dao_stability'] — a stable dao-heart is the largest risk reducer. */
  daoStability: number;
  /** training fatigue (useTrainingStore.fatigue) — fatigue makes the rite less steady. */
  fatigue: number;
}

export interface BreakthroughRiskInputs {
  qiPurityRiskReduction: number;
  safetyPrepRiskReduction: number;
  injuryRiskDelta: number;
  fatigueRiskDelta: number;
}

// [tune] → D15 §13 (breakthrough/tribulation) / §3 (stats). Ceilings from stats.json
// maxEffectSummary; soft-cap half-saturation values are first-pass shapes for D15 to tune.
const QI_PURITY_RISK_REDUCTION_MAX = 8; // qi_purity "risk -8" [tune]
const DAO_STABILITY_RISK_REDUCTION_MAX = 12; // dao_stability "Breakthrough risk -12" [tune]
const BODY_INTEGRITY_INJURY_MAX = 8; // body_integrity "backlash/injury -8" — the injury-pressure ceiling [tune]
const FATIGUE_RISK_MAX = 10; // [tune]
const STAT_SOFTCAP_HALF = 60; // rating at which a stat term reaches half its ceiling [tune]
const FATIGUE_SOFTCAP_HALF = 50; // fatigue at which the fatigue term reaches half its ceiling [tune]
const INJURY_MINOR_WEIGHT = 0.2; // risk points per minorInjuryPct [tune]
const INJURY_MAJOR_WEIGHT = 0.6; // risk points per majorInjuryPct [tune]

/** Diminishing-returns curve → [0,1): v/(v+half). Monotonic increasing, never saturates hard. */
function softCap01(value: number, half: number): number {
  const v = Math.max(0, value);
  if (half <= 0) return v > 0 ? 1 : 0;
  return v / (v + half);
}

/**
 * The injury-risk pressure a realm transition carries, in risk points, derived from the
 * realm's authored injury percentages (breakthroughStabilityResolver TRANSITION_RISK). 0 at
 * Qi Condensation (no injury), rising with realm — so body_integrity mitigates injury exactly
 * where injuries happen, and an untrained fresh cultivator at an injury-free realm is byte-
 * identical to the pre-packet behavior (no penalty). [tune] → D15 §13.
 */
export function realmInjuryRiskPressure(minorInjuryPct: number, majorInjuryPct: number): number {
  const pressure = Math.max(0, minorInjuryPct) * INJURY_MINOR_WEIGHT + Math.max(0, majorInjuryPct) * INJURY_MAJOR_WEIGHT;
  return Math.min(BODY_INTEGRITY_INJURY_MAX, pressure);
}

export const EMPTY_BREAKTHROUGH_RISK_INPUTS: BreakthroughRiskInputs = {
  qiPurityRiskReduction: 0,
  safetyPrepRiskReduction: 0,
  injuryRiskDelta: 0,
  fatigueRiskDelta: 0,
};

/**
 * Map live stat ratings → the four risk inputs. Higher qi_purity / dao_stability → larger
 * risk REDUCTIONS; higher body_integrity → smaller injury ADDEND (an untempered body carries
 * the full injury pressure, a tempered one removes it); higher fatigue → larger fatigue addend.
 * Net effect (asserted by breakthroughDerivedRiskContract): raising any of the three stats
 * lowers the resolved riskPercent.
 */
export function resolveBreakthroughRiskInputs(
  stat: BreakthroughRiskStatInput,
  options: { injuryPressure?: number } = {},
): BreakthroughRiskInputs {
  const qiPurityRiskReduction = QI_PURITY_RISK_REDUCTION_MAX * softCap01(stat.qiPurity, STAT_SOFTCAP_HALF);
  const safetyPrepRiskReduction = DAO_STABILITY_RISK_REDUCTION_MAX * softCap01(stat.daoStability, STAT_SOFTCAP_HALF);
  // The realm's injury pressure (0 at injury-free realms) is mitigated by body_integrity: a
  // tempered body removes it, an untempered one carries it. No pressure ⇒ no injury addend.
  const injuryPressure = Math.max(0, options.injuryPressure ?? 0);
  const injuryRiskDelta = injuryPressure * (1 - softCap01(stat.bodyIntegrity, STAT_SOFTCAP_HALF));
  const fatigueRiskDelta = FATIGUE_RISK_MAX * softCap01(stat.fatigue, FATIGUE_SOFTCAP_HALF);
  return { qiPurityRiskReduction, safetyPrepRiskReduction, injuryRiskDelta, fatigueRiskDelta };
}
