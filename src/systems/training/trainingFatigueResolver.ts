import { fatigueDampening } from './trainingProgressionResolver.js';
import type { TrainingIntensityId } from '../../content/types.js';

export const TRAINING_FATIGUE_DOWNGRADE_AT = 80;

const DOWNGRADE_BY_INTENSITY: Record<TrainingIntensityId, TrainingIntensityId> = {
  quiet: 'quiet',
  steady: 'quiet',
  harsh: 'steady',
  limit: 'harsh',
};

export function downgradeTrainingIntensityForFatigue(
  intensityId: TrainingIntensityId,
  fatigue: number,
): TrainingIntensityId {
  if (!Number.isFinite(fatigue) || fatigue < TRAINING_FATIGUE_DOWNGRADE_AT) {
    return intensityId;
  }
  return DOWNGRADE_BY_INTENSITY[intensityId] ?? intensityId;
}

export interface TrainingFatiguePreview {
  fatigueDelta: number;
  dampening: number;
  debug: { mode: 'stub_no_gameplay_effect' };
}

export function resolveTrainingFatiguePreview(fatigue = 0): TrainingFatiguePreview {
  return {
    fatigueDelta: 0,
    dampening: fatigueDampening(fatigue),
    debug: { mode: 'stub_no_gameplay_effect' },
  };
}
