import type { CultivationPath } from '../../types/index.js';

export type StoryCutsceneId = 's00_the_night_the_gate_refused_your_name';

export type StoryRouteTarget =
  | 'pathSelection'
  | 'heartLaw'
  | 'cultivation'
  | 'world'
  | 'gateTrial'
  | 'prestige';

export type StoryMotionMode = 'full' | 'reduced' | 'off';

export type StoryFxPreset =
  | 'none'
  | 'pinewindMist'
  | 'gateCensusMotes'
  | 'nameAshfall'
  | 'returningPageGlow'
  | 'pathBannerMist'
  | 'daoSelectionReveal';

export type StoryFxQuality = 'high' | 'medium' | 'low' | 'reduced' | 'off';

export type StoryTransitionPreset =
  | 'inkVeil'
  | 'ashCrossfade'
  | 'pageTurnSoft'
  | 'gateMistDissolve';

export type StoryVfxCue = {
  id: string;
  atMs: number;
  kind:
    | 'mist'
    | 'ash'
    | 'lanternFlicker'
    | 'captionFade'
    | 'jadeGlow'
    | 'pagePulse'
    | 'bannerCurrent'
    | 'microShake'
    | 'inkWipe';
  intensity: 'low' | 'medium' | 'high';
  disabledInReducedMotion?: boolean;
};

export type StorySlide = {
  id: string;
  imageAssetId: string;
  captionKey: string;
  captionDefault: string;
  minHoldMs: number;
  autoAdvanceMs?: number;
  transitionOutMs: number;
  fxPreset: StoryFxPreset;
  transitionPreset: StoryTransitionPreset;
  camera: {
    mode: 'none';
    scaleFrom?: number;
    scaleTo?: number;
    xFrom?: number;
    xTo?: number;
    yFrom?: number;
    yTo?: number;
  };
  vfxCues: StoryVfxCue[];
};

export type StoryMilestoneCutscene = {
  id: StoryCutsceneId;
  triggerEvent: string;
  playOnceScope: 'account' | 'life' | 'realm' | 'special';
  priority: number;
  blocksInput: boolean;
  canReplayInStoryLog: boolean;
  storyFlag: string;
  slides: StorySlide[];
  finalObjective: {
    label: string;
    routeTarget: StoryRouteTarget;
  };
};

export type StoryLogEntry = {
  id: StoryCutsceneId;
  firstSeenAt: number;
  completed: boolean;
};

export type StorySaveState = {
  seenFlags: Record<string, boolean>;
  storyLog: StoryLogEntry[];
};

export type FreshAccountStoryInput = {
  contentReady: boolean;
  storyIntroSeen: boolean;
  selectedPath: CultivationPath | null;
  activeCutsceneId: StoryCutsceneId | null;
  blockingOverlayActive: boolean;
  combatActive: boolean;
  uiStable: boolean;
};

export type StoryTriggerDecision =
  | { kind: 'none'; reason?: string }
  | { kind: 'start'; cutsceneId: StoryCutsceneId }
  | { kind: 'queue'; cutsceneId: StoryCutsceneId; reason: 'ui_blocked' };
