import type {
  RunCompassActionLine,
  RunCompassCompactSurface,
  RunCompassTabTarget,
  RunCompassSurface,
} from '../../../systems/ui/runCompass/index.js';
import type { CultivationMindAlignmentSnapshot } from '../../../systems/cultivation/cultivationMindAlignmentResolver.js';
import type {
  CultivationPathIdentitySurface,
  MeridianDripSurface,
} from '../../../systems/cultivation/cultivationPathIdentityResolver.js';
import type { ForegroundGrowthKind } from '../../../systems/cultivation/foregroundGrowthResolver.js';
import type { SpiritRootObservationTabId } from '../../spiritRootObservation/index.js';
import type { CultivationPath, SpiritRootElement } from '../../../types/index.js';

/** M.II.1 sub-objective D/§F — the idle-accrual readout (legible with motion off). */
export interface IdleAccrualSurface {
  ratePerSecondLabel: string;
  offlineCapHours: number;
  offlineEfficiencyLabel: string;
  /** "what your absence earned" — null when there was no offline return. */
  accruedWhileAwayLabel: string | null;
  foregroundMode: ForegroundGrowthKind;
  /** true → idle accrual paused (the COMBAT foreground state). */
  isPreemptedByCombat: boolean;
}

/** M.II.1 — pity progress toward the Safety Net guaranteed clear (trialLifecycle.failSafe). */
export interface CultivationPitySurface {
  eligibleFailures: number;
  threshold: number;
  guaranteedClearReady: boolean;
}

export type CultivationGateTrialState = 'locked' | 'available' | 'cleared' | 'bypassed';

export type CultivationExactSurfaceMode = 'fixture' | 'live';
export type CultivationExactActivityState =
  | 'idle'
  | 'cultivating'
  | 'near_edge'
  | 'gate_blocked'
  | 'breakthrough_ready'
  | 'unstable'
  | 'content_cap';

export type CultivationExactDrawerId =
  | 'none'
  | 'milestone'
  | 'doctrine'
  | 'gate'
  | 'buffs'
  | 'lifeCycle';

export type CultivationExactFxQuality = 'off' | 'low' | 'medium' | 'high';

export type CultivationRouteTarget =
  | { kind: 'tab'; tab: RunCompassTabTarget }
  | { kind: 'world_module'; cityId: string; moduleKey: string }
  | { kind: 'status_observation'; tab: SpiritRootObservationTabId };

export interface CultivationRibbonCellSurface {
  id: 'realm' | 'qi' | 'rate' | 'stability' | 'foreground';
  label: string;
  primary: string;
  secondary?: string;
  iconKey: string;
  tone: 'neutral' | 'jade' | 'cinnabar' | 'gold' | 'warning';
  tooltip?: string;
}

export interface CultivationSealCardSurface {
  id: 'next' | 'need' | 'action';
  eyebrow: string;
  title: string;
  value?: string;
  iconKey: string;
  tone: 'cinnabar' | 'jade' | 'bronze' | 'gold' | 'muted';
  opensDrawer?: 'milestone' | 'gate';
}

export interface CultivationDoctrineSealSurface {
  id: 'path' | 'spiritRoot' | 'heartLaw' | 'verse' | 'breathFocus';
  label: string;
  value: string;
  subvalue?: string;
  iconKey: string;
  tone:
    | 'path'
    | 'wood'
    | 'fire'
    | 'earth'
    | 'metal'
    | 'water'
    | 'wind'
    | 'lightning'
    | 'ice'
    | 'light'
    | 'shadow'
    | 'soul'
    | 'void'
    | 'time'
    | 'astral'
    | 'lotus'
    | 'jade'
    | 'neutral';
  opensDrawer: 'doctrine';
}

export interface CultivationSealButtonSurface {
  id: 'dao';
  label: string;
  value: string;
  iconKey: string;
  tone: 'cinnabar' | 'jade' | 'bronze' | 'gold' | 'muted';
  actionKey: 'openDaoHeart' | 'none';
}

export interface CultivationRingLayerSurface {
  id: 'outer' | 'inner' | 'glyphs' | 'motes' | 'mist';
  tone: 'gold' | 'jade' | 'cinnabar' | 'muted';
  intensity: 'quiet' | 'active' | 'ready';
}

export type CultivationButtonActionKey =
  | 'startCultivation'
  | 'stopCultivation'
  | 'openDaoHeart'
  | 'openTrainingHall'
  | 'openGateTrial'
  | 'openApothecary'
  | 'openForge'
  | 'openSpiritRootObservation'
  | 'rest'
  | 'breakThrough'
  | 'openPrestige'
  | 'none';

export interface CultivationButtonSurface {
  label: string;
  disabled: boolean;
  reason?: string;
  tone: 'cultivate' | 'stop' | 'gate' | 'ready' | 'cap' | 'quiet';
  actionKey: CultivationButtonActionKey;
  route?: CultivationRouteTarget;
  runCompassAction?: RunCompassActionLine | null;
}

export interface CultivationDrawerRowSurface {
  id: string;
  label: string;
  value: string;
  tone?: 'neutral' | 'jade' | 'cinnabar' | 'gold' | 'warning' | 'muted';
}

export interface CultivationVerseDetailSurface {
  chapter: number;
  comprehension: number;
  requirement: number;
  title: string;
  isComplete: boolean;
  placeholderLabel?: string;
  placeholderValue?: string;
}

export interface CultivationBreakthroughReadinessSurfaceV1 {
  title: 'Breakthrough Readiness';
  state: 'ready' | 'blocked' | 'cultivating' | 'gate_required' | 'content_cap' | 'prestige_recommended';
  headline: string;
  detail: string;
  rows: CultivationDrawerRowSurface[];
  primaryAction?: CultivationButtonSurface | null;
  risk?: {
    percent: number;
    band: string;
    failurePreview: string;
    confirmationRequired: boolean;
  } | null;
  // M.II.1 sub-objective A/threads — the risk model now reads the live stat layer, never
  // regresses earned realm state on a failed rite, and accrues pity toward a guaranteed clear.
  /** literal proof the four risk terms read the live qi_purity/body_integrity/dao_stability layer. */
  riskInputsLiveStatFed: true;
  isAtSemesterCap: boolean;
  gateTrialState: CultivationGateTrialState;
  neverRegress: { guaranteed: true; explanation: string };
  pity: CultivationPitySurface;
  topFixActions?: CultivationButtonSurface[];
}

export interface CultivationDrawerSurface {
  id: Exclude<CultivationExactDrawerId, 'none'>;
  side: 'left' | 'right';
  title: string;
  subtitle?: string;
  rows: CultivationDrawerRowSurface[];
  action?: CultivationButtonSurface;
  runCompass?: RunCompassSurface | null;
  verse?: CultivationVerseDetailSurface;
}

export interface CultivationExactSurfaceV1 {
  meta: {
    surfaceId: 'cultivation-exact';
    version: 'lotus-meditation-terrace.v1';
    rootTestId: 'cultivation-exact-page';
    mode: CultivationExactSurfaceMode;
    source: 'fixture' | 'stores';
    activityState: CultivationExactActivityState;
    reducedMotion: boolean;
    fxQuality: CultivationExactFxQuality;
    selectedDrawer: CultivationExactDrawerId;
  };

  shell: {
    preserveHeroArt: true;
    showLegacySidePanels: false;
    singleDominantQiBar: true;
    singlePrimaryAction: true;
    useMockupAsSingleBitmap: false;
  };

  topRibbon: CultivationRibbonCellSurface[];
  leftMilestoneSeals: CultivationSealCardSurface[];
  rightDoctrineSeals: CultivationDoctrineSealSurface[];
  daoSeal: CultivationSealButtonSurface;

  centerAltar: {
    heroAssetId: 'cbg_full';
    dantian: {
      state: 'idle' | 'active' | 'near_ready' | 'ready' | 'unstable';
      elementAccent: SpiritRootElement | 'neutral';
      label: string;
      heartLawTags: string[];
      preserveDantianOrbComponent: true;
    };
    lotus: {
      state: 'idle' | 'active' | 'ready';
      label: string;
      assetId: 'qi_lotus_closed' | 'qi_lotus_open' | 'qi_lotus_full';
    };
    ringLayers: CultivationRingLayerSurface[];
    visualFlags: {
      usesExistingCbgFull: true;
      replacesHeroArt: false;
      coversCultivatorFace: false;
      coversDantian: false;
    };
  };

  breakthroughSeal: {
    label: string;
    value: string;
    state: 'cultivating' | 'approaching_edge' | 'gate_blocked' | 'ready' | 'content_cap';
    routeLabel?: string;
  };

  qiRail: {
    currentLabel: string;
    requiredLabel: string;
    combinedLabel: string;
    percent: number;
    displayPercent?: number;
    rateLabel: string;
    state: 'normal' | 'near_edge' | 'ready';
  };

  commandDeck: {
    primary: CultivationButtonSurface;
    secondary?: CultivationButtonSurface;
    supportLine: string;
  };
  breakthroughReadiness: CultivationBreakthroughReadinessSurfaceV1;
  // M.II.1 additive blocks — the three lives in data (C), the drip column (B), the idle readout (D).
  pathIdentity: CultivationPathIdentitySurface;
  meridianDrip: MeridianDripSurface;
  idleAccrual: IdleAccrualSurface;
  runCompassCompact?: RunCompassCompactSurface | null;

  lifeCycleWhisper: {
    visible: boolean;
    active: boolean;
    label: string;
    sublabel?: string;
    route?: CultivationRouteTarget;
    runCompassAction?: RunCompassActionLine | null;
  };

  drawers: {
    milestone: CultivationDrawerSurface;
    doctrine: CultivationDrawerSurface;
    gate: CultivationDrawerSurface;
    buffs: CultivationDrawerSurface;
    lifeCycle: CultivationDrawerSurface;
  };

  debug?: {
    notes: string[];
    sourceSummary: string[];
    visualParityWarnings: string[];
  };
}

export interface CultivationExactBuildSnapshot {
  realm: { index: number; substage: number; name: string };
  realmName: string;
  realmSubstages: number;
  nextRealmName: string | null;
  qi: string;
  breakthroughRequirement: string;
  qiPerSecond: string;
  breathQiRateMultiplier: number;
  breathModeLabel: string;
  focusModeLabel: string;
  activeActivityType: string | null;
  activeActivityLabel: string;
  stability: number;
  stabilityCap: number;
  selectedPathLabel: string;
  selectedPathSummary: string;
  spiritRootLabel: string;
  spiritRootDetail: string;
  spiritRootElement: SpiritRootElement | 'neutral';
  heartLawName: string;
  heartLawDetail: string;
  heartLawTags: string[];
  chapter: number;
  comprehension: number;
  comprehensionRequirement: number;
  resonanceLine: string;
  resonanceDetail: string;
  requiredGateItemId: string | null;
  requiredGateItemName: string | null;
  requiredGateItemCount: number;
  atContentCap: boolean;
  canPrestige: boolean;
  activeBuffSummary: string;
    runCompassActions: RunCompassActionLine[];
    runCompassFull?: RunCompassSurface | null;
    runCompassCompact?: RunCompassCompactSurface | null;
    breakthroughRisk?: import('../../../systems/breakthrough/breakthroughStabilityResolver.js').BreakthroughStabilitySnapshot | null;
    mindAlignment?: CultivationMindAlignmentSnapshot | null;
    // M.II.1 additive snapshot inputs (soul-side path + live idle/pity state).
    selectedPathId?: CultivationPath | null;
    foregroundMode?: ForegroundGrowthKind;
    offlineCapHours?: number;
    offlineEfficiencyLabel?: string;
    accruedWhileAwayLabel?: string | null;
    gateTrialState?: CultivationGateTrialState;
    pity?: CultivationPitySurface;
  }

export interface BuildCultivationExactSurfaceOptions {
  mode?: CultivationExactSurfaceMode;
  selectedDrawer?: CultivationExactDrawerId;
  reducedMotion?: boolean;
  fxQuality?: CultivationExactFxQuality;
  runCompassFull?: RunCompassSurface | null;
  nowMs?: number;
}
