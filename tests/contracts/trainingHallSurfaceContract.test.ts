import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
} from '../../src/content/index.js';
import {
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  type TrainingRuntimeContent,
} from '../../src/systems/training/index.js';
import { buildTrainingHallSurface } from '../../src/features/trainingHall/buildTrainingHallSurface.js';
import type { ActiveActivity } from '../../src/stores/activityStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

let trainingContent: TrainingRuntimeContent;

test.before(async () => {
  trainingContent = createTrainingRuntimeContent(validateLoadedContent(await loadRuntimeRawContent()));
});

test('training hall surface renders fresh Heaven as one available regimen plus future silhouettes', () => {
  const surface = buildTrainingHallSurface({
    content: trainingContent,
    state: createDefaultTrainingSaveState(),
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    activeActivity: null,
    prefersReducedMotion: false,
  });

  assert.equal(surface.meta.rootTestId, 'training-hall-page');
  assert.equal(surface.meta.selectedPath, 'heaven');
  assert.equal(surface.pathRoom.title, 'Heaven Star Observatory');
  assert.equal(surface.regimenRail.regimens.length, 1);
  assert.deepEqual([...new Set(surface.regimenRail.regimens.map((row) => row.path))], ['heaven']);
  assert.equal(surface.regimenRail.regimens[0]?.id, 'still_star_breathing');
  assert.deepEqual(surface.statRows.map((row) => row.statId), ['qi_control']);
  assert.deepEqual(surface.futureStats.map((row) => row.statId), [
    'dao_resonance',
    'divine_sense',
    'law_weaving',
    'tribulation_insight',
    'star_rhythm',
  ]);
  assert.equal(surface.lockedRegimenRail.regimens.length, 5);
  assert.equal(surface.pathRoom.nextUnlock?.statId, 'dao_resonance');
  assert.equal(surface.practiceStage.status, 'idle');
  assert.equal(surface.actionBar.startButton.enabled, true);
});

test('training hall surface exposes no-path, blocked-combat, fatigue, cap, offline, and reduced-motion states', () => {
  const noPath = buildTrainingHallSurface({
    content: trainingContent,
    state: createDefaultTrainingSaveState(),
    selectedPath: null,
    realmIndex: 0,
    substageIndex: 0,
    activeActivity: null,
    prefersReducedMotion: false,
  });

  assert.equal(noPath.practiceStage.status, 'no_path');
  assert.equal(noPath.actionBar.startButton.enabled, false);
  assert.match(noPath.actionBar.startButton.disabledReason ?? '', /Choose a path/i);

  const blockedActivity: ActiveActivity = {
    type: 'trial',
    startedAt: 10,
    sourceId: 'trial_foundation',
    cityId: 'city_pinewind_hamlet',
    payload: { sourceId: 'trial_foundation', cityId: 'city_pinewind_hamlet' },
  };
  const blocked = buildTrainingHallSurface({
    content: trainingContent,
    state: createDefaultTrainingSaveState(),
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    activeActivity: blockedActivity,
    prefersReducedMotion: false,
  });

  assert.equal(blocked.practiceStage.status, 'blocked_by_combat');
  assert.equal(blocked.actionBar.startButton.enabled, false);
  assert.match(blocked.actionBar.startButton.disabledReason ?? '', /combat/i);

  const state = createDefaultTrainingSaveState();
  state.fatigue = 90;
  state.statRatingsById.qi_control = 16;
  state.activeRegimenId = 'still_star_breathing';
  state.activeIntensityId = 'steady';
  state.lastOfflineSummary = {
    appliedMs: 120_000,
    statXpGainedById: { qi_control: 12 },
    masteryXpGainedByRegimenId: { still_star_breathing: 4 },
    fatigueGained: 0.28,
    completedAt: 1_700_000,
  };
  const active: ActiveActivity = {
    type: 'path_training',
    startedAt: 100,
    sourceId: 'still_star_breathing',
    payload: { sourceId: 'still_star_breathing', regimenId: 'still_star_breathing', intensityId: 'steady' },
  };
  const activeSurface = buildTrainingHallSurface({
    content: trainingContent,
    state,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    activeActivity: active,
    selectedRegimenId: 'still_star_breathing',
    selectedIntensityId: 'steady',
    prefersReducedMotion: true,
  });

  assert.equal(activeSurface.practiceStage.status, 'active');
  assert.equal(activeSurface.practiceStage.selectedRegimen?.primaryStat.capState, 'capped');
  assert.deepEqual(
    activeSurface.alerts.map((alert) => alert.id),
    ['high-fatigue', 'cap-reached', 'offline-return', 'reduced-motion'],
  );
});
