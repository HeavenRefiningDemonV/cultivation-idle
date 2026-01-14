import type { ForgeStepDef } from '../../systems/crafting/craftingTypes';
import { nextSeed, randFloat } from '../../utils/rng.js';

export type ForgeSessionMode = 'IDLE' | 'ASSISTED' | 'HANDS_ON';
export type ForgeSessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
export type ForgeRingStage = 'STRIKE' | 'ENGRAVE' | 'FORMATION';

export type ForgeBlueprintDefinition = {
  id: string;
  stepScript: ForgeStepDef[];
};

export type ForgeSessionScoring = {
  qualityScore: number;
  heatScore: number;
  strikeScore: number;
  specialScore: number;
  heatPassScores: number[];
  strikePhaseScores: number[];
  specialStepScores: number[];
};

export type ForgeSessionState = {
  id: string;
  blueprintId: string;
  mode: ForgeSessionMode;
  stepIndex: number;
  stepStartedAt: number;
  stepEndsAt: number | null;
  seed: number;
  scoring: ForgeSessionScoring;
  status: ForgeSessionStatus;
  lastUpdatedAt: number;
  patternSeedsByStepId: Record<string, number>;
};

export type ForgeStepResolution =
  | {
      type: 'HEAT';
      stepId: string;
      score: number;
    }
  | {
      type: 'RING_QTE';
      stepId: string;
      stage: ForgeRingStage;
      hitsLanded: number;
      hitsRequired: number;
      timingScore?: number;
    }
  | {
      type: 'GENERIC';
      stepId: string;
      score: number;
    };

const QUALITY_WEIGHTS = {
  heat: 0.45,
  strike: 0.45,
  special: 0.1,
};

const BASELINE_SCORES: Record<ForgeSessionMode, number> = {
  IDLE: 60,
  ASSISTED: 75,
  HANDS_ON: 60,
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, value));

const averageScore = (values: number[], fallback: number): number => {
  if (!values.length) return fallback;
  return clampScore(values.reduce((sum, score) => sum + score, 0) / values.length);
};

const createRng = (seed: number): (() => number) => {
  let current = seed || 1;
  return () => {
    const roll = randFloat(current);
    current = roll.seed;
    return roll.value;
  };
};

const hashSeed = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

const isHeatStep = (step: ForgeStepDef): boolean => step.type === 'HEAT_TO' || step.type === 'HEAT_MATERIAL';

const isStrikeStep = (step: ForgeStepDef): boolean => step.type === 'HAMMER_PATTERN';

const isSpecialStep = (step: ForgeStepDef): boolean => step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION';

const getRingStage = (step: ForgeStepDef): ForgeRingStage => {
  if (step.type === 'ENGRAVE_RUNE') return 'ENGRAVE';
  if (step.type === 'LAY_FORMATION') return 'FORMATION';
  return 'STRIKE';
};

const getStepHits = (step: ForgeStepDef): number => {
  if (step.type === 'HAMMER_PATTERN') return Math.max(1, Math.floor(step.hits));
  if (step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION') return Math.max(1, Math.floor(step.hits ?? 4));
  return 1;
};

const computeRingScore = (hitsLanded: number, hitsRequired: number, timingScore?: number): number => {
  const hitRatio = clampScore((hitsLanded / Math.max(1, hitsRequired)) * 100) / 100;
  const timing = clampScore((timingScore ?? 0.65) * 100) / 100;
  return clampScore((hitRatio * 0.7 + timing * 0.3) * 100);
};

const resolveWeighting = (hasSpecial: boolean) => {
  if (hasSpecial) return QUALITY_WEIGHTS;
  return { heat: 0.5, strike: 0.5, special: 0 };
};

const computeQualityScore = (
  scoring: ForgeSessionScoring,
  mode: ForgeSessionMode,
  hasSpecial: boolean,
): ForgeSessionScoring => {
  const baseline = BASELINE_SCORES[mode];
  const heatScore = averageScore(scoring.heatPassScores, baseline);
  const strikeScore = averageScore(scoring.strikePhaseScores, baseline);
  const specialScore = averageScore(scoring.specialStepScores, baseline);
  const weights = resolveWeighting(hasSpecial);
  const qualityScore = clampScore(heatScore * weights.heat + strikeScore * weights.strike + specialScore * weights.special);
  return {
    ...scoring,
    heatScore,
    strikeScore,
    specialScore,
    qualityScore,
  };
};

const buildPatternSeeds = (steps: ForgeStepDef[], seed: number): Record<string, number> => {
  const rng = createRng(seed);
  return steps.reduce<Record<string, number>>((acc, step) => {
    if (isStrikeStep(step) || isSpecialStep(step)) {
      acc[step.id] = nextSeed(hashSeed(`${step.id}-${Math.floor(rng() * 100000)}`));
    }
    return acc;
  }, {});
};

export function createForgeSession(
  blueprint: ForgeBlueprintDefinition,
  mode: ForgeSessionMode,
  now: number,
  seed?: number | string,
): ForgeSessionState {
  const resolvedSeed =
    typeof seed === 'number' ? seed : typeof seed === 'string' ? hashSeed(seed) : nextSeed(hashSeed(`${blueprint.id}-${now}`));
  const scoring: ForgeSessionScoring = {
    qualityScore: 0,
    heatScore: 0,
    strikeScore: 0,
    specialScore: 0,
    heatPassScores: [],
    strikePhaseScores: [],
    specialStepScores: [],
  };
  const hasSpecial = blueprint.stepScript.some((step) => isSpecialStep(step));
  return {
    id: `forge_${blueprint.id}_${resolvedSeed}`,
    blueprintId: blueprint.id,
    mode,
    stepIndex: 0,
    stepStartedAt: now,
    stepEndsAt: null,
    seed: resolvedSeed,
    scoring: computeQualityScore(scoring, mode, hasSpecial),
    status: 'ACTIVE',
    lastUpdatedAt: now,
    patternSeedsByStepId: buildPatternSeeds(blueprint.stepScript, resolvedSeed),
  };
}

export function getCurrentForgeStep(session: ForgeSessionState, blueprint: ForgeBlueprintDefinition): ForgeStepDef | null {
  if (session.status !== 'ACTIVE') return null;
  return blueprint.stepScript[session.stepIndex] ?? null;
}

export function applyForgeStepResult(
  session: ForgeSessionState,
  blueprint: ForgeBlueprintDefinition,
  result: ForgeStepResolution,
): ForgeSessionState {
  const currentStep = getCurrentForgeStep(session, blueprint);
  if (!currentStep || currentStep.id !== result.stepId) {
    return session;
  }

  const scoring: ForgeSessionScoring = {
    ...session.scoring,
    heatPassScores: [...session.scoring.heatPassScores],
    strikePhaseScores: [...session.scoring.strikePhaseScores],
    specialStepScores: [...session.scoring.specialStepScores],
  };

  if (result.type === 'HEAT' && isHeatStep(currentStep)) {
    scoring.heatPassScores.push(clampScore(result.score));
  }

  if (result.type === 'RING_QTE' && (isStrikeStep(currentStep) || isSpecialStep(currentStep))) {
    const ringScore = computeRingScore(result.hitsLanded, result.hitsRequired, result.timingScore);
    if (result.stage === 'STRIKE') {
      scoring.strikePhaseScores.push(ringScore);
    } else {
      scoring.specialStepScores.push(ringScore);
    }
  }

  if (result.type === 'GENERIC' && currentStep.type === 'FINISH') {
    // Finish step does not influence scoring directly.
  }

  const nextIndex = session.stepIndex + 1;
  const status = nextIndex >= blueprint.stepScript.length ? 'COMPLETED' : session.status;
  const hasSpecial = blueprint.stepScript.some((step) => isSpecialStep(step));
  const updatedScoring = computeQualityScore(scoring, session.mode, hasSpecial);

  return {
    ...session,
    stepIndex: nextIndex,
    scoring: updatedScoring,
    status,
    lastUpdatedAt: session.lastUpdatedAt + 1,
  };
}

export function resolveBaselineStep(session: ForgeSessionState, blueprint: ForgeBlueprintDefinition): ForgeSessionState {
  const currentStep = getCurrentForgeStep(session, blueprint);
  if (!currentStep) return session;
  const baseline = BASELINE_SCORES[session.mode];

  if (isHeatStep(currentStep)) {
    return applyForgeStepResult(session, blueprint, {
      type: 'HEAT',
      stepId: currentStep.id,
      score: baseline,
    });
  }

  if (isStrikeStep(currentStep) || isSpecialStep(currentStep)) {
    const hitsRequired = getStepHits(currentStep);
    const hitsLanded = Math.round((baseline / 100) * hitsRequired);
    return applyForgeStepResult(session, blueprint, {
      type: 'RING_QTE',
      stepId: currentStep.id,
      stage: getRingStage(currentStep),
      hitsLanded,
      hitsRequired,
      timingScore: baseline / 100,
    });
  }

  return applyForgeStepResult(session, blueprint, {
    type: 'GENERIC',
    stepId: currentStep.id,
    score: baseline,
  });
}
