import type {
  DaoMandateRoute,
  DaoMandateScreenId,
  DaoMandateSurfaceV1,
  DaoRecentOmen,
} from './daoMandateTypes.js';

export type DaoOmenKind =
  | 'quiet'
  | 'life_setup'
  | 'threshold_unreached'
  | 'proof_missing'
  | 'reserve_thin'
  | 'gear_floor_strained'
  | 'doctrine_uncertain'
  | 'support_reserve_low'
  | 'currency_reserve_low'
  | 'source_drought'
  | 'attemptable'
  | 'risky_attempt'
  | 'reflection'
  | 'safety_net_ready'
  | 'breakthrough_ready'
  | 'reincarnation_viable'
  | 'content_cap';

export type DaoOmenLifeStage =
  | 'setup'
  | 'cultivating'
  | 'preparing'
  | 'gate'
  | 'breakthrough'
  | 'reincarnation'
  | 'cap';

export type DaoOmenSeverity =
  | 'quiet'
  | 'observed'
  | 'thin'
  | 'locked'
  | 'ready'
  | 'reflection'
  | 'cap';

export type DaoOmenTone =
  | 'ink'
  | 'jade'
  | 'bronze'
  | 'cinnabar'
  | 'gold';

export type DaoOmenDirectRouteReason =
  | 'setup'
  | 'hard_lock'
  | 'repeated_failure'
  | 'safety_net'
  | 'breakthrough'
  | 'reincarnation'
  | 'content_cap'
  | 'player_expanded';

export interface DaoCurrentOmenV1 {
  id: string;
  kind: DaoOmenKind;
  title: string;
  detail: string;
  severity: DaoOmenSeverity;
  iconId: string;
  tone: DaoOmenTone;
  allowDirectRoute: boolean;
  directRouteReason?: DaoOmenDirectRouteReason;
  route?: DaoMandateRoute;
  evidenceIds: string[];
}

export type DaoProofSealKind =
  | 'path'
  | 'heart_law'
  | 'realm_edge'
  | 'qi_threshold'
  | 'gate_proof'
  | 'survival_reserve'
  | 'forge_floor'
  | 'doctrine_expression'
  | 'support_reserve'
  | 'source_thread'
  | 'failure_reflection'
  | 'mercy_seal'
  | 'reincarnation';

export type DaoProofSealState =
  | 'quiet'
  | 'unknown'
  | 'thin'
  | 'strained'
  | 'unsealed'
  | 'sealed'
  | 'ready'
  | 'locked'
  | 'reflected'
  | 'cap';

export interface DaoProofSealV1 {
  id: string;
  kind: DaoProofSealKind;
  label: string;
  state: DaoProofSealState;
  tone: DaoOmenTone;
  iconId: string;
  detail: string;
  ownerScreen: DaoMandateScreenId;
  evidenceIds: string[];
  route?: DaoMandateRoute;
  routePolicy: 'hidden' | 'inspect' | 'direct';
}

export type DaoPressureBadgeKind =
  | 'survival'
  | 'forge'
  | 'doctrine'
  | 'support'
  | 'source';

export type DaoPressureBadgeState =
  | 'quiet'
  | 'stable'
  | 'unknown'
  | 'thin'
  | 'strained'
  | 'low'
  | 'ready';

export interface DaoPressureBadgeV1 {
  id: string;
  kind: DaoPressureBadgeKind;
  label: string;
  state: DaoPressureBadgeState;
  tone: DaoOmenTone;
  iconId: string;
  detail: string;
  ownerScreen: DaoMandateScreenId;
  evidenceIds: string[];
}

export type DaoSourceThreadRouteVisibility =
  | 'hidden'
  | 'drawer'
  | 'local_owner'
  | 'hard_lock';

export interface DaoSourceThreadOptionV1 {
  id: string;
  label: string;
  detail: string;
  route?: DaoMandateRoute;
  lockedReason?: string | null;
  activityMode?: 'active' | 'passive' | 'background' | null;
}

export interface DaoSourceThreadV1 {
  id: string;
  label: string;
  missingThing: string;
  sinkLabel: string;
  evidenceLine: string;
  bestSource: DaoSourceThreadOptionV1 | null;
  fallbackSources: DaoSourceThreadOptionV1[];
  routeVisibility: DaoSourceThreadRouteVisibility;
  ownerScreen: DaoMandateScreenId;
  evidenceIds: string[];
}

export type DaoReflectionKind =
  | 'survival_pattern'
  | 'forge_pattern'
  | 'doctrine_pattern'
  | 'threshold_pattern'
  | 'source_pattern'
  | 'unknown_pattern';

export interface DaoReflectionV1 {
  id: string;
  kind: DaoReflectionKind;
  label: string;
  detail: string;
  tone: DaoOmenTone;
  iconId: string;
  evidenceIds: string[];
  correctionRoute?: DaoMandateRoute;
}

export interface DaoOmenProjectionV1 {
  projectionVersion: 1;
  generatedAt: number;
  lifeStage: DaoOmenLifeStage;
  sourceSurface: {
    mode: DaoMandateSurfaceV1['meta']['mode'];
    generatedAt: number;
    confidence: DaoMandateSurfaceV1['meta']['confidence'];
    sourceIds: string[];
    rawSurfaceId: string;
  };
  currentOmen: DaoCurrentOmenV1;
  proofSeals: DaoProofSealV1[];
  pressureBadges: DaoPressureBadgeV1[];
  recentOmens: DaoRecentOmen[];
  reflections: DaoReflectionV1[];
  sourceThreads: DaoSourceThreadV1[];
  hardRoutes: DaoMandateRoute[];
  debug?: {
    notes: string[];
    selectedPriority: string;
    suppressedRouteIds: string[];
    fixtureState?: string;
  };
}
