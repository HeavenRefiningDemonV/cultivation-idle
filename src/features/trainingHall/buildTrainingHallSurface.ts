import type { PathId, TrainingIntensityId } from '../../content/types.js';
import type { ActiveActivity } from '../../stores/activityStore.js';
import {
  buildTrainingReadOnlySnapshot,
  type ResolveTrainingSupportMultipliersInput,
  type SaveTrainingState,
  type TrainingRuntimeContent,
} from '../../systems/training/index.js';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';
import {
  TRAINING_HALL_PATH_ROOM_COPY,
  TRAINING_HALL_ROOT_TEST_ID,
  TRAINING_HALL_SURFACE_VERSION,
  trainingPathLabel,
} from './trainingHallPresentation.js';
import type {
  TrainingHallAlertSurface,
  TrainingHallSurfaceStatus,
  TrainingHallSurfaceV1,
} from './trainingHallTypes.js';

export interface BuildTrainingHallSurfaceInput {
  content: TrainingRuntimeContent;
  state: SaveTrainingState;
  selectedPath: PathId | null;
  realmIndex: number;
  substageIndex: number;
  activeActivity: ActiveActivity | null;
  cityId?: string | null;
  selectedRegimenId?: string | null;
  selectedIntensityId?: TrainingIntensityId | null;
  prefersReducedMotion?: boolean;
  prestigeFloor?: number;
  supportMultipliers?: ResolveTrainingSupportMultipliersInput;
}

function statusFor(input: BuildTrainingHallSurfaceInput, selectedRegimenId: string | null): TrainingHallSurfaceStatus {
  if (!input.selectedPath) return 'no_path';
  if (input.activeActivity && COMBAT_ACTIVITY_TYPES.includes(input.activeActivity.type)) return 'blocked_by_combat';
  if (input.activeActivity?.type === 'path_training' && input.state.activeRegimenId === selectedRegimenId) return 'active';
  if (input.activeActivity && input.activeActivity.type !== 'path_training') return 'blocked_by_activity';
  return 'idle';
}

function statusLabel(status: TrainingHallSurfaceStatus): string {
  switch (status) {
    case 'no_path':
      return 'Choose a path';
    case 'active':
      return 'Practice active';
    case 'blocked_by_combat':
      return 'Combat active';
    case 'blocked_by_activity':
      return 'Another activity active';
    case 'idle':
      return 'Ready to practice';
  }
}

function statusDetail(status: TrainingHallSurfaceStatus): string {
  switch (status) {
    case 'no_path':
      return 'Choose a path from Life Start before assigning Training Hall practice.';
    case 'active':
      return 'Path Training owns the foreground activity gate until stopped.';
    case 'blocked_by_combat':
      return 'Combat is active. Training Hall practice never resolves or advances combat.';
    case 'blocked_by_activity':
      return 'Stop the current foreground activity before starting this regimen.';
    case 'idle':
      return 'Select a regimen and intensity, then start Path Training.';
  }
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}x`;
}

function selectedRegimenId(input: BuildTrainingHallSurfaceInput, snapshot: ReturnType<typeof buildTrainingReadOnlySnapshot>): string | null {
  const requested = input.selectedRegimenId ?? input.state.activeRegimenId;
  if (requested && snapshot.regimensForPath.some((regimen) => regimen.id === requested)) return requested;
  return snapshot.regimensForPath[0]?.id ?? null;
}

function selectedIntensityId(input: BuildTrainingHallSurfaceInput): TrainingIntensityId | null {
  return input.selectedIntensityId ?? input.state.activeIntensityId ?? 'steady';
}

function buildAlerts(
  snapshot: ReturnType<typeof buildTrainingReadOnlySnapshot>,
  selectedRegimen: TrainingHallSurfaceV1['practiceStage']['selectedRegimen'],
  reducedMotion: boolean,
): TrainingHallAlertSurface[] {
  const alerts: TrainingHallAlertSurface[] = [];
  if (snapshot.fatigueTier === 'overworked') {
    alerts.push({
      id: 'high-fatigue',
      label: 'Fatigue high',
      detail: 'Intensity may downgrade while fatigue stays high.',
      tone: 'warning',
    });
  }
  if (selectedRegimen?.primaryStat.capState === 'capped') {
    alerts.push({
      id: 'cap-reached',
      label: 'Cap reached',
      detail: `${selectedRegimen.primaryStat.displayName} is at the current realm cap; overflow favors regimen mastery.`,
      tone: 'info',
    });
  }
  if (snapshot.offlineSummary) {
    alerts.push({
      id: 'offline-return',
      label: 'Return report',
      detail: `Offline practice applied ${Math.round(snapshot.offlineSummary.appliedMs / 60000)} min of Path Training.`,
      tone: 'success',
    });
  }
  if (reducedMotion) {
    alerts.push({
      id: 'reduced-motion',
      label: 'Reduced motion',
      detail: 'Animated room cues are replaced with stable practice marks.',
      tone: 'info',
    });
  }
  return alerts;
}

function startDisabledReason(status: TrainingHallSurfaceStatus, selectedRegimen: TrainingHallSurfaceV1['practiceStage']['selectedRegimen']): string | null {
  if (status === 'no_path') return 'Choose a path before starting Training Hall practice.';
  if (status === 'blocked_by_combat') return 'Stop combat before starting Training Hall practice.';
  if (status === 'blocked_by_activity') return 'Stop the current foreground activity first.';
  if (status === 'active') return 'This regimen is already active.';
  if (!selectedRegimen) return 'No regimen is available for this path.';
  return null;
}

function buildScreenshotStates(
  status: TrainingHallSurfaceStatus,
  alerts: TrainingHallAlertSurface[],
  reducedMotion: boolean,
): string[] {
  const states = [`training-${status.replaceAll('_', '-')}`];
  for (const alert of alerts) {
    if (alert.id === 'cap-reached') states.push('training-capped');
    if (alert.id === 'high-fatigue') states.push('training-high-fatigue');
    if (alert.id === 'offline-return') states.push('training-offline-return');
  }
  if (reducedMotion) states.push('training-reduced-motion');
  return [...new Set(states)];
}

function activeParticleCount(status: TrainingHallSurfaceStatus, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  if (status === 'active') return 24;
  if (status === 'idle') return 12;
  return 6;
}

export function buildTrainingHallSurface(input: BuildTrainingHallSurfaceInput): TrainingHallSurfaceV1 {
  const snapshot = buildTrainingReadOnlySnapshot({
    content: input.content,
    state: input.state,
    selectedPath: input.selectedPath,
    realmIndex: input.realmIndex,
    substageIndex: input.substageIndex,
    prestigeFloor: input.prestigeFloor,
    supportMultipliers: input.supportMultipliers,
  });
  const nextRegimenId = selectedRegimenId(input, snapshot);
  const nextIntensityId = selectedIntensityId(input);
  const selectedRegimen = nextRegimenId
    ? snapshot.regimensForPath.find((regimen) => regimen.id === nextRegimenId) ?? null
    : null;
  const status = statusFor(input, nextRegimenId);
  const reducedMotion = Boolean(input.prefersReducedMotion);
  const disabledReason = startDisabledReason(status, selectedRegimen);
  const pathCopy = input.selectedPath ? TRAINING_HALL_PATH_ROOM_COPY[input.selectedPath] : null;
  const alerts = buildAlerts(snapshot, selectedRegimen, reducedMotion);

  return {
    meta: {
      surfaceId: 'training-hall',
      version: TRAINING_HALL_SURFACE_VERSION,
      mode: 'live',
      rootTestId: TRAINING_HALL_ROOT_TEST_ID,
      cityId: input.cityId ?? null,
      selectedPath: input.selectedPath,
      selectedRegimenId: nextRegimenId,
      selectedIntensityId: nextIntensityId,
      reducedMotion,
    },
    snapshot,
    page: {
      title: 'Training Hall',
      subtitle: pathCopy?.subtitle ?? 'Choose a path to begin screen-owned practice.',
    },
    pathRoom: {
      title: pathCopy?.title ?? 'Training Hall',
      pathLabel: trainingPathLabel(input.selectedPath),
      foundation: snapshot.pathFoundation,
      bottleneck: snapshot.currentBottleneck,
      nextUnlock: snapshot.nextUnlock,
    },
    regimenRail: {
      title: 'Available Regimens',
      regimens: snapshot.regimensForPath,
    },
    lockedRegimenRail: {
      title: 'Future Regimens',
      regimens: snapshot.lockedRegimensForPath,
    },
    intensityStrip: {
      title: 'Intensity',
      intensities: input.content.intensities.map((intensity) => ({
        id: intensity.id,
        label: intensity.displayName,
        xpMultiplierLabel: formatMultiplier(intensity.xpMultiplier),
        fatigueLabel: `${intensity.fatigueGainPerMin.toFixed(2)} fatigue/min`,
        selected: intensity.id === nextIntensityId,
      })),
    },
    practiceStage: {
      status,
      statusLabel: statusLabel(status),
      detail: statusDetail(status),
      selectedRegimen,
    },
    statRows: snapshot.pathStats,
    futureStats: snapshot.futureStats,
    supportRows: snapshot.supportMultipliers.rows,
    alerts,
    visual: {
      surface: 'training-hall-mp6',
      pathTone: input.selectedPath ?? 'unassigned',
      intensityTone: nextIntensityId ?? 'none',
      activityState: status,
      motionMode: reducedMotion ? 'static' : 'animated',
      fxBudget: {
        maxParticles: 36,
        activeParticles: activeParticleCount(status, reducedMotion),
        opacityOverTextMax: 0.18,
      },
      screenshotStates: buildScreenshotStates(status, alerts, reducedMotion),
    },
    actionBar: {
      startButton: {
        label: status === 'active' ? 'Practicing' : 'Start Practice',
        enabled: disabledReason === null,
        disabledReason,
      },
      stopButton: {
        label: 'Stop Practice',
        enabled: status === 'active',
        disabledReason: status === 'active' ? null : 'No Training Hall practice is active.',
      },
    },
  };
}
