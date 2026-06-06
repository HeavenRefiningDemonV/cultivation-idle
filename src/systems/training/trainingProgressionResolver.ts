import type { TrainingIntensityId } from '../../content/types.js';
import { copyTrainingSaveState } from './trainingSaveState.js';
import { resolveTrainingRegimenUnlock } from './trainingUnlockPolicy.js';
import type {
  SaveTrainingState,
  TrainingTickInput,
  TrainingTickResult,
} from './trainingTypes.js';

export const TRAINING_REALM_BAND_MAX = [40, 60, 80, 100, 125, 150] as const;
export const TRAINING_BASE_REALM_XP = [12, 18, 27, 40, 60, 90] as const;

export const TRAINING_OUTPUT_WEIGHTS = {
  primaryStat: 1,
  secondaryStat: 0.45,
  foundationStat: 0.12,
  regimenMastery: 0.33,
  cappedPrimaryMastery: 0.5,
} as const;

const MAX_XP_MULTIPLIER = 2.25;

export function xpToNextTrainingRating(rating: number): number {
  return Math.ceil(8 + 1.1 * rating + 0.035 * rating * rating);
}

export function trainingStatCap(params: {
  realmIndex: number;
  substageIndex: number;
  prestigeFloor?: number;
}): number {
  const realmMax = TRAINING_REALM_BAND_MAX[params.realmIndex] ?? 150;
  return Math.min(
    realmMax,
    16 + 20 * params.realmIndex + 3 * params.substageIndex + (params.prestigeFloor ?? 0),
  );
}

export function fatigueDampening(fatigue: number): number {
  return Math.max(0.4, Math.min(1, 1 - Math.max(0, fatigue - 40) * 0.009));
}

export function capDampening(params: { rating: number; cap: number }): number {
  const { rating, cap } = params;
  if (rating >= cap) return 0.1;
  if (rating > cap - 4) return 0.35;
  if (rating > cap - 8) return 0.65;
  return 1;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const finiteOr = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const addRecord = (record: Record<string, number>, key: string, amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) return;
  record[key] = (record[key] ?? 0) + amount;
};

const getBaseRealmXp = (realmIndex: number): number =>
  TRAINING_BASE_REALM_XP[Math.max(0, Math.min(TRAINING_BASE_REALM_XP.length - 1, Math.floor(realmIndex)))] ?? 12;

function applyStatXp(params: {
  nextState: SaveTrainingState;
  statId: string;
  weight: number;
  baseXpPerMin: number;
  minutes: number;
  cap: number;
  reclaimMemory?: {
    multiplier: number;
    floorValue: number;
    priorBestRating: number;
  };
  gained: Record<string, number>;
  ratingGained: Record<string, number>;
}) {
  const startingRating = Math.max(0, Math.floor(params.nextState.statRatingsById[params.statId] ?? 0));
  const memoryFloor = Math.min(
    params.cap,
    Math.max(0, Math.floor(params.reclaimMemory?.floorValue ?? 0)),
    Math.max(0, Math.floor(params.reclaimMemory?.priorBestRating ?? 0)),
  );
  const currentRating = Math.max(startingRating, memoryFloor);
  if (currentRating > startingRating) {
    params.nextState.statRatingsById[params.statId] = currentRating;
    params.nextState.statXpById[params.statId] = 0;
    addRecord(params.ratingGained, params.statId, currentRating - startingRating);
  }
  if (currentRating >= params.cap) {
    params.nextState.statRatingsById[params.statId] = params.cap;
    params.nextState.statXpById[params.statId] = 0;
    return;
  }

  const effectiveXp = params.baseXpPerMin
    * params.weight
    * capDampening({ rating: currentRating, cap: params.cap })
    * params.minutes;

  if (effectiveXp <= 0) return;
  const memory = params.reclaimMemory;
  const priorBestRating = Math.min(params.cap, Math.max(0, Math.floor(memory?.priorBestRating ?? 0)));
  const multiplier = Math.max(1, finiteOr(memory?.multiplier, 1));
  let effectiveXpWithMemory = effectiveXp;
  if (memory && multiplier > 1 && currentRating < priorBestRating) {
    let xpToPriorBest = Math.max(0, xpToNextTrainingRating(currentRating) - Math.max(0, params.nextState.statXpById[params.statId] ?? 0));
    for (let rating = currentRating + 1; rating < priorBestRating; rating += 1) {
      xpToPriorBest += xpToNextTrainingRating(rating);
    }
    const boostedXp = effectiveXp * multiplier;
    if (boostedXp <= xpToPriorBest) {
      effectiveXpWithMemory = boostedXp;
    } else {
      const baseXpToBoundary = xpToPriorBest / multiplier;
      effectiveXpWithMemory = xpToPriorBest + Math.max(0, effectiveXp - baseXpToBoundary);
    }
  }

  let rating = currentRating;
  let xp = Math.max(0, params.nextState.statXpById[params.statId] ?? 0) + effectiveXpWithMemory;
  while (rating < params.cap) {
    const needed = xpToNextTrainingRating(rating);
    if (xp < needed) break;
    xp -= needed;
    rating += 1;
  }

  if (rating >= params.cap) {
    rating = params.cap;
    xp = 0;
  }

  params.nextState.statRatingsById[params.statId] = rating;
  params.nextState.statXpById[params.statId] = xp;
  addRecord(params.gained, params.statId, effectiveXpWithMemory);
  addRecord(params.ratingGained, params.statId, rating - currentRating);
}

const emptyTick = (
  state: SaveTrainingState,
  reason?: TrainingTickResult['reason'],
  appliedMs = 0,
): TrainingTickResult => ({
  ok: reason === undefined,
  reason,
  nextState: reason ? state : copyTrainingSaveState(state),
  statXpGainedById: {},
  ratingGainedById: {},
  masteryXpGainedByRegimenId: {},
  fatigueGained: 0,
  resourceDeltas: [],
  appliedMs,
});

export function resolveTrainingTick(input: TrainingTickInput): TrainingTickResult {
  const elapsedMs = Math.max(0, input.elapsedMs);
  if (elapsedMs <= 0) {
    return emptyTick(input.state, 'non_positive_elapsed');
  }

  const regimen = input.content.regimensById[input.regimenId];
  if (!regimen) {
    return emptyTick(input.state, 'invalid_regimen');
  }
  const intensity = input.content.intensitiesById[input.intensityId as TrainingIntensityId];
  if (!intensity) {
    return emptyTick(input.state, 'invalid_intensity');
  }
  if (!input.selectedPath) {
    return emptyTick(input.state, 'path_not_selected');
  }
  if (regimen.path !== input.selectedPath) {
    return emptyTick(input.state, 'path_mismatch');
  }
  if (!resolveTrainingRegimenUnlock({
    regimen,
    selectedPath: input.selectedPath,
    realmIndex: input.realmIndex,
  }).unlocked) {
    return emptyTick(input.state, 'regimen_locked');
  }

  const nextState = copyTrainingSaveState(input.state);
  const minutes = elapsedMs / 60_000;
  const baseRealmXp = getBaseRealmXp(input.realmIndex);
  const multiplier = clamp(
    regimen.regimenRate
      * intensity.xpMultiplier
      * finiteOr(input.pathAffinity, 1)
      * finiteOr(input.heartLawSupport, 1)
      * finiteOr(input.rootSupport, 1)
      * finiteOr(input.offlineEfficiency, 1)
      * fatigueDampening(nextState.fatigue),
    0,
    MAX_XP_MULTIPLIER,
  );
  const baseXpPerMin = baseRealmXp * multiplier;
  const cap = trainingStatCap({
    realmIndex: input.realmIndex,
    substageIndex: input.substageIndex,
    prestigeFloor: input.prestigeFloor,
  });
  const statXpGainedById: Record<string, number> = {};
  const ratingGainedById: Record<string, number> = {};
  const primaryRating = Math.max(0, Math.floor(nextState.statRatingsById[regimen.primaryStatId] ?? 0));
  const primaryAtCap = primaryRating >= cap;

  applyStatXp({
    nextState,
    statId: regimen.primaryStatId,
    weight: TRAINING_OUTPUT_WEIGHTS.primaryStat,
    baseXpPerMin,
    minutes,
    cap,
    reclaimMemory: input.reclaimMemoryByStatId?.[regimen.primaryStatId],
    gained: statXpGainedById,
    ratingGained: ratingGainedById,
  });
  applyStatXp({
    nextState,
    statId: regimen.secondaryStatId,
    weight: TRAINING_OUTPUT_WEIGHTS.secondaryStat,
    baseXpPerMin,
    minutes,
    cap,
    reclaimMemory: input.reclaimMemoryByStatId?.[regimen.secondaryStatId],
    gained: statXpGainedById,
    ratingGained: ratingGainedById,
  });
  applyStatXp({
    nextState,
    statId: regimen.foundationStatId,
    weight: TRAINING_OUTPUT_WEIGHTS.foundationStat,
    baseXpPerMin,
    minutes,
    cap,
    reclaimMemory: input.reclaimMemoryByStatId?.[regimen.foundationStatId],
    gained: statXpGainedById,
    ratingGained: ratingGainedById,
  });

  const masteryWeight = primaryAtCap
    ? TRAINING_OUTPUT_WEIGHTS.cappedPrimaryMastery
    : TRAINING_OUTPUT_WEIGHTS.regimenMastery;
  const masteryDampening = primaryAtCap ? capDampening({ rating: primaryRating, cap }) : 1;
  const masteryXp = baseXpPerMin * masteryDampening * masteryWeight * minutes;
  const masteryXpWithMemory = masteryXp * finiteOr(input.masteryXpMultiplier, 1);
  const masteryXpGainedByRegimenId: Record<string, number> = {};
  addRecord(masteryXpGainedByRegimenId, regimen.id, masteryXpWithMemory);
  nextState.regimenMasteryXpById[regimen.id] = (nextState.regimenMasteryXpById[regimen.id] ?? 0) + masteryXpWithMemory;

  const fatigueGained = intensity.fatigueGainPerMin * minutes;
  nextState.fatigue = clamp(nextState.fatigue + fatigueGained, 0, 100);
  nextState.activeRegimenId = regimen.id;
  nextState.activeIntensityId = intensity.id;

  return {
    ok: true,
    nextState,
    statXpGainedById,
    ratingGainedById,
    masteryXpGainedByRegimenId,
    fatigueGained,
    resourceDeltas: [],
    appliedMs: elapsedMs,
  };
}

export interface TrainingProgressPreview {
  xpGain: number;
  ratingGain: number;
  fatigueGain: number;
  debug: { mode: 'stub_no_gameplay_effect' };
}

export function resolveTrainingProgressPreview(): TrainingProgressPreview {
  return {
    xpGain: 0,
    ratingGain: 0,
    fatigueGain: 0,
    debug: { mode: 'stub_no_gameplay_effect' },
  };
}
