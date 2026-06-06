import { useCallback, useMemo } from 'react';
import type { TrainingIntensityId } from '../../content/types.js';
import { useTrainingStore, type TrainingStartResult } from '../../stores/trainingStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type {
  TrainingHallActionController,
  TrainingHallNotificationTone,
} from './trainingHallTypes.js';

export interface CreateTrainingHallActionControllerOptions {
  addNotification?: (tone: TrainingHallNotificationTone, message: string) => void;
}

function failureMessage(result: Extract<TrainingStartResult, { ok: false }>): string {
  switch (result.reason) {
    case 'content_unavailable':
      return 'Training Hall content is unavailable.';
    case 'invalid_regimen':
      return 'That regimen is unavailable.';
    case 'invalid_intensity':
      return 'That intensity is unavailable.';
    case 'path_not_selected':
      return 'Choose a path before starting Training Hall practice.';
    case 'path_mismatch':
      return 'This regimen belongs to a different path.';
    case 'regimen_locked':
      return 'That regimen has not opened for this realm yet.';
    case 'combat_activity_active':
      return 'Stop combat before starting Training Hall practice.';
    case 'not_active_training':
    case 'no_active_training':
      return 'No Training Hall practice is active.';
    case 'non_positive_elapsed':
      return 'Training Hall practice needs positive time to advance.';
  }
}

export function createTrainingHallActionController(
  options: CreateTrainingHallActionControllerOptions = {},
): TrainingHallActionController {
  const notify = options.addNotification ?? (() => {});
  return {
    startTraining: (regimenId: string, intensityId: TrainingIntensityId, opts?: { now?: number }) => {
      const result = useTrainingStore.getState().startTraining(regimenId, intensityId, opts);
      if (result.ok) {
        notify('success', 'Training Hall practice started.');
      } else {
        notify(result.reason === 'combat_activity_active' ? 'warning' : 'error', failureMessage(result));
      }
      return result;
    },
    stopTraining: () => {
      useTrainingStore.getState().stopTraining('training-hall:stop');
      notify('info', 'Training Hall practice stopped.');
    },
  };
}

export function useTrainingHallActionController(): TrainingHallActionController {
  const addNotification = useUIStore((state) => state.addNotification);
  const notify = useCallback((tone: TrainingHallNotificationTone, message: string) => {
    addNotification(tone, message);
  }, [addNotification]);

  return useMemo(() => createTrainingHallActionController({ addNotification: notify }), [notify]);
}
