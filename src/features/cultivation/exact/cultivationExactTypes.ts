import type {
  RunCompassActionLine,
  RunCompassCompactSurface,
  RunCompassTabTarget,
  RunCompassSurface,
} from '../../../systems/ui/runCompass/index.js';
import type { SpiritRootElement } from '../../../types/index.js';

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
  | { kind: 'world_module'; cityId: string; moduleKey: string };

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
  tone: 'path' | 'fire' | 'water' | 'earth' | 'metal' | 'wood' | 'lotus' | 'jade' | 'neutral';
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
  | 'openGateTrial'
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
}

export interface BuildCultivationExactSurfaceOptions {
  mode?: CultivationExactSurfaceMode;
  selectedDrawer?: CultivationExactDrawerId;
  reducedMotion?: boolean;
  fxQuality?: CultivationExactFxQuality;
  runCompassFull?: RunCompassSurface | null;
  nowMs?: number;
}
