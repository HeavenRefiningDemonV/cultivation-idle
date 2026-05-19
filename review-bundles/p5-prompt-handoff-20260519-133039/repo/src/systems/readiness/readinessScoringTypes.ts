import type { EconomicReadinessBand, EconomicShortfall } from '../economy/economicRecommendationTypes.js';
import type { ForgeFloorReadModel } from '../forge/forgeFloorReadModel.js';
import type { BuildAnalysis } from '../builds/buildAnalysisTypes.js';
import type { CombatPostureFit } from '../builds/combatPostureTypes.js';
import type { GateBuildFloor } from './gateBuildFloorTypes.js';
import type { TrialId } from '../progression/contract/index.js';

export type ReadinessBand = EconomicReadinessBand;
export type ReadinessSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ReadinessShortfallCode =
  | 'build_slots'
  | 'build_alignment'
  | 'build_mastery'
  | 'build_rank'
  | 'build_runes'
  | 'forge_floor'
  | 'economic_shortfall'
  | 'posture_ai'
  | 'posture_casting'
  | 'posture_pouch';

export interface GateForgeTargets {
  minimum: {
    weaponRefine: number;
    accessoryRefine: number;
    temperSuccesses: number;
    runeCount: number;
  };
  recommended: {
    weaponRefine: number;
    accessoryRefine: number;
    temperSuccesses: number;
    runeCount: number;
  };
}

export interface ReadinessShortfall {
  code: ReadinessShortfallCode;
  severity: ReadinessSeverity;
  label: string;
  reason: string;
  currentValue: number | null;
  minimumTarget: number | null;
  recommendedTarget: number | null;
}

export interface ReadinessComponentResult {
  band: ReadinessBand;
  minimumMet: boolean;
  recommendedMet: boolean;
  shortfalls: ReadinessShortfall[];
}

export interface EconomicReadinessComponentResult extends ReadinessComponentResult {
  majorShortfallCount: number;
  topShortfallIds: string[];
}

export interface PostureReadinessComponentResult extends ReadinessComponentResult {
  warnings: string[];
}

export interface GateReadinessInput {
  trialId: TrialId;
  gateBuildFloor: GateBuildFloor;
  buildAnalysis: BuildAnalysis;
  forgeFloor: ForgeFloorReadModel;
  forgeTargets: GateForgeTargets;
  economicReadinessBand: EconomicReadinessBand;
  economicShortfalls: EconomicShortfall[];
  economicMajorShortfallCount: number;
  postureFit: CombatPostureFit;
}

export interface GateReadinessResult {
  trialId: TrialId;
  build: ReadinessComponentResult;
  forge: ReadinessComponentResult;
  economic: EconomicReadinessComponentResult;
  posture: PostureReadinessComponentResult;
  overallBand: ReadinessBand;
  shortfalls: ReadinessShortfall[];
  warnings: string[];
}

export const READINESS_BAND_ORDER: readonly ReadinessBand[] = Object.freeze([
  'below_minimum',
  'minimum_met_below_recommended',
  'recommended_met',
]);

export const READINESS_SEVERITY_ORDER: readonly ReadinessSeverity[] = Object.freeze([
  'critical',
  'high',
  'medium',
  'low',
]);

export const READINESS_SHORTFALL_ORDER: readonly ReadinessShortfallCode[] = Object.freeze([
  'build_slots',
  'build_alignment',
  'build_mastery',
  'build_rank',
  'build_runes',
  'forge_floor',
  'economic_shortfall',
  'posture_ai',
  'posture_casting',
  'posture_pouch',
]);
