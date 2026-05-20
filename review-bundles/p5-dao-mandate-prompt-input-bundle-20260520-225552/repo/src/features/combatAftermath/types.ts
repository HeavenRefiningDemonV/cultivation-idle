import type {
  RunCompassActionTarget,
  RunCompassRouteV2,
  RunCompassSurfaceV2,
} from '../../systems/ui/runCompass/types.js';
import type { RunCausalityDelta } from '../../systems/runDeltas/types.js';
import type { CombatResolvedEvent, TrialsAttemptResolvedEvent } from '../../services/events/GameEvents.js';
import type { GrantRewardsResult } from '../../services/rewards/types.js';
import type { FailureReflectionSurfaceV1 } from '../../systems/failureReflection/index.js';

export type CombatAftermathContextKind = 'outskirts' | 'ruins' | 'gate_trial';
export type CombatAftermathOutcomeKind =
  | 'victory'
  | 'defeat'
  | 'cleared'
  | 'bypassed'
  | 'support_complete'
  | 'unknown';
export type CombatAftermathVictoryGrade =
  | 'clean'
  | 'strained'
  | 'wasteful'
  | 'overmatched'
  | 'breakthrough_worthy'
  | 'not_applicable'
  | 'unknown';

export type CombatAftermathSpoilsGroupId =
  | 'immediate_spend'
  | 'gate_prep'
  | 'doctrine'
  | 'crafting'
  | 'reputation'
  | 'rare_signs'
  | 'gate_proof';

export type CombatAftermathTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'critical'
  | 'ceremonial';

export interface CombatAftermathSpoilLine {
  id: string;
  label: string;
  value: string;
  detail?: string;
  itemId?: string;
  currencyKey?: string;
  source: 'reward_result' | 'trial_summary' | 'run_delta' | 'readiness' | 'derived' | 'fallback';
}

export interface CombatAftermathSpoilsGroup {
  id: CombatAftermathSpoilsGroupId;
  title: string;
  summary: string;
  lines: CombatAftermathSpoilLine[];
  tone: 'default' | 'success' | 'warning' | 'muted' | 'ceremonial';
  empty: boolean;
}

export interface CombatAftermathDeltaSurface {
  title: string;
  beforeLabel?: string;
  afterLabel?: string;
  deltaLabel?: string;
  explanation: string;
  confidence: 'exact' | 'derived' | 'conservative' | 'unknown';
}

export interface CombatAftermathDiagnosisSurface {
  code: string;
  label: string;
  explanation: string;
  topFixLabel: string;
  topFixRoute: CombatAftermathRouteSurface | null;
  confidence: 'exact' | 'derived' | 'fallback';
}

export interface CombatAftermathRouteSurface {
  id: string;
  label: string;
  detail: string;
  target: RunCompassActionTarget | null;
  source: 'run_compass' | 'diagnosis' | 'gate_trial' | 'fallback';
  enabled: boolean;
  disabledReason?: string | null;
}

export interface CombatAftermathSurfaceV1 {
  version: 1;
  id: string;
  createdAt: number;
  context: {
    kind: CombatAftermathContextKind;
    cityId?: string | null;
    sourceId?: string | null;
    trialId?: string | null;
    ruinId?: string | null;
    enemyId?: string | null;
    enemyName?: string | null;
    gateLabel?: string | null;
  };
  outcome: {
    kind: CombatAftermathOutcomeKind;
    title: string;
    subtitle: string;
    tone: CombatAftermathTone;
    victoryGrade: CombatAftermathVictoryGrade;
    gradeLabel: string;
    gradeReason: string;
  };
  spoilsGroups: CombatAftermathSpoilsGroup[];
  readinessDelta: CombatAftermathDeltaSurface | null;
  economyDelta: CombatAftermathDeltaSurface | null;
  doctrineDelta: CombatAftermathDeltaSurface | null;
  diagnosis: CombatAftermathDiagnosisSurface | null;
  failureReflection?: FailureReflectionSurfaceV1 | null;
  memoryLine: string;
  primaryRoute: CombatAftermathRouteSurface | null;
  secondaryRoutes: CombatAftermathRouteSurface[];
  sourceEventIds: string[];
  recentDeltaIds: string[];
  debugNotes: string[];
}

export interface CombatAftermathDiagnosisInput {
  code: string;
  label?: string;
  explanation?: string;
  topFixLabel?: string;
  confidence?: CombatAftermathDiagnosisSurface['confidence'];
}

export interface CombatAftermathCombatSummaryInput {
  playerHpPctRemaining?: number | null;
  enemyHpPctRemaining?: number | null;
  medicineUses?: number | null;
  healingEvents?: number | null;
}

export interface CombatAftermathBuildSnapshot {
  id?: string;
  createdAt?: number;
  context: {
    kind: CombatAftermathContextKind;
    cityId?: string | null;
    sourceId?: string | null;
    trialId?: string | null;
    ruinId?: string | null;
    enemyId?: string | null;
    enemyName?: string | null;
    gateLabel?: string | null;
    gateProofItemId?: string | null;
  };
  rewardResult?: GrantRewardsResult | null;
  combatResolved?: Partial<CombatResolvedEvent['payload']> | null;
  combatSummary?: CombatAftermathCombatSummaryInput | null;
  trialAttempt?: Partial<TrialsAttemptResolvedEvent['payload']> | null;
  diagnosis?: CombatAftermathDiagnosisInput | null;
  failureReflection?: FailureReflectionSurfaceV1 | null;
  runCompass?: RunCompassSurfaceV2 | null;
  recentDeltas?: RunCausalityDelta[];
  itemNamesById?: Record<string, { name?: string } | string | undefined>;
  currencyLabelsByKey?: Record<string, string | undefined>;
  readinessDelta?: CombatAftermathDeltaSurface | null;
  economyDelta?: CombatAftermathDeltaSurface | null;
  doctrineDelta?: CombatAftermathDeltaSurface | null;
  sourceEventIds?: string[];
  debugNotes?: string[];
}

export interface BuildLiveCombatAftermathContextHint {
  kind: CombatAftermathContextKind;
  cityId?: string | null;
  sourceId?: string | null;
  trialId?: string | null;
  ruinId?: string | null;
  gateLabel?: string | null;
  gateProofItemId?: string | null;
}

export type { RunCompassActionTarget, RunCompassRouteV2, RunCompassSurfaceV2 };
