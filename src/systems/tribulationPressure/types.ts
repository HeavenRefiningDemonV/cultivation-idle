export type TribulationPressureState = 'hidden' | 'calm' | 'strained' | 'fracturing';

export interface TribulationPressureSourceLine {
  code:
    | 'low_stability'
    | 'rushed_threshold'
    | 'heart_law_mismatch'
    | 'underprepared_gate_clear'
    | 'repeated_risky_clear'
    | 'missing_breakthrough_support'
    | 'unknown';
  label: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface TribulationPressureReliefRoute {
  target: 'cultivation' | 'heart_law' | 'apothecary' | 'ruins' | 'forge' | 'gate_trial';
  label: string;
  reason: string;
}

export interface TribulationPressureSurfaceV1 {
  version: 1;
  enabled: boolean;
  state: TribulationPressureState;
  pressureScore: number;
  summaryLine: string;
  sourceLines: TribulationPressureSourceLine[];
  reliefRoutes: TribulationPressureReliefRoute[];
  deterministicOutcomeLine: string;
  rewardHint?: string;
  debugNotes: string[];
}

export interface BuildTribulationPressureArgs {
  stabilityPct?: number | null;
  rushedThreshold?: boolean;
  heartLawMismatch?: boolean;
  underpreparedGateClear?: boolean;
  repeatedRiskyClear?: boolean;
  missingBreakthroughSupport?: boolean;
}
