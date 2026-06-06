import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
  type ValidatedContent,
} from '../../src/content/index.js';
import { buildDefaultSaveState, mergeWithDefaults } from '../../src/save/defaultSaveState.js';
import { performPrestigeReset } from '../../src/services/prestige/PrestigeResetService.js';
import { apply as applyOfflineCatchup } from '../../src/services/time/OfflineCatchup.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTrainingStore } from '../../src/stores/trainingStore.js';
import { createDefaultTrainingSaveState } from '../../src/systems/training/index.js';

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

function primeContentStore(content: ValidatedContent): void {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
  });
}

function resetStores(content: ValidatedContent): void {
  useGameStore.getState().hardResetGameState();
  useActivityStore.getState().hardResetActivity();
  useTrainingStore.getState().hardResetTraining();
  primeContentStore(content);
  useGameStore.setState({
    selectedPath: 'heaven',
    realm: { index: 0, substage: 1, name: 'Qi Condensation' },
    qiPerSecond: '1',
    qi: '0',
  });
}

function approx(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

let content: ValidatedContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
});

test.beforeEach(() => {
  resetStores(content);
});

test('training store starts path_training through ActivityStore and ticks the active regimen', () => {
  const started = useTrainingStore.getState().startTraining('still_star_breathing', 'steady', { now: 1_000 });

  assert.equal(started.ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'path_training');
  assert.equal(useActivityStore.getState().active?.payload?.regimenId, 'still_star_breathing');
  assert.equal(useTrainingStore.getState().activeRegimenId, 'still_star_breathing');
  assert.equal(useTrainingStore.getState().activeIntensityId, 'steady');

  const ticked = useTrainingStore.getState().tickTraining(60_000, { now: 61_000 });

  assert.equal(ticked.ok, true);
  assert.equal(useTrainingStore.getState().statRatingsById.qi_control, 1);
  approx(useTrainingStore.getState().statXpById.qi_control, 12 * 0.98 - 8);
  approx(useTrainingStore.getState().fatigue, 0.14);
});

test('training store follows the foreground gate for non-combat activity and refuses combat activity', () => {
  useActivityStore.getState().startActivity('meditate', undefined, 'test');
  const replaced = useTrainingStore.getState().startTraining('still_star_breathing', 'steady', { now: 2_000 });

  assert.equal(replaced.ok, true);
  assert.equal(replaced.previousActivityType, 'meditate');
  assert.equal(useActivityStore.getState().active?.type, 'path_training');

  useTrainingStore.getState().hardResetTraining();
  useActivityStore.getState().startActivity('trial', { sourceId: 'gate_1' }, 'test-combat');
  const blocked = useTrainingStore.getState().startTraining('still_star_breathing', 'steady', { now: 3_000 });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'combat_activity_active');
  assert.equal(useActivityStore.getState().active?.type, 'trial');
  assert.equal(useTrainingStore.getState().activeRegimenId, null);
});

test('training state is saved, defaulted, migrated by merge, and hydrated without stale active mismatch', () => {
  useTrainingStore.getState().startTraining('still_star_breathing', 'steady', { now: 4_000 });
  useTrainingStore.getState().tickTraining(60_000, { now: 64_000 });

  const saved = buildDefaultSaveState();
  assert.equal(saved.trainingState?.activeRegimenId, 'still_star_breathing');
  assert.equal(saved.trainingState?.activeIntensityId, 'steady');
  assert.equal(saved.trainingState?.statRatingsById.qi_control, 1);

  const merged = mergeWithDefaults({
    version: '2.0.0',
    trainingState: {
      statRatingsById: { qi_control: 2.9 },
      statXpById: { qi_control: 4 },
      regimenMasteryXpById: { still_star_breathing: 7 },
      fatigue: 150,
      activeRegimenId: 'still_star_breathing',
      activeIntensityId: 'steady',
    },
    activityState: { active: null, lastChangedAt: null, history: [] },
  });

  assert.equal(merged.trainingState?.statRatingsById.qi_control, 2);
  assert.equal(merged.trainingState?.fatigue, 100);
  assert.equal(merged.trainingState?.activeRegimenId, null);
  assert.equal(merged.trainingState?.activeIntensityId, null);
});

test('offline catchup applies active path training, surfaces it, and prestige reset clears it', () => {
  useTrainingStore.getState().startTraining('still_star_breathing', 'steady', { now: 10_000 });
  const result = applyOfflineCatchup({
    lastActiveAtMs: 10_000,
    now: 130_000,
    dtMs: 120_000,
    rawMs: 120_000,
    wasCapped: false,
    wasMeditating: false,
  });

  const trainingPart = result.summary?.parts.find((part) => part.kind === 'path_training');
  assert.equal(trainingPart?.label, 'Training practice');
  assert.equal(result.surface?.summaryGroups.some((group) => group.id === 'path_training'), true);
  assert.ok((useTrainingStore.getState().statXpById.qi_control ?? 0) > 0);

  const resetSummary = performPrestigeReset({ resetGameRun: () => useGameStore.getState().resetRun() });
  assert.equal(resetSummary.reset.clearedActivity, true);
  assert.deepEqual(useTrainingStore.getState().toSaveState(), createDefaultTrainingSaveState());
});
