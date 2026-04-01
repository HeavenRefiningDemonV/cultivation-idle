import type {
  CultivationPath,
  FocusMode,
  BreathMode,
  SpiritRoot,
  AiProfile,
  CastingPolicy,
} from '../../types/index.js';
import type { MajorRealmId } from '../progression/contract/index.js';

export interface SpiritRootSummary {
  element: SpiritRoot['element'];
  grade: SpiritRoot['grade'];
  purity: number;
}

export interface DoctrineSourceFlags {
  hasPath: boolean;
  hasHeartLaw: boolean;
  hasSpiritRoot: boolean;
  hasLoadout: boolean;
  hasCity: boolean;
}

export interface DoctrineSnapshotWarnings {
  missingPath: boolean;
  missingHeartLaw: boolean;
  missingSpiritRoot: boolean;
  missingLoadout: boolean;
  missingCity: boolean;
  clampedRealmIndex: boolean;
  invalidCityFiltered: boolean;
  invalidLoadoutFallback: boolean;
  invalidHeartLawProfile: boolean;
}

export interface DoctrineSnapshot {
  path: CultivationPath | null;
  focusMode: FocusMode;
  spiritRoot: SpiritRoot | null;
  spiritRootSummary?: SpiritRootSummary | null;
  heartLawId: string | null;
  heartLawChapter: number;
  heartLawName?: string | null;
  heartLawFamily?: string | null;
  breathMode: BreathMode;
  selectedLoadoutId: string | null;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  realmIndex: number;
  majorRealmId: MajorRealmId;
  cityId: string | null;
  sourceFlags?: DoctrineSourceFlags;
  warnings?: DoctrineSnapshotWarnings;
}
