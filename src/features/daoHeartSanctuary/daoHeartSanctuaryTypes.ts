import type { DaoHeartActivityId } from '../../content/types.js';
import type { DaoHeartTurbulenceBand } from '../../systems/daoHeart/daoHeartTurbulenceResolver.js';
import type { RootHeartFitTier } from '../../systems/spiritRoots/rootHeartFitResolver.js';
import type { SpiritRootObservationTabId } from '../spiritRootObservation/index.js';

export type DaoHeartSanctuaryTone = 'good' | 'neutral' | 'warning' | 'danger';

export interface DaoHeartSanctuaryPracticeOutputSurface {
  heartLawXpMultiplierLabel: string;
  clarityMultiplierLabel: string;
  verseMultiplierLabel: string;
  rootMultiplierLabel: string;
  turbulencePerMinuteLabel: string;
  bestUse: string;
}

export interface DaoHeartSanctuaryForecastSurface {
  minutes: 10 | 30 | 60;
  label: string;
  heartLawXpGain: number;
  clarityGain: number;
  verseMasteryGain: number;
  rootResonanceGain: number;
  turbulenceDelta: number;
  summary: string;
}

export interface DaoHeartSanctuaryPracticeSurface {
  id: DaoHeartActivityId;
  label: string;
  description: string;
  offlineAllowed: boolean;
  unlockState: 'available' | 'active' | 'blocked' | 'locked' | 'no_law';
  active: boolean;
  disabled: boolean;
  disabledReason: string | null;
  outputs: DaoHeartSanctuaryPracticeOutputSurface;
  forecasts: DaoHeartSanctuaryForecastSurface[];
}

export interface DaoHeartSanctuaryMetricSurface {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: DaoHeartSanctuaryTone;
}

export interface DaoHeartSanctuaryRecommendationSurface {
  id: string;
  label: string;
  detail: string;
  tone: DaoHeartSanctuaryTone;
  targetPracticeId: DaoHeartActivityId | null;
  actionLabel: string;
}

export interface DaoHeartSanctuaryHeaderSurface {
  pathIdentity: string;
  heartLawLevel: string;
  verseChapter: string;
  parityLabel: string;
  qiSpeedImpact: string;
  breakthroughRiskImpact: string;
  currentBonus: string;
  rootResonance: string;
}

export interface DaoHeartSanctuaryCenterMandalaSurface {
  chapterNodes: Array<{
    id: string;
    label: string;
    state: 'completed' | 'current' | 'locked';
    detail: string;
  }>;
  verseRing: {
    masteryLabel: string;
    detail: string;
  };
  nextSeal: {
    label: string;
    state: 'locked' | 'preparing' | 'ready' | 'blocked';
    detail: string;
  };
  rootResonanceLine: string;
  turbulenceCracks: string;
  overlevelHaze: string | null;
  scrollText: string;
}

export interface DaoHeartSanctuaryCauseRowSurface {
  id: string;
  label: string;
  value: string;
  detail: string;
  severity: DaoHeartSanctuaryTone;
  targetPracticeId: DaoHeartActivityId | null;
  actionLabel: string | null;
  sourceSystem: 'heartLaw' | 'daoHeart' | 'spiritRoot' | 'branch';
}

export interface DaoHeartSanctuaryBranchChoiceSurface {
  id: string;
  label: string;
  state: 'selected' | 'available' | 'locked';
  detail: string;
}

export interface DaoHeartSanctuaryRootFitSurface {
  tier: RootHeartFitTier;
  label: string;
  summary: string;
  cultivationSpeedLabel: string;
  heartLawXpLabel: string;
  rootResonanceGainLabel: string;
  expressionCapLabel: string;
}

export interface DaoHeartSanctuaryRootVariantHintSurface {
  label: string;
  detail: string;
  practiceIds: DaoHeartActivityId[];
  unlockResonance: number;
  unlocked: boolean;
}

export interface DaoHeartSanctuarySurfaceV1 {
  version: 1;
  header: DaoHeartSanctuaryHeaderSurface;
  identity: {
    heartLawId: string | null;
    heartLawName: string;
    tier: string;
    chapter: string;
  };
  progression: {
    level: number;
    xp: number;
    xpToNext: number;
    verseMastery: number;
  };
  metrics: DaoHeartSanctuaryMetricSurface[];
  recommendations: DaoHeartSanctuaryRecommendationSurface[];
  practices: DaoHeartSanctuaryPracticeSurface[];
  centerMandala: DaoHeartSanctuaryCenterMandalaSurface;
  rightRail: {
    causeRows: DaoHeartSanctuaryCauseRowSurface[];
  };
  rootFit: DaoHeartSanctuaryRootFitSurface;
  rootVariantHint: DaoHeartSanctuaryRootVariantHintSurface | null;
  branchChoices: DaoHeartSanctuaryBranchChoiceSurface[];
  activePracticeId: DaoHeartActivityId | null;
  visual: {
    surface: 'dao-heart-sanctuary-mp6';
    motionMode: 'animated' | 'static';
    turbulenceBand: DaoHeartTurbulenceBand;
    clarityState: 'steady' | 'thin' | 'frayed';
    sealState: 'unselected' | 'steady' | 'active' | 'lagging' | 'fractured';
    practiceState: 'no_law' | 'idle' | 'active';
    fxBudget: {
      maxParticles: 48;
      activeParticles: number;
      opacityOverTextMax: 0.18;
    };
    screenshotStates: string[];
  };
  bottomActions: {
    canStop: boolean;
    activeLabel: string;
    hint: string;
    selectedPracticeId: DaoHeartActivityId | null;
    startLabel: string;
    forecastWindows: DaoHeartSanctuaryForecastSurface[];
    offlineEligibilityText: string;
    foregroundConflictText: string | null;
    observeSpiritRoot: {
      label: string;
      activeTab: SpiritRootObservationTabId;
    };
  };
}
