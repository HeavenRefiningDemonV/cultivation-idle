import type { PathId } from '../../../content/types.js';
import type {
  StatusBuildPrepGroupSurface,
  StatusCauseRowSurface,
  StatusCurrentStateSurfaceV1,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerRequirementRow,
  StatusLedgerSurfaceV1,
  StatusSpiritRootElement,
  StatusLedgerTone,
  StatusNamedStatBridgeSocket,
  StatusNamedStatContributionState,
  StatusNamedStatNodeState,
  StatusNamedStatSourceEntry,
  StatusNamedStatUnlockState,
} from './statusLedgerTypes.js';

export const STATUS_OBSERVATORY_SCHEMA_VERSION = 'status-observatory-v1' as const;
export const STATUS_OBSERVATORY_SOURCE_SCHEMA_VERSION = 'status-ledger-v1' as const;

export type StatusObservatoryMode = 'fixture' | 'live' | 'fallback';

export type StatusObservatoryVisualState =
  | 'blocked'
  | 'healthy'
  | 'postFailure'
  | 'prestigePressure'
  | 'contentCap'
  | 'unknown';

export type StatusObservatoryNoLossFamily =
  | 'hero'
  | 'metrics'
  | 'currentState'
  | 'spiritRootObservation'
  | 'milestone'
  | 'cultivationBase'
  | 'missionRequirements'
  | 'bestImprovements'
  | 'safetyNet'
  | 'identityDoctrine'
  | 'currentWork'
  | 'buildPreparation'
  | 'recentChanges'
  | 'details'
  | 'namedStats';

export interface StatusObservatoryNoLossFamilySurface {
  family: StatusObservatoryNoLossFamily;
  sourcePath: string;
  defaultHome: string;
  exactHome: string;
  represented: boolean;
  rowCount: number;
  actionCount: number;
}

export interface StatusObservatoryNoLossSurface {
  allRepresented: boolean;
  missingFamilies: StatusObservatoryNoLossFamily[];
  families: StatusObservatoryNoLossFamilySurface[];
}

export interface StatusSelectedContextSurface {
  kind: 'organ' | 'stat' | 'talisman' | 'rootLaw' | 'work';
  id: string;
  label: string;
  detail: string;
}

export interface StatusCausalThreadSurface {
  id: string;
  fromFamily: StatusObservatoryNoLossFamily | 'statConstellation' | 'rootLawInstrument' | 'meridianVessel';
  fromId: string;
  toFamily: StatusObservatoryNoLossFamily | 'bottleneckCanopy';
  toId: string;
  label: string;
  detail: string;
  tone: StatusLedgerTone;
}

export interface StatusObservatoryMetricSealSurface {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: StatusLedgerTone;
  icon: StatusLedgerFactRow['icon'];
  sourceLabel: string;
  ariaLabel: string;
}

export interface StatusRootLawBridgeSurface {
  state: 'aligned' | 'compatible' | 'strained' | 'opposed' | 'unknown';
  fitTier: StatusLedgerSurfaceV1['spiritRootObservation']['fit']['tier'] | 'unknown';
  label: string;
  detail: string;
  broken: boolean;
  tone: StatusLedgerTone;
  ariaLabel: string;
}

export type StatusRootAstrolabeRootId = Exclude<StatusSpiritRootElement, 'dormant'>;

export interface StatusRootAstrolabeNotchSurface {
  id: StatusRootAstrolabeRootId;
  label: string;
  shortLabel: string;
  angleDeg: number;
  active: boolean;
  tone: StatusLedgerTone;
  ariaLabel: string;
}

export interface StatusRootAstrolabeProcSurface {
  name: string;
  statusLabel: string;
  cooldownLabel: string | null;
}

export interface StatusRootAstrolabeSurface {
  title: 'Spirit Root Astrolabe';
  spiritRoot: StatusLedgerSurfaceV1['identityDoctrine']['spiritRoot'];
  activeRootId: StatusSpiritRootElement;
  notches: StatusRootAstrolabeNotchSurface[];
  gradeLabel: string;
  purityLabel: string | null;
  totalMultiplierLabel: string | null;
  fitLabel: string;
  fitTier: StatusRootLawBridgeSurface['fitTier'];
  expressionCapLabel: string | null;
  proc: StatusRootAstrolabeProcSurface | null;
  runValidityLabel: string | null;
  impactRows: StatusLedgerFactRow[];
  routeActions: StatusLedgerActionSurface[];
  ariaLabel: string;
}

export interface StatusHeartLawChapterBeadSurface {
  id: string;
  label: string;
  active: boolean;
  filled: boolean;
}

export interface StatusHeartLawSealSurface {
  title: 'Heart Law Seal';
  heartLawLabel: string;
  chapterLabel: string;
  chapterBeads: StatusHeartLawChapterBeadSurface[];
  daoHeartStateLabel: string | null;
  clarityLabel: string | null;
  turbulenceLabel: string | null;
  routeAction: StatusLedgerActionSurface | null;
  ariaLabel: string;
}

export interface StatusMeridianOrganSurface {
  id: keyof StatusCurrentStateSurfaceV1['blocks'];
  ordinal: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  valueLabel: string;
  state: StatusCurrentStateSurfaceV1['blocks'][keyof StatusCurrentStateSurfaceV1['blocks']]['state'];
  consequence: string;
  route: StatusLedgerActionSurface | null;
  detailRows: StatusCurrentStateSurfaceV1['blocks'][keyof StatusCurrentStateSurfaceV1['blocks']]['detailRows'];
  icon: StatusCurrentStateSurfaceV1['blocks'][keyof StatusCurrentStateSurfaceV1['blocks']]['icon'];
  ariaLabel: string;
  sourceBlock: StatusCurrentStateSurfaceV1['blocks'][keyof StatusCurrentStateSurfaceV1['blocks']];
}

export interface StatusMeridianFocusLensSurface {
  selectedOrganId: keyof StatusCurrentStateSurfaceV1['blocks'];
  label: string;
  value: string;
  consequence: string;
  route: StatusLedgerActionSurface | null;
  sources: string[];
}

export interface StatusMeridianCauseStampSurface {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: StatusLedgerTone;
  sourceLabel: string;
  ariaLabel: string;
}

export interface StatusObservatoryStatNodeSurface {
  id: string;
  displayName: string;
  shortLabel: string;
  label: string;
  detail: string;
  path: StatusNamedStatSourceEntry['path'];
  branchId: StatusNamedStatSourceEntry['branchId'];
  category: StatusNamedStatSourceEntry['category'];
  tier: StatusNamedStatSourceEntry['tier'];
  sourceSystems: string[];
  effectSummary: string;
  currentRating: number;
  cap: number;
  capPct: number;
  unlockRealmIndex: number | null;
  unlockRealmLabel: string | null;
  lockedReason: string | null;
  unlockState: StatusNamedStatUnlockState;
  nodeState: StatusNamedStatNodeState;
  contributionState: StatusNamedStatContributionState;
  visible: true;
  weakLink: boolean;
  weakReason: string | null;
  tone: StatusLedgerTone;
  routeAction: StatusLedgerActionSurface | null;
  detailRows: StatusLedgerFactRow[];
  ariaLabel: string;
}

export interface StatusStatBranchSurface {
  id: StatusNamedStatSourceEntry['path'];
  title: string;
  role: string;
  expectedCount: number;
  actualCount: number;
}

export interface StatusStatConstellationLegendEntry {
  id: string;
  label: string;
  detail: string;
  nodeState: StatusNamedStatNodeState | 'bridge_socket';
}

export interface StatusBottleneckEdictSurface {
  label: string;
  detail: string;
  sourceLabel: string;
  visualState: StatusObservatoryVisualState;
  primaryAction: StatusLedgerActionSurface | null;
}

export interface StatusBottleneckSlipGeometrySurface {
  x: number;
  y: number;
  rotationDeg: number;
  anchor: 'top' | 'right' | 'bottom' | 'left' | 'center';
}

export interface StatusBottleneckCharmGeometrySurface {
  x: number;
  y: number;
}

export interface StatusBottleneckTalismanSlipSurface {
  id: string;
  title: string;
  priorityLabel: string | null;
  stateLabel: string | null;
  detail: string;
  tone: StatusLedgerTone;
  routeAction: StatusLedgerActionSurface | null;
  routeLabel: string | null;
  sourceFamily: StatusObservatoryNoLossFamily;
  sourceLabel: string;
  detailRows: Array<StatusLedgerRequirementRow | StatusLedgerFactRow | StatusCauseRowSurface>;
  geometry: StatusBottleneckSlipGeometrySurface;
  ariaLabel: string;
}

export interface StatusRouteCharmSurface {
  id: string;
  label: string;
  detail: string;
  action: StatusLedgerActionSurface;
  order: number;
  geometry: StatusBottleneckCharmGeometrySurface;
}

export interface StatusSafetySealSurface {
  label: string;
  stateLabel: string;
  progressLabel: string;
  tone: StatusLedgerTone;
  action: StatusLedgerActionSurface | null;
  rows: StatusLedgerFactRow[];
}

export interface StatusBottleneckInspectorSurface {
  selectedSlipId: string | null;
  title: string;
  detail: string;
  sourceFamily: StatusObservatoryNoLossFamily | null;
  sourceLabel: string;
  priorityLabel: string | null;
  stateLabel: string | null;
  tone: StatusLedgerTone;
  routeAction: StatusLedgerActionSurface | null;
  detailRows: Array<StatusLedgerRequirementRow | StatusLedgerFactRow | StatusCauseRowSurface>;
}

export interface StatusBuildPreparationScaleSurface {
  title: string;
  build: StatusBuildPrepGroupSurface;
  preparation: StatusBuildPrepGroupSurface;
  fulcrumLabel: string;
  lowStateRows: StatusLedgerFactRow[];
}

export interface StatusReserveJarSurface {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: StatusLedgerTone;
  sourceLabel: string;
}

export interface StatusWorkWheelSpokeSurface {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: StatusLedgerTone;
  route: StatusLedgerActionSurface | null;
}

export type StatusObservatoryDrawerKind =
  | 'buildPreparation'
  | 'currentWork'
  | 'recentChanges'
  | 'calculation'
  | 'sourceCoverage';

export interface StatusObservatoryDrawerRequest {
  kind: StatusObservatoryDrawerKind;
  sourceId?: string;
}

/**
 * M.I.3 (S0) — read-only telemetry hints for the Observatory's liveness layer (the tick-driven motion
 * vars). Display-only; NEVER consumed by gameplay. Nullable by design (unknown ⇒ motion falls back to its
 * constant, never throws). cultivationRate is a normalized 0..1 presentational scalar ([tune]→D15);
 * qiPerSecond is the raw gain rate (the motion model log10s it itself for the qi-flow scalar).
 */
export interface StatusObservatoryMotionHints {
  qiPerSecond: number | null;
  cultivationRate: number | null;
}

export interface StatusObservatorySurfaceV1 {
  meta: {
    rootTestId: 'status-ledger-root';
    schemaVersion: typeof STATUS_OBSERVATORY_SCHEMA_VERSION;
    sourceSchemaVersion: typeof STATUS_OBSERVATORY_SOURCE_SCHEMA_VERSION;
    mode: StatusObservatoryMode;
    visualState: StatusObservatoryVisualState;
    selectedContext: StatusSelectedContextSurface | null;
    currentPath: PathId | null;
    generatedAt: number;
    contentLoaded: boolean;
    debugNotes: string[];
    /** M.I.3 (S0) — additive read-only motion telemetry; see StatusObservatoryMotionHints. */
    motionHints: StatusObservatoryMotionHints;
  };
  lifeDecree: {
    rootTestId: 'status-ledger-hero';
    title: 'Life Decree' | 'Life Decree - This Life Record';
    hero: StatusLedgerSurfaceV1['hero'];
    milestone: StatusLedgerSurfaceV1['milestone'];
  };
  vitalsRibbon: {
    rootTestId: 'status-ledger-metrics';
    title: 'Vitals Ribbon';
    metrics: StatusLedgerFactRow[];
    seals: StatusObservatoryMetricSealSurface[];
  };
  rootLawInstrument: {
    rootTestId: 'status-root-law-instrument';
    title: 'Root / Law Coupled Instrument';
    astrolabe: StatusRootAstrolabeSurface;
    heartLawSeal: StatusHeartLawSealSurface;
    bridge: StatusRootLawBridgeSurface;
    spiritRootObservation: StatusLedgerSurfaceV1['spiritRootObservation'];
  };
  meridianVessel: {
    rootTestId: 'status-current-state';
    title: 'Meridian Vessel Compass';
    organs: StatusMeridianOrganSurface[];
    focusLens: StatusMeridianFocusLensSurface;
    sharedCauseStamps: StatusMeridianCauseStampSurface[];
    sharedCauseRows: StatusCurrentStateSurfaceV1['sharedCauseRows'];
    buffDebuffRows: StatusCurrentStateSurfaceV1['buffDebuffRows'];
    nextBottleneck: StatusCurrentStateSurfaceV1['nextBottleneck'];
    legend: ReadonlyArray<{ state: StatusMeridianOrganSurface['state']; label: string; detail: string }>;
  };
  statConstellation: {
    rootTestId: 'status-stat-constellation';
    title: 'Stat Meridian Constellation';
    subtitle: '28 Named Stats - all paths visible';
    currentPath: PathId | null;
    nodes: StatusObservatoryStatNodeSurface[];
    selectedLensDefaultStatId: string | null;
    branchCounts: {
      universal: number;
      heaven: number;
      earth: number;
      martial: number;
    };
    branchPaths: StatusStatBranchSurface[];
    weakLinks: StatusObservatoryStatNodeSurface[];
    bridgeSockets: StatusNamedStatBridgeSocket[];
    legend: readonly StatusStatConstellationLegendEntry[];
    causalThreads: StatusCausalThreadSurface[];
  };
  bottleneckCanopy: {
    rootTestId: 'status-bottleneck-canopy';
    title: 'Bottleneck Talisman Canopy';
    subtitle: 'The node of obstruction and the paths to resolution.';
    centralEdict: StatusBottleneckEdictSurface;
    talismanSlips: StatusBottleneckTalismanSlipSurface[];
    routeCharms: StatusRouteCharmSurface[];
    safetySeal: StatusSafetySealSurface;
    causalThreads: StatusCausalThreadSurface[];
    inspector: StatusBottleneckInspectorSurface;
    missionRequirements: StatusLedgerSurfaceV1['missionRequirements'];
    bestImprovements: StatusLedgerSurfaceV1['bestImprovements'];
    safetyNet: StatusLedgerSurfaceV1['safetyNet'];
  };
  buildPreparation: {
    rootTestId: 'status-ledger-build-preparation';
    title: 'Build & Preparation';
    scales: StatusBuildPreparationScaleSurface;
    reserveJars: StatusReserveJarSurface[];
    rows: StatusLedgerFactRow[];
  };
  workWheel: {
    rootTestId: 'status-ledger-current-work';
    title: 'Current Work Wheel';
    foreground: StatusLedgerFactRow | null;
    spokes: StatusWorkWheelSpokeSurface[];
    rows: StatusLedgerFactRow[];
  };
  ledgerRail: {
    rootTestId: 'status-ledger-details';
    title: 'Folded Ledger Rail';
    recentChanges: StatusLedgerSurfaceV1['recentChanges'];
    details: StatusLedgerSurfaceV1['details'];
    noLossFamilies: StatusObservatoryNoLossFamilySurface[];
  };
  drawers: {
    spiritRootObservation: StatusLedgerSurfaceV1['spiritRootObservation'];
    calculation: StatusLedgerSurfaceV1['details'];
    recentChanges: StatusLedgerSurfaceV1['recentChanges'];
    buildPreparation: {
      title: 'Build & Preparation Ledger';
      rows: StatusLedgerFactRow[];
      buildRows: StatusLedgerFactRow[];
      reserveRows: StatusLedgerFactRow[];
    };
    currentWork: {
      title: 'Current Work Ledger';
      foreground: StatusLedgerFactRow | null;
      spokes: StatusWorkWheelSpokeSurface[];
      rows: StatusLedgerFactRow[];
    };
    missionRequirements: StatusLedgerRequirementRow[];
    selectedStatLens: StatusObservatoryStatNodeSurface | null;
    selectedOrganLens: StatusMeridianOrganSurface | null;
  };
  noLoss: StatusObservatoryNoLossSurface;
  rawLedger: StatusLedgerSurfaceV1;
}
