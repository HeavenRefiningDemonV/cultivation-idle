export type GateTrialExactSurfaceMode = 'fixture' | 'live';
export type GateTrialExactValueSource = 'fixture' | 'live' | 'derived' | 'content' | 'synthetic';
export type GateTrialExactActivityMode = 'locked' | 'available' | 'active' | 'cleared' | 'bypassed' | 'transitioning';
export type GateTrialExactLifecycleState = 'locked' | 'available' | 'cleared' | 'bypassed';
export type GateTrialExactResolution = 'none' | 'cleared' | 'bypassed';
export type GateTrialExactTone = 'neutral' | 'positive' | 'warning' | 'critical' | 'locked' | 'ceremonial';
export type GateTrialExactStatus = 'success' | 'warning' | 'locked' | 'open' | 'active' | 'cleared';
export type GateTrialReadinessSealState = 'viable' | 'locked' | 'warning' | 'cleared' | 'active';

export type GateTrialTacticalCellId =
  | 'hp'
  | 'gate'
  | 'loadout'
  | 'aiProfile'
  | 'healing'
  | 'bounty'
  | 'expedition';

export type GateTrialReadinessNodeId =
  | 'qiCap'
  | 'loadout'
  | 'weapon'
  | 'medicine'
  | 'techniques'
  | 'safetyNet'
  | 'gate';

export type GateTrialFixId = 'forgeWeapon' | 'stockHealing' | 'upgradeTechnique' | 'ruinSupportRun' | 'adjustLoadout' | 'safetyNet';
export type GateTrialRouteTarget = 'forge' | 'apothecary' | 'techniques' | 'ruins' | 'loadout' | 'cultivation' | 'gateTrial';

export type GateTrialButtonIntent =
  | 'attempt-gate'
  | 'stop-attempt'
  | 'buy-safety-net'
  | 'breakthrough-handoff'
  | 'route-to-forge'
  | 'route-to-apothecary'
  | 'route-to-techniques'
  | 'route-to-ruins'
  | 'disabled';

export interface GateTrialExactSurfaceMeta {
  surfaceId: 'gate-trial-exact';
  version: string;
  mode: GateTrialExactSurfaceMode;
  source: 'fixture' | 'stores';
  cityId: string;
  trialId: string | null;
  targetMockupId: string;
  activityMode: GateTrialExactActivityMode;
  lifecycleState: GateTrialExactLifecycleState;
  resolution: GateTrialExactResolution;
  readinessScore: number;
  rootTestId: 'gate-trial-exact-page';
}

export interface GateTrialExactShellFlags {
  useScreenOwnedExactPage: true;
  showLegacyCombatShell: false;
  showGateTrialWorldLayout: false;
  showCombatModuleTopLane: false;
  showGateTrialReadinessCard: false;
  showGateTrialAttemptCluster: false;
  showExternalCombatPreview: false;
  suppressExternalCombatPreview: boolean;
  singleDominantCta: true;
}

export interface GateTrialPageSurface {
  title: 'Gate Trial';
  titleSeal: { visible: boolean; assetKey: string; text: null };
  topRightStatus: readonly string[];
}

export interface GateTrialRibbonNode {
  id: string;
  label: string;
  state: 'completed' | 'current' | 'future';
  variant: 'dot' | 'gate-marker' | 'muted';
  decorative: boolean;
}

export interface GateTrialTopRibbonSurface {
  ariaLabel: string;
  decorative: true;
  currentGateLabel: string;
  activeNodeId: string;
  nodes: ReadonlyArray<GateTrialRibbonNode>;
}

export interface GateTrialTacticalCellSurface {
  id: GateTrialTacticalCellId;
  label: string;
  primaryText: string;
  secondaryText?: string;
  iconKey: string;
  tone: GateTrialExactTone;
  showCaret: boolean;
  showNotificationDot: boolean;
  showUnderlineBar: boolean;
  underlineBarPct?: number;
  reserveAdornmentSpace: boolean;
  visible: boolean;
  source: GateTrialExactValueSource;
}

export interface GateTrialTacticalStripSurface {
  ariaLabel: string;
  cells: readonly [
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
    GateTrialTacticalCellSurface,
  ];
}

export interface GateTrialChipSurface {
  id: string;
  label: string;
  iconKey?: string;
  tone: GateTrialExactTone;
}

export interface GateTrialHeaderSurface {
  title: string;
  subtitle: string;
  plaqueVariant: 'black-gold-foundation';
  chips: ReadonlyArray<GateTrialChipSurface>;
}

export interface GateTrialChecklistRowSurface {
  id: string;
  title: string;
  detail: string;
  status: GateTrialExactStatus;
  iconKey: string;
  source: GateTrialExactValueSource;
  routeTarget?: GateTrialRouteTarget;
}

export interface GateTrialMinimumChecklistSurface {
  title: 'Minimum Checklist';
  stamp: { visible: boolean; label: 'Viable' | 'Locked' | 'Ready' | 'Cleared'; tone: GateTrialExactTone };
  rows: ReadonlyArray<GateTrialChecklistRowSurface>;
}

export interface GateTrialReadinessSealSurface {
  verdict: string;
  scoreLabel: string;
  state: GateTrialReadinessSealState;
  ornamentAssetKey: string;
  glowAssetKey?: string;
}

export interface GateTrialGuardianPlaqueSurface {
  title: string;
  subtitle: string;
  rewardLines: readonly string[];
  rewardIconKey: string;
  gateItemId: string | null;
}

export type GateTrialActiveTheaterEventTone =
  | 'player-hit'
  | 'enemy-hit'
  | 'heal'
  | 'technique'
  | 'shield'
  | 'system'
  | 'warning';

export interface GateTrialActiveTheaterLogLineSurface {
  id: string;
  text: string;
  tone: GateTrialExactTone | GateTrialActiveTheaterEventTone;
  source: GateTrialExactValueSource;
}

export interface GateTrialActiveTheaterFloatingEventSurface {
  id: string;
  label: string;
  tone: GateTrialActiveTheaterEventTone;
  lane: 'player' | 'enemy' | 'center';
  ageMs?: number;
}

export interface GateTrialActiveTheaterChipSurface {
  id: string;
  label: string;
  value: string;
  tone: GateTrialExactTone;
}

export interface GateTrialActiveTheaterSurface {
  visible: boolean;
  state: 'active';
  playerName: string;
  playerHpLabel: string;
  playerHpPct: number;
  enemyName: string;
  enemyHpLabel: string;
  enemyHpPct: number;
  bossName: string;
  bossLevelLabel: string;
  attemptLabel: string;
  elapsedLabel: string;
  autoStateLabel: string;
  chips: readonly GateTrialActiveTheaterChipSurface[];
  logLines: readonly GateTrialActiveTheaterLogLineSurface[];
  techniqueLines: readonly GateTrialActiveTheaterLogLineSurface[];
  floatingEvents: readonly GateTrialActiveTheaterFloatingEventSurface[];
}

export type GateTrialResultTransitionKind =
  | 'victory'
  | 'defeat'
  | 'fail-safe-available'
  | 'bypassed'
  | 'cleared';

export interface GateTrialResultDetailLineSurface {
  id: string;
  label: string;
  value: string;
  tone: GateTrialExactTone;
  source: GateTrialExactValueSource;
}

export interface GateTrialResultTransitionSurface {
  visible: boolean;
  kind: GateTrialResultTransitionKind;
  title: string;
  subtitle: string;
  stampLabel: string;
  tone: GateTrialExactTone;
  detailLines: readonly GateTrialResultDetailLineSurface[];
  rewardLines: readonly string[];
  ctaHint: string;
  emphasizedFixId?: GateTrialFixId | null;
  failureLabel?: string;
  source: GateTrialExactValueSource;
}

export interface GateTrialScenicStageSurface {
  sceneAssetId: string;
  artStatus: 'deferred' | 'approved-bound' | 'missing';
  requiresFinalArtBinding: boolean;
  environmentDescriptor: string;
  readinessSeal: GateTrialReadinessSealSurface;
  guardianPlaque: GateTrialGuardianPlaqueSurface;
  activeTheater?: GateTrialActiveTheaterSurface;
  resultTransition?: GateTrialResultTransitionSurface;
  visualFlags: {
    usesOldCombatPathScene: false;
    usesOutskirtsScene: false;
    usesRuinsScene: false;
    usesCityGateAsFinalScene: false;
    usesInsideDungeonAsFinalScene: false;
    usesCssAsFinalArt: false;
  };
}

export interface GateTrialFactRowSurface {
  id: string;
  label: string;
  value: string;
  iconKey: string;
  tone: GateTrialExactTone;
  source: GateTrialExactValueSource;
}

export interface GateTrialButtonSurface {
  visible: boolean;
  enabled: boolean;
  label: string;
  ariaLabel: string;
  intent: GateTrialButtonIntent;
  tone: GateTrialExactTone;
  disabledReason?: string;
  singleDominantCta?: boolean;
  ornamentVariant?: 'jade-gold' | 'locked-stone' | 'small-parchment';
}

export interface GateTrialFixSurface {
  id: GateTrialFixId;
  label: string;
  iconKey: string;
  routeTarget: GateTrialRouteTarget;
  button: GateTrialButtonSurface;
  source: GateTrialExactValueSource;
}

export interface GateTrialRecommendedPanelSurface {
  title: 'Recommended';
  recommendedPrepTitle: 'Recommended Prep';
  prepRows: ReadonlyArray<GateTrialChecklistRowSurface>;
  failSafeTitle: 'Fail-Safe';
  failSafeRows: ReadonlyArray<GateTrialFactRowSurface>;
  safetyNetButton: GateTrialButtonSurface;
  topFixesTitle: 'Top Fixes';
  topFixes: ReadonlyArray<GateTrialFixSurface>;
}

export interface GateTrialSummaryRowSurface {
  id: 'target' | 'readiness' | 'failures' | 'reward' | 'nextFix';
  label: string;
  value: string;
  tone: GateTrialExactTone;
  source: GateTrialExactValueSource;
}

export interface GateTrialTrialSummarySurface {
  title: 'Trial Summary';
  rows: readonly [
    GateTrialSummaryRowSurface,
    GateTrialSummaryRowSurface,
    GateTrialSummaryRowSurface,
    GateTrialSummaryRowSurface,
    GateTrialSummaryRowSurface,
  ];
}

export interface GateTrialReadinessNodeSurface {
  id: GateTrialReadinessNodeId;
  label: string;
  status: GateTrialExactStatus;
  iconKey: string;
  medallionVariant: 'check' | 'warning' | 'locked' | 'gate-glow';
  ariaLabel: string;
  source: GateTrialExactValueSource;
}

export interface GateTrialReadinessRailSurface {
  title: 'Foundation Gate Readiness' | string;
  nodes: readonly [
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
    GateTrialReadinessNodeSurface,
  ];
}

export interface GateTrialExactDebugSurface {
  regionOrder: readonly string[];
  missingDataFallbacks: string[];
  placeholderAssetKeysInUse: string[];
  liveSourceNotes: string[];
  fixtureLockedValues: string[];
  visualContractNotes: string[];
}

export interface GateTrialExactSurfaceV1 {
  meta: GateTrialExactSurfaceMeta;
  shell: GateTrialExactShellFlags;
  page: GateTrialPageSurface;
  topRibbon: GateTrialTopRibbonSurface;
  tacticalStrip: GateTrialTacticalStripSurface;
  gateHeader: GateTrialHeaderSurface;
  minimumChecklist: GateTrialMinimumChecklistSurface;
  scenicStage: GateTrialScenicStageSurface;
  recommendedPanel: GateTrialRecommendedPanelSurface;
  trialSummary: GateTrialTrialSummarySurface;
  readinessRail: GateTrialReadinessRailSurface;
  primaryAction: GateTrialButtonSurface;
  debug: GateTrialExactDebugSurface;
}
