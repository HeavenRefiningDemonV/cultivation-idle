import type { CityId, MajorRealmId, TrialId } from '../../../src/systems/progression/contract/index.js';

export type AlternativeRouteId = 'fail_safe' | 'offline_heavy' | 'low_attention' | 'high_skill' | 'reclaim';

export type AlternativeRouteAutomationMode = 'automated_blocking' | 'automated_non_blocking' | 'manual_coverage';

export type AlternativeRouteStatus = 'pass' | 'fail' | 'warning_only';

export type AlternativeRouteCheckpointId =
  | 'route_started'
  | 'gate_available'
  | 'eligible_failure_1'
  | 'eligible_failure_2'
  | 'eligible_failure_3'
  | 'bypass_available'
  | 'bypass_purchased'
  | 'post_bypass_continuity'
  | 'offline_window_8h_1'
  | 'offline_window_8h_2'
  | 'offline_gate_wall_verified'
  | 'low_attention_surface_scan'
  | 'low_attention_alert_response'
  | 'route_completed'
  | `custom:${string}`;

export type AlternativeRouteCheckpointRow = {
  checkpointId: AlternativeRouteCheckpointId;
  elapsedMsSinceStart: number;
  source: 'runner' | 'event' | 'assertion';
  detail?: string;
};

export type AlternativeRouteWarning = {
  code: string;
  message: string;
};

export type AlternativeRouteFailure = {
  code: string;
  message: string;
  blocker: boolean;
};

export type AlternativeRouteInteractionRow = {
  reason:
    | 'path_setup'
    | 'heart_law_setup'
    | 'gate_available'
    | 'post_failure_adjustment'
    | 'expedition_idle'
    | 'tracked_bounty_attention'
    | 'run_compass_guidance'
    | 'status_troubleshooting'
    | 'chapter_cap_or_prestige';
  elapsedMsSinceStart: number;
  triggeredBy: 'alert' | 'prompt' | 'recommendation' | 'manual';
  detail: string;
};

export type AlternativeRouteAlertAuditRow = {
  source: 'run_compass' | 'world_command' | 'status_troubleshooting' | 'onboarding' | 'notification_policy';
  count: number;
  detail: string;
};

export type AlternativeRouteComparisonRow = {
  metric: string;
  routeValue: number | string | boolean;
  baselineValue: number | string | boolean;
  verdict: 'better' | 'worse' | 'equal' | 'non_dominant' | 'informational';
  detail: string;
};

export type AlternativeRouteFinalSnapshot = {
  finalRealmId: MajorRealmId;
  currentCityId: CityId | null;
  unlockedCityIds: CityId[];
  currentGateTrialId?: TrialId | null;
  reachedSpiritSevering: boolean;
  reachedContentCap: boolean;
  currentChapterExhaustedTruthAvailable?: boolean;
  prestigeAdvisorAvailable?: boolean;
  lifeSummaryAvailable?: boolean;
  eligibleFailuresByTrial?: Record<string, number>;
  bypassPurchases?: Array<{ trialId: string; threshold: number; eligibleFailures: number; spent: { gold: string; merit: string; spiritStones: string } }>;
  offlineWindowsApplied?: number;
  estimatedAttentionInteractions?: number;
  alertCounts?: Record<string, number>;
  noFakeCitySix: boolean;
};

export type AlternativeRouteResult = {
  routeId: AlternativeRouteId;
  automationMode: AlternativeRouteAutomationMode;
  status: AlternativeRouteStatus;
  startedAt: number;
  completedAt: number;
  elapsedMs: number;
  checkpoints: AlternativeRouteCheckpointRow[];
  failures: AlternativeRouteFailure[];
  warnings: AlternativeRouteWarning[];
  interactionLog: AlternativeRouteInteractionRow[];
  alertAudit: AlternativeRouteAlertAuditRow[];
  comparisonRows: AlternativeRouteComparisonRow[];
  finalSnapshot: AlternativeRouteFinalSnapshot;
  notes: string[];
};

export type AlternativeRouteSpec = {
  id: AlternativeRouteId;
  title: string;
  goal: string;
  automationMode: AlternativeRouteAutomationMode;
  proves: string[];
  doesNotProve: string[];
  requiredLiveSystems: string[];
  baselineComparisonTarget: string;
  keyAcceptanceChecks: string[];
  knownLimitations: string[];
};
