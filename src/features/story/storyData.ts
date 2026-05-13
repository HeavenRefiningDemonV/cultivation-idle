import type { StoryCutsceneId, StoryMilestoneCutscene } from './storyTypes.js';

export const S00_OPENING_CUTSCENE: StoryMilestoneCutscene = {
  id: 's00_the_night_the_gate_refused_your_name',
  triggerEvent: 'fresh_account_before_life_start',
  playOnceScope: 'account',
  priority: 100,
  blocksInput: true,
  canReplayInStoryLog: true,
  storyFlag: 'story_intro_seen',
  finalObjective: {
    label: 'Choose Path',
    routeTarget: 'pathSelection',
  },
  slides: [
    {
      id: 's00_01_pinewind_dusk',
      imageAssetId: 'story/s00/s00_01_pinewind_dusk.webp',
      captionKey: 'story.s00.slide1.caption',
      captionDefault: 'Pinewind was too small to matter to immortals. That was why it survived.',
      minHoldMs: 2500,
      autoAdvanceMs: 9000,
      transitionOutMs: 1120,
      fxPreset: 'pinewindMist',
      transitionPreset: 'inkVeil',
      camera: { mode: 'none' },
      vfxCues: [
        { id: 'mist', atMs: 0, kind: 'mist', intensity: 'low', disabledInReducedMotion: true },
        { id: 'lanterns', atMs: 700, kind: 'lanternFlicker', intensity: 'low', disabledInReducedMotion: true },
      ],
    },
    {
      id: 's00_02_gate_census_refusal',
      imageAssetId: 'story/s00/s00_02_gate_census_refusal.webp',
      captionKey: 'story.s00.slide2.caption',
      captionDefault: 'Each year, the Gate read the names of those fit to cultivate. When it reached you, the stone went silent.',
      minHoldMs: 3000,
      autoAdvanceMs: 10000,
      transitionOutMs: 1120,
      fxPreset: 'gateCensusMotes',
      transitionPreset: 'ashCrossfade',
      camera: { mode: 'none' },
      vfxCues: [
        { id: 'gate-glow', atMs: 1100, kind: 'jadeGlow', intensity: 'low', disabledInReducedMotion: false },
      ],
    },
    {
      id: 's00_03_ash_erasure',
      imageAssetId: 'story/s00/s00_03_ash_erasure.webp',
      captionKey: 'story.s00.slide3.caption',
      captionDefault: 'Names faded. Breath scattered. The world began forgetting people while they were still alive.',
      minHoldMs: 3500,
      autoAdvanceMs: 12000,
      transitionOutMs: 1120,
      fxPreset: 'nameAshfall',
      transitionPreset: 'ashCrossfade',
      camera: { mode: 'none' },
      vfxCues: [
        { id: 'ash', atMs: 0, kind: 'ash', intensity: 'medium', disabledInReducedMotion: true },
      ],
    },
    {
      id: 's00_04_keeper_yan_returning_page',
      imageAssetId: 'story/s00/s00_04_keeper_yan_returning_page.webp',
      captionKey: 'story.s00.slide4.caption',
      captionDefault: 'Keeper Yan spent his last breath on a page Heaven had not yet written.',
      minHoldMs: 3000,
      autoAdvanceMs: 10500,
      transitionOutMs: 1180,
      fxPreset: 'returningPageGlow',
      transitionPreset: 'pageTurnSoft',
      camera: { mode: 'none' },
      vfxCues: [
        { id: 'page-pulse', atMs: 900, kind: 'pagePulse', intensity: 'medium', disabledInReducedMotion: false },
      ],
    },
    {
      id: 's00_05_returning_page_paths',
      imageAssetId: 'story/s00/s00_05_returning_page_paths.webp',
      captionKey: 'story.s00.slide5.caption',
      captionDefault: 'A blank name cannot climb. Choose the first stroke of your Dao.',
      minHoldMs: 3000,
      transitionOutMs: 0,
      fxPreset: 'pathBannerMist',
      transitionPreset: 'gateMistDissolve',
      camera: { mode: 'none' },
      vfxCues: [
        { id: 'currents', atMs: 500, kind: 'bannerCurrent', intensity: 'medium', disabledInReducedMotion: true },
        { id: 'page-glow', atMs: 0, kind: 'pagePulse', intensity: 'low', disabledInReducedMotion: false },
      ],
    },
  ],
};

export const STORY_CUTSCENES: Record<StoryCutsceneId, StoryMilestoneCutscene> = {
  [S00_OPENING_CUTSCENE.id]: S00_OPENING_CUTSCENE,
};
