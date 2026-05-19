import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { CultivationPath } from '../../../types/index.js';
import { S00_OPENING_CUTSCENE, STORY_CUTSCENES } from '../storyData.js';
import {
  FRESH_ACCOUNT_STORY_ID,
  resolveFreshAccountStoryTrigger,
} from '../storyQueue.js';
import { useStoryStore } from '../storyStore.js';

const S00_ID = 's00_the_night_the_gate_refused_your_name';
const EXPECTED_HOLDS_MS = [9000, 10000, 12000, 10500, 12000] as const;
const EXPECTED_MIN_NEXT_MS = [2500, 3000, 3500, 3000, 3000] as const;
const EXPECTED_FX_PRESETS = [
  'pinewindMist',
  'gateCensusMotes',
  'nameAshfall',
  'returningPageGlow',
  'pathBannerMist',
] as const;
const EXPECTED_TRANSITIONS = [
  'inkVeil',
  'ashCrossfade',
  'ashCrossfade',
  'pageTurnSoft',
  'gateMistDissolve',
] as const;

function resetStoryStore() {
  useStoryStore.getState().hydrateFromSave({
    seenFlags: {},
    storyLog: [],
  });
}

function freshTriggerInput(overrides: Partial<Parameters<typeof resolveFreshAccountStoryTrigger>[0]> = {}) {
  return {
    contentReady: true,
    storyIntroSeen: false,
    selectedPath: null as CultivationPath | null,
    activeCutsceneId: null,
    blockingOverlayActive: false,
    combatActive: false,
    uiStable: true,
    ...overrides,
  };
}

function cssBlock(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return '';
  const bodyStart = source.indexOf('{', start);
  const bodyEnd = source.indexOf('\n}', bodyStart);
  return bodyEnd < 0 ? source.slice(bodyStart) : source.slice(bodyStart, bodyEnd + 2);
}

test('S00 opening cutscene has exactly five slides in narrative order with a Choose Path objective', () => {
  assert.equal(S00_OPENING_CUTSCENE.id, S00_ID);
  assert.equal(S00_OPENING_CUTSCENE.triggerEvent, 'fresh_account_before_life_start');
  assert.equal(S00_OPENING_CUTSCENE.playOnceScope, 'account');
  assert.equal(S00_OPENING_CUTSCENE.storyFlag, 'story_intro_seen');
  assert.equal(S00_OPENING_CUTSCENE.blocksInput, true);
  assert.equal(S00_OPENING_CUTSCENE.canReplayInStoryLog, true);
  assert.deepEqual(S00_OPENING_CUTSCENE.finalObjective, {
    label: 'Choose Path',
    routeTarget: 'pathSelection',
  });

  assert.deepEqual(
    S00_OPENING_CUTSCENE.slides.map((slide) => slide.id),
    [
      's00_01_pinewind_dusk',
      's00_02_gate_census_refusal',
      's00_03_ash_erasure',
      's00_04_keeper_yan_returning_page',
      's00_05_returning_page_paths',
    ],
  );

  assert.deepEqual(
    S00_OPENING_CUTSCENE.slides.map((slide) => slide.captionDefault),
    [
      'Pinewind was too small to matter to immortals. That was why it survived.',
      'Each year, the Gate read the names of those fit to cultivate. When it reached you, the stone went silent.',
      'Names faded. Breath scattered. The world began forgetting people while they were still alive.',
      'Keeper Yan spent his last breath on a page Heaven had not yet written.',
      'A blank name cannot climb. Choose the first stroke of your Dao.',
    ],
  );
});

test('S00 is silent, slower, static-base, and uses themed VFX/transition presets', () => {
  S00_OPENING_CUTSCENE.slides.forEach((slide, index) => {
    const audioCues = (slide as { audioCues?: unknown[] }).audioCues;
    assert.equal(audioCues === undefined || audioCues.length === 0, true, `${slide.id} must not define audio cues`);

    assert.equal(slide.minHoldMs, EXPECTED_MIN_NEXT_MS[index], `${slide.id} Next gate`);
    if (index === S00_OPENING_CUTSCENE.slides.length - 1) {
      assert.equal(slide.autoAdvanceMs, undefined, 'final slide must wait for Choose Path');
    } else {
      assert.equal(slide.autoAdvanceMs, EXPECTED_HOLDS_MS[index], `${slide.id} cinematic hold`);
    }

    assert.equal((slide as { fxPreset?: string }).fxPreset, EXPECTED_FX_PRESETS[index], `${slide.id} FX preset`);
    assert.equal((slide as { transitionPreset?: string }).transitionPreset, EXPECTED_TRANSITIONS[index], `${slide.id} transition preset`);
    assert.equal(slide.camera.mode, 'none', `${slide.id} base image must not pan, zoom, or drift`);
  });
});

test('story source does not create audio primitives or animate full-screen texture/camera drift', () => {
  const storyFiles = [
    'src/features/story/StoryAudioController.ts',
    'src/features/story/StoryCutsceneOverlay.tsx',
    'src/features/story/StorySlideRenderer.tsx',
    'src/features/story/StoryCutscene.scss',
    'src/features/story/storyData.ts',
  ];

  for (const file of storyFiles) {
    const source = readFileSync(file, 'utf8');
    assert.equal(/new\s+Audio\b|AudioContext|webkitAudioContext|Howler|\baudio\.play\s*\(/.test(source), false, `${file} must remain silent`);
  }

  const css = readFileSync('src/features/story/StoryCutscene.scss', 'utf8');
  assert.equal(/storyCameraDrift|storyGrainShimmer|storyVignetteBreath/.test(css), false, 'story CSS must not animate base image, grain, or vignette');
  assert.equal(/animation:/.test(cssBlock(css, '.storySlide__image')), false, 'base image must not be animated during slide hold');
});

test('story VFX are visible and do not restart their particle loop on transition pulses', () => {
  const source = readFileSync('src/features/story/StoryVfxLayer.tsx', 'utf8');
  const css = readFileSync('src/features/story/StoryCutscene.scss', 'utf8');

  assert.match(source, /high:\s*240/, 'high quality VFX budget should be visibly above the old timid ash layer without overloading transitions');
  assert.match(source, /initial \? rng\(\) \* particle\.life/, 'initial particles should start across their visible lifetime');
  assert.match(source, /transitionActiveRef/, 'transition intensity should not reset the particle system');
  assert.equal(/\}, \[movingParticles, preset, quality, transitionActive\]\)/.test(source), false, 'transition state must not recreate the RAF particle loop');
  assert.match(css, /\.storyVfxLayer--nameAshfall::before/, 'ashfall preset needs a visible atmospheric layer in addition to particles');
  assert.match(css, /storyTransitionBreath/, 'transitions should carry a soft VFX veil instead of a hard image swap');
});

test('Path Selection keeps portrait art full-strength and exposes stable card test ids', () => {
  const css = readFileSync('src/components/modals/LifeStartWizardModal.scss', 'utf8');
  const source = readFileSync('src/components/modals/LifeStartWizardModal.tsx', 'utf8');

  assert.equal(/lifePathFullscreen\[data-story-handoff='true'\]\s+\.lifePathPanel__art\s*\{/.test(css), false);
  assert.equal(/opacity\s*:|filter\s*:/.test(cssBlock(css, '.lifePathPanel--receded')), false);
  assert.match(cssBlock(css, '.lifePathPanel__art'), /opacity:\s*1;/);
  assert.match(cssBlock(css, '.lifePathPanel__art'), /filter:\s*none;/);
  assert.match(source, /data-testid=\{`life-path-card-\$\{path\.id\}`\}/);
});

test('story registry is milestone-only and does not define building or path/heart-law slideshow triggers', () => {
  assert.deepEqual(Object.keys(STORY_CUTSCENES), [S00_ID]);

  const forbiddenEvents = new Set([
    'first_visit_world',
    'first_visit_outskirts',
    'first_visit_manual_pavilion',
    'first_visit_apothecary',
    'first_visit_forge',
    'first_visit_bounties',
    'first_visit_expeditions',
    'first_visit_inventory',
    'first_visit_techniques',
    'first_item_purchase',
    'first_pill_craft',
    'first_weapon_refine',
    'first_technique_equip',
    'path_selected',
    'heart_law_selected',
  ]);

  for (const cutscene of Object.values(STORY_CUTSCENES)) {
    assert.equal(forbiddenEvents.has(cutscene.triggerEvent), false, cutscene.triggerEvent);
  }
});

test('fresh account trigger starts S00 only when content is ready, path is unselected, and UI is stable', () => {
  assert.deepEqual(resolveFreshAccountStoryTrigger(freshTriggerInput()), {
    kind: 'start',
    cutsceneId: FRESH_ACCOUNT_STORY_ID,
  });

  assert.deepEqual(resolveFreshAccountStoryTrigger(freshTriggerInput({ uiStable: false })), {
    kind: 'queue',
    cutsceneId: FRESH_ACCOUNT_STORY_ID,
    reason: 'ui_blocked',
  });

  assert.equal(resolveFreshAccountStoryTrigger(freshTriggerInput({ contentReady: false })).kind, 'none');
  assert.equal(resolveFreshAccountStoryTrigger(freshTriggerInput({ storyIntroSeen: true })).kind, 'none');
  assert.equal(resolveFreshAccountStoryTrigger(freshTriggerInput({ selectedPath: 'heaven' })).kind, 'none');
  assert.equal(resolveFreshAccountStoryTrigger(freshTriggerInput({ combatActive: true })).kind, 'queue');
  assert.equal(resolveFreshAccountStoryTrigger(freshTriggerInput({ blockingOverlayActive: true })).kind, 'queue');
});

test('skip and completion mark S00 seen, log it, and clear the active cutscene', () => {
  resetStoryStore();
  const store = useStoryStore.getState();

  store.startCutscene(S00_ID);
  assert.equal(useStoryStore.getState().activeCutsceneId, S00_ID);
  useStoryStore.getState().skipCutscene();

  const skipped = useStoryStore.getState();
  assert.equal(skipped.seenFlags.story_intro_seen, true);
  assert.equal(skipped.activeCutsceneId, null);
  assert.equal(skipped.storyLog.length, 1);
  assert.equal(skipped.storyLog[0]?.id, S00_ID);
  assert.equal(skipped.storyLog[0]?.completed, true);

  resetStoryStore();
  useStoryStore.getState().startCutscene(S00_ID);
  useStoryStore.getState().completeCutscene();

  const completed = useStoryStore.getState();
  assert.equal(completed.seenFlags.story_intro_seen, true);
  assert.equal(completed.activeCutsceneId, null);
  assert.equal(completed.storyLog[0]?.completed, true);
});

test('Story Log replay does not mutate gameplay story flags or first-seen metadata', () => {
  resetStoryStore();
  useStoryStore.getState().markSeen(S00_ID);
  const before = useStoryStore.getState().toSaveState();

  useStoryStore.getState().startCutscene(S00_ID, { replay: true });
  useStoryStore.getState().completeCutscene();

  const after = useStoryStore.getState().toSaveState();
  assert.deepEqual(after.seenFlags, before.seenFlags);
  assert.deepEqual(after.storyLog, before.storyLog);
});
