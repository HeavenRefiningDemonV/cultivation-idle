export type DriftCategory =
  | 'PATH_TRUTH_SPLIT'
  | 'GATE_NAMESPACE_SPLIT'
  | 'TRIAL_ENTRY_CONTRADICTION'
  | 'CITY_UNLOCK_UNBOUND'
  | 'PARTIAL_PRESTIGE_RESET'
  | 'OFFLINE_PIPELINE_SPLIT'
  | 'LIVE_DEFERRED_LEAK'
  | 'UNKNOWN_REALM_REFERENCE'
  | 'ORPHAN_GATE_ITEM'
  | 'HIDDEN_PRESTIGE_RUNTIME_CONSUMER'
  | 'MIGRATION_ALIAS_PRESENT'
  | 'CONTENT_CAP_BREACH'
  | 'WORLD_CITY_SCHEMA_DRIFT'
  | 'WORLD_CITY_PACKAGE_COMPLETENESS_DRIFT'
  | 'ACTIVITY_REWARD_PARITY_DRIFT';

export type DriftSeverity = 'info' | 'warning' | 'error';

export interface DriftEvidence {
  path: string;
  detail: string;
}

export interface DriftIssue {
  id: string;
  category: DriftCategory;
  severity: DriftSeverity;
  summary: string;
  evidence: DriftEvidence[];
  suggestedOwnerPacket: string;
  fixStrategySummary: string;
  autoFixable: boolean;
}

export interface DiagnosticsInputs {
  authoredContent: {
    economyRealms: string[];
    cities: Array<{ id: string; unlockMajorRealm: string }>;
    trials: Array<{ id: string; gateItemId: string; fromMajorRealm?: string; toMajorRealm?: string }>;
    items: string[];
  };
  runtimeFileTextByPath?: Record<string, string>;
}
