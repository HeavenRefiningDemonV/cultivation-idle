import type { DoctrineSnapshot } from '../doctrine/index.js';
import type { LoadoutSnapshot } from './loadoutSnapshot.js';
import type {
  CultivationPath,
  ManualGrade,
  TechRarity,
  TechniqueSlotType,
} from '../../types/index.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import type { PathAlignmentStrength } from './pathAlignment.js';

export type BuildGapCode =
  | 'empty_slot'
  | 'low_alignment'
  | 'missing_survival_tool'
  | 'missing_setup_tool'
  | 'low_mastery'
  | 'low_rank'
  | 'rune_gap';

export type BuildGapSeverity = 'high' | 'medium' | 'low';

export interface BuildGap {
  code: BuildGapCode;
  severity: BuildGapSeverity;
  reason: string;
}

export interface BuildTechniqueAnalysisEntry {
  techId: string;
  slotType: TechniqueSlotType;
  families: TechniqueFamily[];
  supportFlags: TechniqueSupportFlag[];
  pathFit: PathAlignmentStrength;
  pathFitScore: 0 | 1 | 2;
  manualGrade: ManualGrade;
  rarity: TechRarity;
  masteryLevel: number;
  masteryFloor: number;
  masteryFloorMet: boolean;
  rank: number;
  rankFloor: number;
  rankCap: number;
  rankFloorMet: boolean;
  runeSockets: number;
  runeFloor: number;
  appliedRuneCount: number;
  runeFloorMet: boolean;
}

export interface BuildAnalysisInput {
  snapshot: DoctrineSnapshot;
  loadoutSnapshot: LoadoutSnapshot;
  equippedTechniques: BuildTechniqueAnalysisEntry[];
}

export interface BuildAnalysis {
  loadoutId: string;
  archetypeId: string | null;
  pathAlignmentScore: number;
  familyCoverage: Record<TechniqueFamily, number>;
  supportCoverage: Record<TechniqueSupportFlag, number>;
  emptyUnlockedSlots: number;
  masteryFloorMet: boolean;
  rankFloorMet: boolean;
  runeFloorMet: boolean;
  equippedTechniques: BuildTechniqueAnalysisEntry[];
  gaps: BuildGap[];
}

export interface BuildArchetypeProfile {
  id: string;
  path: CultivationPath;
  label: string;
  summary: string;
  primaryFamilies: TechniqueFamily[];
  secondaryFamilies: TechniqueFamily[];
  preferredSupportFlags: TechniqueSupportFlag[];
}

export const BUILD_GAP_ORDER: readonly BuildGapCode[] = Object.freeze([
  'empty_slot',
  'low_alignment',
  'missing_survival_tool',
  'missing_setup_tool',
  'low_mastery',
  'low_rank',
  'rune_gap',
]);

export const BUILD_GAP_SEVERITY_ORDER: readonly BuildGapSeverity[] = Object.freeze([
  'high',
  'medium',
  'low',
]);

export const ACTIVE_PASSIVE_MASTERY_FLOOR = 25;
export const ULTIMATE_MASTERY_FLOOR = 50;
export const ACTIVE_PASSIVE_MIN_RANK_FLOOR = 2;
export const ULTIMATE_MIN_RANK_FLOOR = 3;
export const ACTIVE_PASSIVE_MIN_RUNE_FLOOR = 1;
export const ULTIMATE_MIN_RUNE_FLOOR = 2;
