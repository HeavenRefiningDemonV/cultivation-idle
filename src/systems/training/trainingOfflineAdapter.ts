import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';
import { copyTrainingSaveState } from './trainingSaveState.js';
import { downgradeTrainingIntensityForFatigue } from './trainingFatigueResolver.js';
import { resolveTrainingTick } from './trainingProgressionResolver.js';
import type {
  TrainingOfflineInput,
  TrainingOfflineResult,
} from './trainingTypes.js';

export const TRAINING_MAX_OFFLINE_MS = 12 * 60 * 60 * 1000;
export const TRAINING_OFFLINE_BASE_EFFICIENCY = 0.5;
export const TRAINING_OFFLINE_EFFICIENCY_PER_LEVEL = 0.08;
export const TRAINING_OFFLINE_MAX_EFFICIENCY = 0.9;

const addRecord = (record: Record<string, number>, key: string, amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) return;
  record[key] = (record[key] ?? 0) + amount;
};

const emptyOffline = (
  input: TrainingOfflineInput,
  blockedReason?: TrainingOfflineResult['blockedReason'],
): TrainingOfflineResult => ({
  nextState: blockedReason ? input.state : copyTrainingSaveState(input.state),
  appliedMs: 0,
  blockedReason,
  totalStatXpGainedById: {},
  totalRatingGainedById: {},
  totalMasteryXpGainedByRegimenId: {},
  totalFatigueGained: 0,
  intensityDowngrades: 0,
});

export function resolveTrainingOfflineEfficiency(prestigeEfficiencyLevel = 0): number {
  const level = Number.isFinite(prestigeEfficiencyLevel) ? Math.max(0, Math.floor(prestigeEfficiencyLevel)) : 0;
  return Math.min(
    TRAINING_OFFLINE_MAX_EFFICIENCY,
    TRAINING_OFFLINE_BASE_EFFICIENCY + TRAINING_OFFLINE_EFFICIENCY_PER_LEVEL * level,
  );
}

export function resolveTrainingOffline(input: TrainingOfflineInput): TrainingOfflineResult {
  const elapsedMs = Math.max(0, Math.min(input.elapsedMs, TRAINING_MAX_OFFLINE_MS));
  if (elapsedMs <= 0) return emptyOffline(input, 'non_positive_elapsed');
  if (input.activeActivityType && COMBAT_ACTIVITY_TYPES.includes(input.activeActivityType)) {
    return emptyOffline(input, 'combat_activity_active');
  }
  if (input.activeActivityType !== 'path_training') {
    return emptyOffline(input, 'not_active_training');
  }
  if (!input.state.activeRegimenId || !input.state.activeIntensityId) {
    return emptyOffline(input, 'no_active_training');
  }

  let nextState = copyTrainingSaveState(input.state);
  let remainingMs = elapsedMs;
  let appliedMs = 0;
  let intensityDowngrades = 0;
  const totalStatXpGainedById: Record<string, number> = {};
  const totalRatingGainedById: Record<string, number> = {};
  const totalMasteryXpGainedByRegimenId: Record<string, number> = {};
  let totalFatigueGained = 0;
  const offlineEfficiency = input.offlineEfficiency ?? resolveTrainingOfflineEfficiency();

  while (remainingMs > 0) {
    const chunkMs = Math.min(60_000, remainingMs);
    const currentIntensity = nextState.activeIntensityId ?? input.state.activeIntensityId;
    const effectiveIntensity = downgradeTrainingIntensityForFatigue(currentIntensity, nextState.fatigue);
    if (effectiveIntensity !== currentIntensity) {
      intensityDowngrades += 1;
      nextState.activeIntensityId = effectiveIntensity;
    }

    const tick = resolveTrainingTick({
      state: nextState,
      content: input.content,
      regimenId: nextState.activeRegimenId ?? input.state.activeRegimenId,
      intensityId: effectiveIntensity,
      elapsedMs: chunkMs,
      realmIndex: input.realmIndex,
      substageIndex: input.substageIndex,
      selectedPath: input.selectedPath,
      offlineEfficiency,
      pathAffinity: input.pathAffinity,
      heartLawSupport: input.heartLawSupport,
      rootSupport: input.rootSupport,
      prestigeFloor: input.prestigeFloor,
      masteryXpMultiplier: input.masteryXpMultiplier,
      reclaimMemoryByStatId: input.reclaimMemoryByStatId,
    });

    if (!tick.ok) {
      return {
        nextState,
        appliedMs,
        blockedReason: tick.reason,
        totalStatXpGainedById,
        totalRatingGainedById,
        totalMasteryXpGainedByRegimenId,
        totalFatigueGained,
        intensityDowngrades,
      };
    }

    nextState = tick.nextState;
    Object.entries(tick.statXpGainedById).forEach(([id, amount]) => addRecord(totalStatXpGainedById, id, amount));
    Object.entries(tick.ratingGainedById).forEach(([id, amount]) => addRecord(totalRatingGainedById, id, amount));
    Object.entries(tick.masteryXpGainedByRegimenId).forEach(([id, amount]) => addRecord(totalMasteryXpGainedByRegimenId, id, amount));
    totalFatigueGained += tick.fatigueGained;
    appliedMs += chunkMs;
    remainingMs -= chunkMs;
  }

  nextState.lastOfflineSummary = {
    appliedMs,
    statXpGainedById: { ...totalStatXpGainedById },
    masteryXpGainedByRegimenId: { ...totalMasteryXpGainedByRegimenId },
    fatigueGained: totalFatigueGained,
    completedAt: input.completedAt ?? Date.now(),
  };

  return {
    nextState,
    appliedMs,
    totalStatXpGainedById,
    totalRatingGainedById,
    totalMasteryXpGainedByRegimenId,
    totalFatigueGained,
    intensityDowngrades,
  };
}

export interface TrainingOfflinePreview {
  eligible: false;
  xpGain: 0;
  ratingGain: 0;
  debug: { mode: 'stub_no_gameplay_effect' };
}

export function resolveTrainingOfflinePreview(): TrainingOfflinePreview {
  return {
    eligible: false,
    xpGain: 0,
    ratingGain: 0,
    debug: { mode: 'stub_no_gameplay_effect' },
  };
}
