export type InnerDemonPatternKind =
  | 'undercultivated_loop'
  | 'underbuilt_loop'
  | 'underforged_loop'
  | 'underprepared_loop'
  | 'reckless_close_loop'
  | 'safety_net_resistance'
  | 'unknown';

export type FailureReflectionRouteTarget =
  | 'cultivation'
  | 'techniques'
  | 'manual_pavilion'
  | 'forge'
  | 'apothecary'
  | 'ruins'
  | 'bounties'
  | 'expeditions'
  | 'gate_trial';

export type FailureReflectionResolvedBy =
  | 'route_completed'
  | 'diagnosis_changed'
  | 'gate_cleared'
  | 'safety_net_bypassed'
  | 'new_life';

export interface FailureReflectionRecord {
  reflectionId: string;
  trialId: string;
  gateIndex: number;
  patternKind: InnerDemonPatternKind;
  diagnosisCode: string;
  repeatedCount: number;
  createdAt: number;
  lastUpdatedAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: FailureReflectionResolvedBy;
  correctiveRoute: {
    target: FailureReflectionRouteTarget;
    label: string;
    reason: string;
  };
  memoryEligible: boolean;
}

export interface FailureReflectionSurfaceV1 {
  version: 1;
  reflectionId: string;
  title: string;
  innerDemonLine: string;
  diagnosisLine: string;
  correctiveRouteLabel: string;
  correctiveRouteReason: string;
  repeatedCountLine: string;
  tone: 'warning' | 'critical' | 'near_success' | 'neutral';
  resolved: boolean;
  memoryEligible: boolean;
  routeTarget?: FailureReflectionRouteTarget;
  debugNotes: string[];
}

export interface FailureReflectionAttemptInput {
  trialId: string;
  gateIndex: number;
  diagnosisCode: string;
  createdAt: number;
  topFixDestination?: string | null;
  topFixReason?: string | null;
  repeatedCountOverride?: number;
}
