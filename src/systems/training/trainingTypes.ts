import type {
  CultivatorStatDef,
  PathId,
  TrainingIntensityDef,
  TrainingIntensityId,
  TrainingRegimenDef,
} from '../../content/types.js';
import type { ForegroundActivityType } from '../../types/activity.js';

export const TRAINING_SCHEMA_VERSION = 1;

export const TRAINING_INTENSITY_IDS = ['quiet', 'steady', 'harsh', 'limit'] as const satisfies readonly TrainingIntensityId[];

export type TrainingActionFailureReason =
  | 'content_unavailable'
  | 'invalid_regimen'
  | 'invalid_intensity'
  | 'path_not_selected'
  | 'path_mismatch'
  | 'regimen_locked'
  | 'combat_activity_active'
  | 'not_active_training'
  | 'no_active_training'
  | 'non_positive_elapsed';

export interface SaveTrainingOfflineSummary {
  appliedMs: number;
  statXpGainedById: Record<string, number>;
  masteryXpGainedByRegimenId: Record<string, number>;
  fatigueGained: number;
  completedAt: number;
  blockedReason?: TrainingActionFailureReason;
}

export interface SaveTrainingState {
  schemaVersion: number;
  statRatingsById: Record<string, number>;
  statXpById: Record<string, number>;
  regimenMasteryXpById: Record<string, number>;
  fatigue: number;
  activeRegimenId: string | null;
  activeIntensityId: TrainingIntensityId | null;
  lastTickAt: number | null;
  lastOfflineSummary: SaveTrainingOfflineSummary | null;
  prestigeMemoryAppliedForLife: boolean;
}

export interface TrainingRuntimeContent {
  stats: CultivatorStatDef[];
  regimens: TrainingRegimenDef[];
  intensities: TrainingIntensityDef[];
  statsById: Record<string, CultivatorStatDef>;
  regimensById: Record<string, TrainingRegimenDef>;
  intensitiesById: Partial<Record<TrainingIntensityId, TrainingIntensityDef>>;
  masteryMilestones: number[];
}

export interface TrainingResourceDelta {
  kind: 'none';
  id: string;
  amount: 0;
}

export interface TrainingTickInput {
  state: SaveTrainingState;
  content: TrainingRuntimeContent;
  regimenId: string;
  intensityId: TrainingIntensityId;
  elapsedMs: number;
  realmIndex: number;
  substageIndex: number;
  selectedPath: PathId | null;
  offlineEfficiency?: number;
  pathAffinity?: number;
  heartLawSupport?: number;
  rootSupport?: number;
  prestigeFloor?: number;
  masteryXpMultiplier?: number;
  reclaimMemoryByStatId?: Record<string, {
    multiplier: number;
    floorValue: number;
    priorBestRating: number;
  }>;
}

export interface TrainingTickResult {
  ok: boolean;
  reason?: TrainingActionFailureReason;
  nextState: SaveTrainingState;
  statXpGainedById: Record<string, number>;
  ratingGainedById: Record<string, number>;
  masteryXpGainedByRegimenId: Record<string, number>;
  fatigueGained: number;
  resourceDeltas: TrainingResourceDelta[];
  appliedMs: number;
}

export interface TrainingOfflineInput {
  state: SaveTrainingState;
  content: TrainingRuntimeContent;
  activeActivityType: ForegroundActivityType | null;
  elapsedMs: number;
  realmIndex: number;
  substageIndex: number;
  selectedPath: PathId | null;
  offlineEfficiency?: number;
  pathAffinity?: number;
  heartLawSupport?: number;
  rootSupport?: number;
  prestigeFloor?: number;
  masteryXpMultiplier?: number;
  reclaimMemoryByStatId?: TrainingTickInput['reclaimMemoryByStatId'];
  completedAt?: number;
}

export interface TrainingOfflineResult {
  nextState: SaveTrainingState;
  appliedMs: number;
  blockedReason?: TrainingActionFailureReason;
  totalStatXpGainedById: Record<string, number>;
  totalRatingGainedById: Record<string, number>;
  totalMasteryXpGainedByRegimenId: Record<string, number>;
  totalFatigueGained: number;
  intensityDowngrades: number;
}

export function isTrainingIntensityId(value: unknown): value is TrainingIntensityId {
  return typeof value === 'string' && (TRAINING_INTENSITY_IDS as readonly string[]).includes(value);
}
