import type { ForegroundActivityType } from '../../types/activity.js';
import type { SaveTrainingState, TrainingRuntimeContent } from './trainingTypes.js';
import {
  isTrainingIntensityId,
  TRAINING_SCHEMA_VERSION,
} from './trainingTypes.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const finite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const sanitizeNumberRecord = (
  value: unknown,
  opts: { allowedIds?: Set<string>; integer?: boolean; max?: number } = {},
): Record<string, number> => {
  if (!isRecord(value)) return {};
  const next: Record<string, number> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (opts.allowedIds && !opts.allowedIds.has(id)) continue;
    const parsed = finite(raw);
    if (parsed === null) continue;
    const nonNegative = Math.max(0, parsed);
    const clamped = opts.max === undefined ? nonNegative : Math.min(opts.max, nonNegative);
    next[id] = opts.integer ? Math.floor(clamped) : clamped;
  }
  return next;
};

export function createDefaultTrainingSaveState(): SaveTrainingState {
  return {
    schemaVersion: TRAINING_SCHEMA_VERSION,
    statRatingsById: {},
    statXpById: {},
    regimenMasteryXpById: {},
    fatigue: 0,
    activeRegimenId: null,
    activeIntensityId: null,
    lastTickAt: null,
    lastOfflineSummary: null,
    prestigeMemoryAppliedForLife: false,
  };
}

export function copyTrainingSaveState(state: SaveTrainingState): SaveTrainingState {
  return {
    schemaVersion: TRAINING_SCHEMA_VERSION,
    statRatingsById: { ...state.statRatingsById },
    statXpById: { ...state.statXpById },
    regimenMasteryXpById: { ...state.regimenMasteryXpById },
    fatigue: clamp(finite(state.fatigue) ?? 0, 0, 100),
    activeRegimenId: state.activeRegimenId,
    activeIntensityId: state.activeIntensityId,
    lastTickAt: state.lastTickAt,
    lastOfflineSummary: state.lastOfflineSummary
      ? {
          ...state.lastOfflineSummary,
          statXpGainedById: { ...state.lastOfflineSummary.statXpGainedById },
          masteryXpGainedByRegimenId: { ...state.lastOfflineSummary.masteryXpGainedByRegimenId },
        }
      : null,
    prestigeMemoryAppliedForLife: Boolean(state.prestigeMemoryAppliedForLife),
  };
}

export function sanitizeTrainingSaveState(
  raw: unknown,
  content?: TrainingRuntimeContent | null,
  options?: { activeActivityType?: ForegroundActivityType | null },
): SaveTrainingState {
  if (!isRecord(raw)) {
    return createDefaultTrainingSaveState();
  }

  const statIds = content ? new Set(Object.keys(content.statsById)) : undefined;
  const regimenIds = content ? new Set(Object.keys(content.regimensById)) : undefined;
  const activeRegimen =
    typeof raw.activeRegimenId === 'string'
      ? raw.activeRegimenId
      : typeof raw.activeRegimen === 'string'
        ? raw.activeRegimen
        : null;
  const rawIntensity = raw.activeIntensityId ?? raw.activeIntensity;
  const activeIntensity = isTrainingIntensityId(rawIntensity) ? rawIntensity : null;
  const activityAllowsActiveTraining = options?.activeActivityType === undefined || options.activeActivityType === 'path_training';
  const activeRegimenValid = activeRegimen !== null && (!regimenIds || regimenIds.has(activeRegimen));
  const activeIntensityValid = activeIntensity !== null && (!content || Boolean(content.intensitiesById[activeIntensity]));
  const hasValidActivePair = activityAllowsActiveTraining && activeRegimenValid && activeIntensityValid;

  const legacyRatings = raw.statRatingsById ?? raw.ratingsByStatId;
  const legacyMastery = raw.regimenMasteryXpById ?? raw.regimenMasteryById;
  const fatigue = finite(raw.fatigue);
  const lastTickAt = finite(raw.lastTickAt);

  return {
    schemaVersion: TRAINING_SCHEMA_VERSION,
    statRatingsById: sanitizeNumberRecord(legacyRatings, { allowedIds: statIds, integer: true }),
    statXpById: sanitizeNumberRecord(raw.statXpById, { allowedIds: statIds }),
    regimenMasteryXpById: sanitizeNumberRecord(legacyMastery, { allowedIds: regimenIds }),
    fatigue: clamp(fatigue ?? 0, 0, 100),
    activeRegimenId: hasValidActivePair ? activeRegimen : null,
    activeIntensityId: hasValidActivePair ? activeIntensity : null,
    lastTickAt: lastTickAt === null ? null : Math.max(0, lastTickAt),
    lastOfflineSummary: null,
    prestigeMemoryAppliedForLife: Boolean(raw.prestigeMemoryAppliedForLife),
  };
}
