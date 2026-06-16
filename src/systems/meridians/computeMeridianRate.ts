import { MERIDIAN_ROOTS, type SpiritRootGrade } from './meridianModel.js';

/**
 * W3 — the Tempering Court training-rate formula (§2.5), as a pure function. Returns
 * the clamped rate multiplier (a multiple of baseRate) plus the per-factor breakdown
 * the Practice-Tempo lens renders 1:1 (Appendix H.5 order). This is ADDITIVE: the
 * legacy tri-stat engine (trainingProgressionResolver) is untouched and stays the
 * default until the W13 cutover.
 *
 * Preserved constants (§2.12): intensity multipliers, the fatigue dampening curve,
 * and the 2.25 max-tick clamp are the existing engine's values, re-stated here for the
 * one-meridian model (N12/N13 lock them against drift). New factors (perception,
 * aptitude, regimen mastery, comprehension, cap-falloff, path affinity) carry
 * ‹tune W12› starting values — the structure is fixed, the numbers are tunable.
 */

export const MERIDIAN_RATE_CLAMP = 2.25;

export type CourtIntensityId = 'quiet' | 'steady' | 'harsh' | 'limit';

/** Preserved intensity rate multipliers (§2.12). Mirror training_regimens.json (N13). */
export const COURT_INTENSITY_RATE: Record<CourtIntensityId, number> = {
  quiet: 0.7,
  steady: 1.0,
  harsh: 1.35,
  limit: 1.75,
};

/** ‹tune W12› balance constants. Structure fixed; values tunable in W12. */
export const MERIDIAN_RATE_TUNING = {
  perceptionPivot: 20,
  perceptionSlope: 0.006,
  masterySlope: 0.012,
  pathAffinity: 1.2,
  capFalloffStart: 0.85,
  capFalloffSpan: 0.15,
  capFalloffStrength: 0.62,
  capFalloffFloor: 0.35,
  fatiguePivot: 40,
  fatigueSlope: 0.009,
  fatigueFloor: 0.4,
} as const;

export type RateFactorDir = 'up' | 'down' | 'flat' | 'bad';

export interface RateFactor {
  key: string;
  label: string;
  value: number;
  dir: RateFactorDir;
  note?: string;
}

export interface MeridianRateContext {
  intensityId: CourtIntensityId;
  fatigue: number; // 0..100
  perception: number; // Tier-0 Perception
  rootGrade: SpiritRootGrade;
  masteryRank: number; // 0..10
  comprehension: number; // 0..1
  capPct: number; // rating / effectiveCap
  offline?: boolean;
  formMemoryMult?: number; // 1.00 unless a prestige floor double-counts (it never does; §2.11)
}

export interface MeridianRateResult {
  mult: number; // clamped product (multiple of baseRate)
  rawMult: number; // unclamped product
  clampMax: number; // 2.25
  factors: RateFactor[]; // Practice-Tempo lens order
}

/** Fatigue dampening (§2.12, PRESERVED curve). */
export function fatigueDampening(fatigue: number): number {
  const t = MERIDIAN_RATE_TUNING;
  return Math.max(t.fatigueFloor, Math.min(1, 1 - Math.max(0, fatigue - t.fatiguePivot) * t.fatigueSlope));
}

/** Near-cap rate throttle (§2.8). */
export function capFalloff(capPct: number): number {
  const t = MERIDIAN_RATE_TUNING;
  return Math.max(t.capFalloffFloor, 1 - (Math.max(0, capPct - t.capFalloffStart) / t.capFalloffSpan) * t.capFalloffStrength);
}

function perceptionMult(perception: number): number {
  const t = MERIDIAN_RATE_TUNING;
  return Math.max(0, 1 + (perception - t.perceptionPivot) * t.perceptionSlope);
}

function regimenMasteryMult(rank: number): number {
  return 1 + Math.max(0, rank) * MERIDIAN_RATE_TUNING.masterySlope;
}

function dirOf(value: number, badFloor?: number): RateFactorDir {
  if (badFloor !== undefined && value <= badFloor + 1e-9) return 'bad';
  if (value > 1 + 1e-9) return 'up';
  if (value < 1 - 1e-9) return 'down';
  return 'flat';
}

export function computeMeridianRate(ctx: MeridianRateContext): MeridianRateResult {
  const intensity = COURT_INTENSITY_RATE[ctx.intensityId] ?? 1;
  const damp = fatigueDampening(ctx.fatigue);
  const perception = perceptionMult(ctx.perception);
  const aptitude = MERIDIAN_ROOTS[ctx.rootGrade].rateMult;
  const mastery = regimenMasteryMult(ctx.masteryRank);
  const comprehension = Math.max(0, Math.min(1, ctx.comprehension));
  const falloff = capFalloff(ctx.capPct);
  const pathAffinity = MERIDIAN_RATE_TUNING.pathAffinity;
  const offline = 1; // online vs offline uses the same rate; offline runs the same advance path (§2.5)
  const formMemory = ctx.formMemoryMult ?? 1;

  // Lens order (Appendix H.5): regimen mastery, intensity, perception, spirit root,
  // fatigue, comprehension, cap falloff, path affinity, offline, form memory.
  const factors: RateFactor[] = [
    { key: 'regimenMastery', label: 'Regimen mastery', value: mastery, dir: dirOf(mastery) },
    { key: 'intensity', label: 'Intensity', value: intensity, dir: dirOf(intensity) },
    { key: 'perception', label: 'Perception', value: perception, dir: dirOf(perception) },
    { key: 'aptitude', label: 'Spirit root', value: aptitude, dir: dirOf(aptitude), note: MERIDIAN_ROOTS[ctx.rootGrade].label },
    { key: 'fatigue', label: 'Forge heat', value: damp, dir: dirOf(damp, MERIDIAN_RATE_TUNING.fatigueFloor) },
    { key: 'comprehension', label: 'Comprehension', value: comprehension, dir: dirOf(comprehension) },
    { key: 'capFalloff', label: 'Cap falloff', value: falloff, dir: dirOf(falloff, MERIDIAN_RATE_TUNING.capFalloffFloor) },
    { key: 'pathAffinity', label: 'Path affinity', value: pathAffinity, dir: dirOf(pathAffinity) },
    { key: 'offline', label: 'Offline', value: offline, dir: dirOf(offline) },
    { key: 'formMemory', label: 'Form memory', value: formMemory, dir: dirOf(formMemory) },
  ];

  const rawMult = factors.reduce((acc, factor) => acc * factor.value, 1);
  const mult = Math.min(MERIDIAN_RATE_CLAMP, rawMult);
  return { mult, rawMult, clampMax: MERIDIAN_RATE_CLAMP, factors };
}
