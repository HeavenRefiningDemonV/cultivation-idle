import type { TrialAttemptSummary } from '../../types/index.js';
import type { BuildAnalysis } from '../builds/buildAnalysisTypes.js';
import type { GateReadinessResult } from './readinessScoringTypes.js';

export type FailureDiagnosisCode =
  | 'undercultivated'
  | 'underforged'
  | 'underprepared'
  | 'underbuilt'
  | 'close'
  | 'bypassAvailable';

export type FailureFixDestination =
  | 'cultivation'
  | 'techniques'
  | 'forge'
  | 'apothecary'
  | 'medicine_pouch'
  | 'trial';

export interface FailureFix {
  code: string;
  destination: FailureFixDestination;
  reason: string;
}

export interface FailureDiagnosis {
  primary: FailureDiagnosisCode;
  secondary: FailureDiagnosisCode | null;
  reasons: string[];
  topFixes: FailureFix[];
}

export interface TrialFailureDiagnosisInput {
  trialId: string;
  summary: TrialAttemptSummary;
  readiness: GateReadinessResult;
  build: BuildAnalysis;
  bypassAvailable: boolean;
}
