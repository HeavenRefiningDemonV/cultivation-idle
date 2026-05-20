import type { LiveWorldModuleKey } from '../../../content/index.js';
import type { GameTab } from '../../../stores/uiStore.js';

export type DaoMandateGuidanceProfile = 'sealed' | 'elder' | 'jade';
export type DaoMandateMode = 'live' | 'fixture' | 'fallback';
export type DaoMandateConfidence = 'high' | 'medium' | 'low';

export type DaoMandateTone =
  | 'neutral'
  | 'muted'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type DaoMandateTruthSource =
  | 'progression'
  | 'trial_lifecycle'
  | 'gate_resolver'
  | 'city_progression'
  | 'readiness'
  | 'economy'
  | 'build'
  | 'failure_reflection'
  | 'offline'
  | 'prestige'
  | 'content_cap'
  | 'run_delta'
  | 'status_dashboard'
  | 'run_compass_v2'
  | 'fixture'
  | 'fallback';

export type DaoMandateRouteSource =
  | 'progression'
  | 'trial_lifecycle'
  | 'readiness'
  | 'economy'
  | 'build'
  | 'prestige'
  | 'content_cap'
  | 'run_delta'
  | 'failure_reflection'
  | 'offline'
  | 'fixture'
  | 'fallback';

export type DaoMandateState =
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
  | 'prestige_recommended'
  | 'fallback';

export type DaoMandateObstructionKind =
  | 'none'
  | 'life_setup_missing_path'
  | 'life_setup_missing_heart_law'
  | 'life_setup_missing_breath_focus'
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
  | 'required_item_missing'
  | 'source_route_locked'
  | 'invalid_state'
  | 'unknown';

export type DaoMandateScreenId =
  | 'cultivation'
  | 'status'
  | 'world'
  | 'gateTrial'
  | 'outskirts'
  | 'ruins'
  | 'apothecary'
  | 'forge'
  | 'manualPavilion'
  | 'techniques'
  | 'bounties'
  | 'expeditions'
  | 'inventory'
  | 'records'
  | 'prestige'
  | 'settings';

export type DaoMandateTabTarget = GameTab;

export type DaoMandateRouteTarget =
  | { kind: 'tab'; tab: DaoMandateTabTarget }
  | { kind: 'world_module'; cityId: string; moduleKey: LiveWorldModuleKey };

export interface DaoMandateRoute {
  id: string;
  label: string;
  actionLabel: string;
  detail: string;
  destinationLabel: string;
  target: DaoMandateRouteTarget | null;
  blocked: boolean;
  blockedReason: string | null;
  expectedDeltaLabel: string | null;
  source: DaoMandateRouteSource;
  priority: number;
  activityMode?: 'active' | 'passive' | 'background' | null;
}

export interface DaoMandateObstruction {
  kind: DaoMandateObstructionKind;
  label: string;
  detail: string;
  severity: 'none' | 'info' | 'warning' | 'danger' | 'success';
  source: DaoMandateRouteSource;
  confidence: DaoMandateConfidence;
  evidenceIds: string[];
}

export type DaoRequirementBucket =
  | 'hard_gate'
  | 'readiness_floor'
  | 'support_reserve'
  | 'source_route'
  | 'optional_optimization'
  | 'recent_omen';

export type DaoRequirementState =
  | 'unmet'
  | 'partial'
  | 'met'
  | 'resolved'
  | 'blocked'
  | 'unknown';

export interface DaoRequirementRow {
  id: string;
  bucket: DaoRequirementBucket;
  label: string;
  detail: string;
  currentLabel: string | null;
  targetLabel: string | null;
  state: DaoRequirementState;
  tone: DaoMandateTone;
  route: DaoMandateRoute | null;
  source: DaoMandateRouteSource;
  proofLine: string | null;
  sourceLine: string | null;
  priority: number;
}

export interface DaoRequirementLedger {
  hardGates: DaoRequirementRow[];
  readinessFloors: DaoRequirementRow[];
  supportReserves: DaoRequirementRow[];
  sourceRoutes: DaoRequirementRow[];
  optionalOptimizations: DaoRequirementRow[];
  recentOmens: DaoRequirementRow[];
}

export interface DaoReadinessRow {
  id: string;
  label: string;
  detail: string;
  currentLabel: string | null;
  targetLabel: string | null;
  tone: DaoMandateTone;
  source: 'readiness' | 'economy' | 'trial_lifecycle' | 'build' | 'fallback';
  route: DaoMandateRoute | null;
}

export interface DaoReadinessLedger {
  score: number | null;
  label: string;
  band: string | null;
  diagnosisLabel: string | null;
  primaryShortfallLabel: string | null;
  rows: DaoReadinessRow[];
  confidence: DaoMandateConfidence;
}

export interface DaoSourceOption {
  id: string;
  label: string;
  detail: string;
  route: DaoMandateRoute | null;
  lockedReason: string | null;
  activityMode: 'active' | 'passive' | 'background';
  confidence: DaoMandateConfidence;
}

export interface DaoSourceMapEntry {
  id: string;
  neededThingLabel: string;
  neededThingId: string | null;
  problemKind: string | null;
  sinkLabel: string;
  expectedImpactLabel: string | null;
  bestSources: DaoSourceOption[];
  fallbackSources: DaoSourceOption[];
  route: DaoMandateRoute | null;
}

export interface DaoCurrentWorkSurface {
  foreground: {
    label: string;
    detail: string;
    tone: DaoMandateTone;
    route: DaoMandateRoute | null;
  };
  activeCombat: DaoRequirementRow | null;
  trackedBounty: DaoRequirementRow | null;
  expeditions: DaoRequirementRow | null;
  queues: DaoRequirementRow[];
}

export interface DaoBackgroundPlanSurface {
  idleSlotCount: number | null;
  adviceLabel: string;
  adviceDetail: string;
  routes: DaoMandateRoute[];
  offlineProjectionLabel: string | null;
}

export interface DaoSafetyNetSurface {
  state: 'hidden' | 'available' | 'blocked' | 'progressing' | 'resolved';
  label: string;
  detail: string;
  progressLine: string;
  costLine: string | null;
  reserveLine: string | null;
  route: DaoMandateRoute | null;
}

export interface DaoReincarnationCounselSurface {
  state: 'hidden' | 'too_early' | 'viable' | 'recommended' | 'cap_recommended' | 'blocked';
  label: string;
  detail: string;
  route: DaoMandateRoute | null;
  forecastLine: string | null;
}

export interface DaoRecentOmen {
  id: string;
  source: string;
  timestamp: number;
  tone: DaoMandateTone;
  label: string;
  detail: string;
  memoryLine: string;
  rewardSummary: string | null;
  readinessDeltaLabel: string | null;
}

export interface DaoJadeSlip {
  id: string;
  title: string;
  detail: string;
  trigger: string;
  relatedRowId: string | null;
  route: DaoMandateRoute | null;
  profile: DaoMandateGuidanceProfile | 'all';
}

export interface DaoLocalLensSurface {
  screenId: string;
  relation: 'primary' | 'support' | 'future' | 'quiet' | 'blocked';
  label: string;
  detail: string;
  route: DaoMandateRoute | null;
  evidenceIds: string[];
}

export interface DaoMandateSurfaceV1 {
  meta: {
    version: 1;
    generatedAt: number;
    mode: DaoMandateMode;
    guidanceProfile: DaoMandateGuidanceProfile;
    currentScreen?: string;
    confidence: DaoMandateConfidence;
    sourceIds: string[];
    debugNotes: string[];
  };
  milestone: {
    id: string;
    label: string;
    detail: string;
    state: DaoMandateState;
    currentRealmLabel: string;
    nextRealmLabel: string | null;
    currentCityId: string | null;
    currentCityName: string | null;
    chapterLine: string | null;
  };
  obstruction: DaoMandateObstruction;
  primaryRoute: DaoMandateRoute;
  secondaryRoutes: DaoMandateRoute[];
  requirementLedger: DaoRequirementLedger;
  readiness: DaoReadinessLedger;
  sourceMap: DaoSourceMapEntry[];
  currentWork: DaoCurrentWorkSurface;
  backgroundPlan: DaoBackgroundPlanSurface;
  safetyNet: DaoSafetyNetSurface | null;
  prestige: DaoReincarnationCounselSurface | null;
  recentOmens: DaoRecentOmen[];
  lessonSlips: DaoJadeSlip[];
  localLens: DaoLocalLensSurface | null;
}
