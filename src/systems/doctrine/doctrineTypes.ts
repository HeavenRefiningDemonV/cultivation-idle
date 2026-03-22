import type {
  CultivationPath,
  FocusMode,
  BreathMode,
  SpiritRoot,
  AiProfile,
  CastingPolicy,
} from '../../types/index.js';
import type { MajorRealmId } from '../progression/contract/index.js';

export interface DoctrineSnapshot {
  path: CultivationPath | null;
  focusMode: FocusMode;
  spiritRoot: SpiritRoot | null;
  heartLawId: string | null;
  heartLawChapter: number;
  breathMode: BreathMode;
  selectedLoadoutId: string | null;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  realmIndex: number;
  majorRealmId: MajorRealmId;
  cityId: string | null;
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
  missingLoadout: boolean;
  missingSpiritRoot: boolean;
}
