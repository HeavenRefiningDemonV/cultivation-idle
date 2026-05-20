import type { LiveWorldModuleKey } from '../../../content/index.js';
import type { GameTab } from '../../../stores/uiStore.js';

export type RunCompassTabTarget = Exclude<GameTab, 'records'>;

export interface RunCompassActionTargetTab {
  kind: 'tab';
  tab: RunCompassTabTarget;
}

export interface RunCompassActionTargetWorldModule {
  kind: 'world_module';
  cityId: string;
  moduleKey: LiveWorldModuleKey;
}

export type RunCompassActionTarget = RunCompassActionTargetTab | RunCompassActionTargetWorldModule;

export interface RunCompassActionLine {
  id: string;
  label: string;
  why: string;
  destinationLabel: string;
  blocked: boolean;
  blockedReason: string | null;
  target: RunCompassActionTarget | null;
}

export interface RunCompassInfoLine {
  id: string;
  label: string;
  detail: string;
  tone?: 'default' | 'warning' | 'success' | 'muted';
  placeholder?: boolean;
}

export interface RunCompassSurface {
  milestone: {
    title: string;
    detail: string;
    contextLine: string;
    readinessLabel: string;
    prestigeLine: string | null;
  };
  readiness: {
    label: string;
    detail: string;
    diagnosisLabel: string | null;
    rows: RunCompassInfoLine[];
  };
  missingRequirements: RunCompassInfoLine[];
  bestNextActions: RunCompassActionLine[];
  safetyNet: {
    title: string;
    progressLine: string;
    costLine: string;
    reserveLine: string;
    detailLine: string;
  };
}

export interface RunCompassCompactSurface {
  milestoneLine: string;
  readinessLabel: string;
  blockerLine: string;
  actionLine: string;
  recentDeltaLine?: string | null;
}

export type RunCompassMilestoneStateV2 =
  | 'life_setup'
  | 'cultivating'
  | 'preparing'
  | 'attemptable'
  | 'gate_active'
  | 'gate_failed'
  | 'gate_resolved'
  | 'breakthrough_pending'
  | 'realm_entered'
  | 'content_cap'
  | 'prestige_recommended';

export interface RunCompassMilestoneV2 {
  id: string;
  label: string;
  detail: string;
  state: RunCompassMilestoneStateV2;
  currentRealmLabel: string;
  nextRealmLabel: string | null;
  contextLine: string;
  chapterLine?: string | null;
}

export type RunCompassBlockerKindV2 =
  | 'none'
  | 'life_setup_missing_path'
  | 'life_setup_missing_heart_law'
  | 'content_cap'
  | 'prestige_recommended'
  | 'breakthrough_qi_short'
  | 'breakthrough_gate_proof_missing'
  | 'gate_not_at_realm_edge'
  | 'gate_lifecycle_locked'
  | 'gate_recent_failure'
  | 'safety_net_available'
  | 'readiness_shortfall'
  | 'forge_floor_shortfall'
  | 'apothecary_prep_shortfall'
  | 'build_correction_gap'
  | 'manual_pavilion_gap'
  | 'bounty_merit_shortfall'
  | 'expedition_shortage_smoothing'
  | 'attempt_gate_now'
  | 'unknown';

export interface RunCompassBlockerV2 {
  kind: RunCompassBlockerKindV2;
  label: string;
  detail: string;
  severity: 'none' | 'info' | 'warning' | 'danger' | 'success';
  source: 'progression' | 'trial_lifecycle' | 'readiness' | 'economy' | 'build' | 'prestige' | 'content_cap' | 'run_delta' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

export interface RunCompassRouteV2 {
  id: string;
  label: string;
  actionLabel: string;
  detail: string;
  destinationLabel: string;
  target: RunCompassActionTarget | null;
  blocked: boolean;
  blockedReason: string | null;
  expectedDeltaLabel: string | null;
  source: 'progression' | 'trial_lifecycle' | 'readiness' | 'economy' | 'prestige' | 'run_delta' | 'fallback';
  priority: number;
}

export interface RunCompassInfoLineV2 {
  id: string;
  label: string;
  detail: string;
  tone?: 'default' | 'warning' | 'success' | 'muted';
}

export interface RunCompassReadinessV2 {
  score: number | null;
  label: string;
  band: string | null;
  diagnosisLabel: string | null;
  primaryShortfallLabel: string | null;
  rows: RunCompassInfoLineV2[];
}

export interface RunCompassCityContextV2 {
  cityId: string;
  cityName: string;
  visibleModuleKeys: LiveWorldModuleKey[];
  recommendedModuleKey: LiveWorldModuleKey | null;
}

export interface RunCompassGateContextV2 {
  trialId: string;
  gateLabel: string;
  fromRealmLabel: string;
  toRealmLabel: string;
  gateProofItemId: string | null;
  gateProofItemName: string | null;
  lifecycleState: string;
  resolved: boolean;
  canAttempt: boolean;
  canBreakthrough: boolean;
  failSafeAvailable: boolean;
}

export interface RunCompassSafetyNetV2 {
  state: 'hidden' | 'available' | 'blocked' | 'progressing';
  label: string;
  detail: string;
  progressLine: string;
  target: RunCompassActionTarget | null;
}

export interface RunCompassPrestigeHintV2 {
  state: 'hidden' | 'available' | 'recommended' | 'cap_recommended' | 'blocked';
  label: string;
  detail: string;
  target: RunCompassActionTarget | null;
}

export interface RunCompassDeltaSummaryV2 {
  id: string;
  source: string;
  timestamp: number;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'muted';
  label: string;
  detail: string;
  memoryLine: string;
  rewardSummary?: string | null;
  readinessDelta?: {
    beforeLabel?: string | null;
    afterLabel?: string | null;
    deltaLabel?: string | null;
  } | null;
}

export interface RunCompassSurfaceV2 {
  version: 2;
  generatedAt: number;
  mode: 'live' | 'fixture' | 'fallback';
  milestone: RunCompassMilestoneV2;
  primaryBlocker: RunCompassBlockerV2;
  primaryRoute: RunCompassRouteV2;
  secondaryRoutes: RunCompassRouteV2[];
  readiness: RunCompassReadinessV2;
  currentCity: RunCompassCityContextV2 | null;
  currentGate: RunCompassGateContextV2 | null;
  safetyNet: RunCompassSafetyNetV2 | null;
  prestigeHint: RunCompassPrestigeHintV2 | null;
  recentDeltas: RunCompassDeltaSummaryV2[];
  debugNotes: string[];
}
