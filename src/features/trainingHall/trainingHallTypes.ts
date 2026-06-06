import type { PathId, TrainingIntensityId } from '../../content/types.js';
import type {
  TrainingReadOnlySnapshot,
  TrainingFutureStatReadOnlyRow,
  TrainingLockedRegimenReadOnlyRow,
  TrainingRegimenReadOnlyRow,
  TrainingStatReadOnlyRow,
  TrainingSupportMultiplierRow,
} from '../../systems/training/index.js';
import type { TrainingStartResult } from '../../stores/trainingStore.js';

export type TrainingHallSurfaceStatus =
  | 'no_path'
  | 'idle'
  | 'active'
  | 'blocked_by_combat'
  | 'blocked_by_activity';

export type TrainingHallAlertTone = 'info' | 'success' | 'warning';

export interface TrainingHallAlertSurface {
  id: 'high-fatigue' | 'cap-reached' | 'offline-return' | 'reduced-motion';
  label: string;
  detail: string;
  tone: TrainingHallAlertTone;
}

export interface TrainingHallButtonSurface {
  label: string;
  enabled: boolean;
  disabledReason: string | null;
}

export interface TrainingHallVisualSurface {
  surface: 'training-hall-mp6';
  pathTone: PathId | 'unassigned';
  intensityTone: TrainingIntensityId | 'none';
  activityState: TrainingHallSurfaceStatus;
  motionMode: 'animated' | 'static';
  fxBudget: {
    maxParticles: 36;
    activeParticles: number;
    opacityOverTextMax: 0.18;
  };
  screenshotStates: string[];
}

export interface TrainingHallSurfaceV1 {
  meta: {
    surfaceId: 'training-hall';
    version: 'training-hall-v1';
    mode: 'live';
    rootTestId: 'training-hall-page';
    cityId: string | null;
    selectedPath: PathId | null;
    selectedRegimenId: string | null;
    selectedIntensityId: TrainingIntensityId | null;
    reducedMotion: boolean;
  };
  snapshot: TrainingReadOnlySnapshot;
  page: {
    title: 'Training Hall';
    subtitle: string;
  };
  pathRoom: {
    title: string;
    pathLabel: string;
    foundation: TrainingReadOnlySnapshot['pathFoundation'];
    bottleneck: TrainingStatReadOnlyRow | null;
    nextUnlock: TrainingReadOnlySnapshot['nextUnlock'];
  };
  regimenRail: {
    title: 'Available Regimens';
    regimens: TrainingRegimenReadOnlyRow[];
  };
  lockedRegimenRail: {
    title: 'Future Regimens';
    regimens: TrainingLockedRegimenReadOnlyRow[];
  };
  intensityStrip: {
    title: 'Intensity';
    intensities: Array<{
      id: TrainingIntensityId;
      label: string;
      xpMultiplierLabel: string;
      fatigueLabel: string;
      selected: boolean;
    }>;
  };
  practiceStage: {
    status: TrainingHallSurfaceStatus;
    statusLabel: string;
    detail: string;
    selectedRegimen: TrainingRegimenReadOnlyRow | null;
  };
  statRows: TrainingStatReadOnlyRow[];
  futureStats: TrainingFutureStatReadOnlyRow[];
  supportRows: TrainingSupportMultiplierRow[];
  alerts: TrainingHallAlertSurface[];
  visual: TrainingHallVisualSurface;
  actionBar: {
    startButton: TrainingHallButtonSurface;
    stopButton: TrainingHallButtonSurface;
  };
}

export interface TrainingHallActionController {
  startTraining: (
    regimenId: string,
    intensityId: TrainingIntensityId,
    opts?: { now?: number },
  ) => TrainingStartResult;
  stopTraining: () => void;
}

export type TrainingHallNotificationTone = 'info' | 'success' | 'warning' | 'error';
