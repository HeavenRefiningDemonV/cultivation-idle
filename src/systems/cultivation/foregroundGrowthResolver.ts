import type { ActiveActivity, ForegroundActivityType } from '../../types/activity.js';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';

export type ForegroundGrowthKind =
  | 'cultivation'
  | 'path_training'
  | 'dao_heart'
  | 'combat'
  | 'queued_only';

export interface ForegroundGrowthMode {
  mode: ForegroundGrowthKind;
  activeType: ForegroundActivityType | null;
  fullQiAllowed: boolean;
  trainingAllowed: boolean;
  daoHeartAllowed: boolean;
  combatAllowed: boolean;
  backgroundQueuesAllowed: boolean;
  offlineEligible: boolean;
  label: string;
  pausedPrimaryLabels: string[];
  reason: string;
}

export function resolveForegroundGrowthMode(active: ActiveActivity | null): ForegroundGrowthMode {
  if (!active || active.type === 'meditate') {
    return {
      mode: 'cultivation',
      activeType: active?.type ?? null,
      fullQiAllowed: true,
      trainingAllowed: false,
      daoHeartAllowed: false,
      combatAllowed: false,
      backgroundQueuesAllowed: true,
      offlineEligible: true,
      label: 'Pure Cultivation',
      pausedPrimaryLabels: ['Path Training', 'Dao Heart practice', 'Combat'],
      reason: active
        ? 'Meditation is the active foreground focus.'
        : 'No active foreground focus; current contract treats the life as cultivating.',
    };
  }

  if (active.type === 'path_training') {
    return {
      mode: 'path_training',
      activeType: active.type,
      fullQiAllowed: false,
      trainingAllowed: true,
      daoHeartAllowed: false,
      combatAllowed: false,
      backgroundQueuesAllowed: true,
      offlineEligible: true,
      label: 'Path Training',
      pausedPrimaryLabels: ['Full Qi cultivation', 'Dao Heart practice', 'Combat'],
      reason: 'Path Training is the active foreground focus.',
    };
  }

  if (active.type === 'dao_heart_practice') {
    return {
      mode: 'dao_heart',
      activeType: active.type,
      fullQiAllowed: false,
      trainingAllowed: false,
      daoHeartAllowed: true,
      combatAllowed: false,
      backgroundQueuesAllowed: true,
      offlineEligible: true,
      label: 'Dao Heart practice',
      pausedPrimaryLabels: ['Full Qi cultivation', 'Path Training', 'Combat'],
      reason: 'Dao Heart practice is the active foreground focus.',
    };
  }

  if (COMBAT_ACTIVITY_TYPES.includes(active.type)) {
    return {
      mode: 'combat',
      activeType: active.type,
      fullQiAllowed: false,
      trainingAllowed: false,
      daoHeartAllowed: false,
      combatAllowed: true,
      backgroundQueuesAllowed: true,
      offlineEligible: false,
      label: 'Combat',
      pausedPrimaryLabels: ['Full Qi cultivation', 'Path Training', 'Dao Heart practice'],
      reason: 'Combat owns this foreground focus; combat does not progress offline.',
    };
  }

  return {
    mode: 'queued_only',
    activeType: active.type,
    fullQiAllowed: false,
    trainingAllowed: false,
    daoHeartAllowed: false,
    combatAllowed: false,
    backgroundQueuesAllowed: true,
    offlineEligible: true,
    label: 'Queued work',
    pausedPrimaryLabels: ['Full Qi cultivation', 'Path Training', 'Dao Heart practice', 'Combat'],
    reason: `${active.type} is a foreground non-growth activity.`,
  };
}

export function allowsFullQi(mode: ForegroundGrowthMode): boolean {
  return mode.fullQiAllowed;
}

export function allowsTraining(mode: ForegroundGrowthMode): boolean {
  return mode.trainingAllowed;
}

export function allowsDaoHeart(mode: ForegroundGrowthMode): boolean {
  return mode.daoHeartAllowed;
}
