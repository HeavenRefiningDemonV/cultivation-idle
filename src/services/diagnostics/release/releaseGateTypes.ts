export type ReleaseGateCheckId =
  | 'runtime_content_manifest'
  | 'build_audit'
  | 'content_validation'
  | 'progression_contract'
  | 'fresh_run_acceptance'
  | 'migration_matrix'
  | 'balance_regression'
  | 'route_comparison'
  | 'runtime_diagnostics'
  | 'mp5_reset_memory'
  | 'mp5_offline_trust'
  | 'mp5_telemetry_schema'
  | 'mp5_balance_simulations'
  | 'mp5_prestige_runtime_audit'
  | 'vocabulary_audit'
  | 'full_test_suite';

export type ReleaseGateCheckStatus = 'pass' | 'fail' | 'warning' | 'pending_manual' | 'skipped';
export type ReleaseGateFindingSeverity = 'blocker' | 'waiver_candidate' | 'post_semester_debt' | 'info';

export type ReleaseGateFinding = {
  findingId: string;
  checkId: ReleaseGateCheckId;
  title: string;
  message: string;
  severity: ReleaseGateFindingSeverity;
  ownerPacket?: string;
  evidenceRef?: string;
  evidencePath?: string;
  waivable: boolean;
  sourceKind: 'builder' | 'command' | 'ledger' | 'derived';
  rawSourceId?: string;
};

export type ReleaseGateCommandEvidence = {
  command: string;
  exitCode: number;
  stdoutPreview: string;
  stderrPreview: string;
  timedOut?: boolean;
  durationMs?: number;
};

export type ReleaseGateCheckResult = {
  checkId: ReleaseGateCheckId;
  status: ReleaseGateCheckStatus;
  elapsedMs: number;
  commandOrBuilder: string;
  summary: string;
  blockerCount: number;
  warningCount: number;
  pendingManualCount: number;
  findings: ReleaseGateFinding[];
  evidence: string[];
  commandEvidence?: ReleaseGateCommandEvidence;
  rawPayload?: unknown;
};

export type ReleaseGateKnownIssueSummary = {
  openBlockers: number;
  acceptedWaivers: number;
  postSemesterDebt: number;
  resolved: number;
  untrackedFindings: number;
};

export type ReleaseGateDecisionSummary = {
  headline: 'PASS' | 'PASS_WITH_ACCEPTED_WAIVERS' | 'NO_GO';
  rationale: string[];
};

export type ReleaseGateSliceSummary = {
  contentCapRealmId: string;
  liveCityIds: string[];
  liveCityCount: number;
  fakeCitySixDetected: boolean;
  deferredSystems: string[];
};

export type ReleaseGateReport = {
  schemaVersion: '7.6-release-gate';
  generatedAt: number;
  overallPass: boolean;
  cleanPass: boolean;
  releaseReady: boolean;
  unresolvedBlockerCount: number;
  acceptedWaiverCount: number;
  unresolvedWaiverCandidateCount: number;
  pendingManualCount: number;
  checks: ReleaseGateCheckResult[];
  knownIssueSummary: ReleaseGateKnownIssueSummary;
  decisionSummary: ReleaseGateDecisionSummary;
  sliceSummary: ReleaseGateSliceSummary;
};
