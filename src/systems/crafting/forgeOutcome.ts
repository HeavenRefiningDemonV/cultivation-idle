import { nextSeed, randFloat } from '../../utils/rng.js';
import type {
  CraftScript,
  ForgeHandsOnBonus,
  ForgeSessionOutcome,
  ForgeStepResult,
} from './craftingTypes';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function createRng(seed: number): () => number {
  let current = seed || 1;
  return () => {
    const roll = randFloat(current);
    current = roll.seed;
    return roll.value;
  };
}

function findPerformance<T extends ForgeStepResult['type']>(
  performances: ForgeStepResult[],
  stepId: string,
  type: T,
): Extract<ForgeStepResult, { type: T }> | undefined {
  return performances.find((perf) => perf.stepId === stepId && perf.type === type) as
    | Extract<ForgeStepResult, { type: T }>
    | undefined;
}

function scoreHeatRange(
  targetMin: number,
  targetMax: number,
  holdMs: number | undefined,
  performance?: Extract<ForgeStepResult, { type: 'HEAT_MATERIAL' | 'TEMPER' }>,
  rng?: () => number,
): number {
  const achievedMin = performance?.achievedMin ?? targetMin;
  const achievedMax = performance?.achievedMax ?? targetMax;
  const targetSpan = Math.max(1, targetMax - targetMin);
  const achievedSpan = Math.max(1, achievedMax - achievedMin);
  const overlapMin = Math.max(targetMin, achievedMin);
  const overlapMax = Math.min(targetMax, achievedMax);
  const overlap = Math.max(0, overlapMax - overlapMin);
  const overlapScore = clamp01(overlap / targetSpan);
  const centerDiff = Math.abs((targetMin + targetMax) / 2 - (achievedMin + achievedMax) / 2);
  const centerScore = clamp01(1 - centerDiff / (targetSpan * 1.5));
  const holdScore = holdMs && performance?.holdMs
    ? clamp01(performance.holdMs / holdMs)
    : rng
        ? 0.5 + rng() * 0.1
        : 0.55;
  const total = overlapScore * 0.55 + centerScore * 0.25 + holdScore * 0.2;
  return clamp01(total);
}

function scoreHammerPattern(
  hits: number,
  tolerance: number,
  performance?: Extract<ForgeStepResult, { type: 'HAMMER_PATTERN' }>,
  rng?: () => number,
): number {
  if (!performance) return rng ? 0.5 + rng() * 0.1 : 0.55;
  const hitRatio = clamp01(performance.hitsLanded / Math.max(1, performance.hitsRequired));
  const timing = clamp01(performance.timingScore ?? (rng ? rng() * 0.2 + 0.6 : 0.65));
  const toleranceScore = clamp01(1 - Math.abs(1 - hitRatio) * (1 + tolerance));
  return clamp01(hitRatio * 0.6 + timing * 0.25 + toleranceScore * 0.15);
}

function scoreQuench(
  timingWindow:
    | {
        goodMin: number;
        goodMax: number;
        perfectMin: number;
        perfectMax: number;
      }
    | undefined,
  performance?: Extract<ForgeStepResult, { type: 'QUENCH' }>,
  rng?: () => number,
): number {
  if (!timingWindow) return rng ? 0.55 + rng() * 0.1 : 0.6;
  const timing = performance?.timingMs;
  if (typeof timing !== 'number') return rng ? 0.55 + rng() * 0.1 : 0.6;
  if (timing >= timingWindow.perfectMin && timing <= timingWindow.perfectMax) return 1;
  if (timing >= timingWindow.goodMin && timing <= timingWindow.goodMax) return 0.8;
  const distance = Math.min(
    Math.abs(timing - timingWindow.goodMin),
    Math.abs(timing - timingWindow.goodMax),
  );
  const windowSpan = Math.max(1, timingWindow.goodMax - timingWindow.goodMin);
  const falloff = clamp01(1 - distance / (windowSpan * 2));
  return clamp01(0.4 + falloff * 0.4);
}

function scoreTemper(
  targetMin: number,
  targetMax: number,
  expectedHoldMs: number | undefined,
  performance?: Extract<ForgeStepResult, { type: 'TEMPER' }>,
  rng?: () => number,
): number {
  if (!performance) return rng ? 0.55 + rng() * 0.1 : 0.6;
  const center = (targetMin + targetMax) / 2;
  const perfCenter = ((performance.achievedMin ?? center) + (performance.achievedMax ?? center)) / 2;
  const variance = Math.abs(center - perfCenter) / Math.max(1, targetMax - targetMin);
  const holdScore =
    expectedHoldMs && performance.holdMs
      ? clamp01(performance.holdMs / expectedHoldMs)
      : rng
        ? 0.6 + rng() * 0.1
        : 0.6;
  return clamp01((1 - variance) * 0.7 + holdScore * 0.3);
}

function scoreEngrave(performance?: Extract<ForgeStepResult, { type: 'ENGRAVE_RUNE' }>, rng?: () => number): number {
  if (!performance) return rng ? 0.5 + rng() * 0.1 : 0.55;
  const precision = clamp01(performance.precision ?? (rng ? rng() * 0.25 + 0.6 : 0.6));
  const success = performance.success === false ? 0.4 : 1;
  return clamp01(precision * 0.7 + success * 0.3);
}

function scoreCastOrShape(performance?: Extract<ForgeStepResult, { type: 'CAST_OR_SHAPE' }>, rng?: () => number): number {
  if (!performance) return rng ? 0.55 + rng() * 0.1 : 0.55;
  const base = clamp01(performance.precision ?? 0.65);
  const success = performance.success === false ? 0.4 : 1;
  return clamp01(base * 0.7 + success * 0.3);
}

function scoreAlloyMix(
  options: ForgeStepResult['type'] extends never ? never : Array<{ id: string; qualityDelta?: number }> | undefined,
  performance?: Extract<ForgeStepResult, { type: 'ALLOY_MIX' }>,
  rng?: () => number,
): number {
  if (!performance) return rng ? 0.55 + rng() * 0.1 : 0.55;
  const selected = options?.find((opt) => opt.id === performance.choiceId);
  const delta = selected?.qualityDelta ?? performance.qualityDelta ?? 0;
  return clamp01(0.55 + delta);
}

function scaleBonus(value: number | undefined, score: number): number {
  if (!value || value === 0) return 0;
  return value * clamp01(score);
}

export function computeForgeOutcome(params: {
  script: CraftScript;
  performances: ForgeStepResult[];
  handsOnBonus?: ForgeHandsOnBonus;
  seed: number;
}): ForgeSessionOutcome {
  const rng = createRng(params.seed);
  const steps = params.script.steps;
  const heatScores: number[] = [];
  const hammerScores: number[] = [];
  const quenchScores: number[] = [];
  const temperScores: number[] = [];

  steps.forEach((step) => {
    switch (step.type) {
      case 'HEAT_MATERIAL': {
        const perf = findPerformance(params.performances, step.id, 'HEAT_MATERIAL');
        heatScores.push(scoreHeatRange(step.targetMin, step.targetMax, step.holdMs, perf, rng));
        break;
      }
      case 'HAMMER_PATTERN': {
        const perf = findPerformance(params.performances, step.id, 'HAMMER_PATTERN');
        hammerScores.push(scoreHammerPattern(step.hits, step.tolerance, perf, rng));
        break;
      }
      case 'CAST_OR_SHAPE': {
        const perf = findPerformance(params.performances, step.id, 'CAST_OR_SHAPE');
        hammerScores.push(scoreCastOrShape(perf, rng));
        break;
      }
      case 'ALLOY_MIX': {
        const perf = findPerformance(params.performances, step.id, 'ALLOY_MIX');
        hammerScores.push(scoreAlloyMix(step.options, perf, rng));
        break;
      }
      case 'QUENCH': {
        const perf = findPerformance(params.performances, step.id, 'QUENCH');
        quenchScores.push(scoreQuench(step.timingWindow, perf, rng));
        break;
      }
      case 'TEMPER': {
        const perf = findPerformance(params.performances, step.id, 'TEMPER');
        const targetMin = step.targetMin ?? step.targetHeat - 20;
        const targetMax = step.targetMax ?? step.targetHeat + 20;
        heatScores.push(scoreTemper(targetMin, targetMax, step.holdMs ?? step.durationMs, perf, rng));
        temperScores.push(scoreTemper(targetMin, targetMax, step.holdMs ?? step.durationMs, perf, rng));
        break;
      }
      case 'ENGRAVE_RUNE': {
        const perf = findPerformance(params.performances, step.id, 'ENGRAVE_RUNE');
        temperScores.push(scoreEngrave(perf, rng));
        break;
      }
      default:
        break;
    }
  });

  const avg = (values: number[], fallback: number) => {
    if (!values || values.length === 0) return fallback;
    return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length);
  };

  const heatScore = avg(heatScores, 0.6);
  const hammerScore = avg(hammerScores, 0.6);
  const quenchScore = avg(quenchScores, 0.6);
  const temperScore = avg(temperScores, 0.6);
  const scoreOverall = clamp01((heatScore + hammerScore + quenchScore + temperScore) / 4);

  const bonus = params.handsOnBonus ?? {};
  const timeReductionPctApplied = scaleBonus(bonus.timeReductionPct, scoreOverall);
  const qualityProcChanceBonusPct = scaleBonus(bonus.qualityProcChancePct, scoreOverall);
  const masteryMultApplied = bonus.masteryMult ? 1 + (bonus.masteryMult - 1) * scoreOverall : 1;
  const temperProcChanceBonusPctApplied = scaleBonus(bonus.temperProcChancePct, scoreOverall);

  return {
    scoreOverall,
    heatScore,
    hammerScore,
    quenchScore,
    temperScore,
    timeReductionPctApplied,
    qualityProcChanceBonusPct,
    masteryMultApplied,
    temperProcChanceBonusPctApplied,
  };
}
