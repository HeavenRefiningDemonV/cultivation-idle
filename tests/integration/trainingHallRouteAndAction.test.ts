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
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTrainingStore } from '../../src/stores/trainingStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { LIVE_WORLD_MODULES, inspectLiveCitySchema } from '../../src/systems/world/liveWorldSchema.js';
import { getWorldModuleCardDefinition } from '../../src/systems/world/moduleCardRegistry.js';
import { createTrainingHallActionController } from '../../src/features/trainingHall/useTrainingHallActionController.js';

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

let content: ValidatedContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
});

test.beforeEach(() => {
  useGameStore.getState().hardResetGameState();
  useActivityStore.getState().hardResetActivity();
  useTrainingStore.getState().hardResetTraining();
  useUIStore.getState().closeWorldBuildingModal();
  primeContentStore(content);
  useGameStore.setState({
    selectedPath: 'heaven',
    realm: { index: 0, substage: 1, name: 'Qi Condensation' },
  });
});

test('trainingHall is a canonical live non-combat world module in every city', () => {
  assert.equal(LIVE_WORLD_MODULES.includes('trainingHall'), true);
  const definition = getWorldModuleCardDefinition('trainingHall');
  assert.equal(definition.label, 'Training Hall');
  assert.equal(definition.group, 'preparation');
  assert.equal(definition.ctaLabel, 'Open Training Hall');

  for (const city of content.cities) {
    assert.equal(city.modules.includes('trainingHall'), true, `${city.id} should expose Training Hall`);
    const report = inspectLiveCitySchema(city);
    assert.equal(report.canonicalOverall, true, `${city.id} should match live city schema`);
    assert.equal(report.missingLiveModules.includes('trainingHall'), false);
  }
});

test('training hall action controller starts and stops path training through stores only', () => {
  const notifications: Array<{ tone: string; message: string }> = [];
  const controller = createTrainingHallActionController({
    addNotification: (tone, message) => notifications.push({ tone, message }),
  });

  const started = controller.startTraining('still_star_breathing', 'steady', { now: 5_000 });
  assert.equal(started.ok, true);
  assert.equal(useActivityStore.getState().active?.type, 'path_training');
  assert.equal(useActivityStore.getState().active?.payload?.regimenId, 'still_star_breathing');
  assert.equal(useTrainingStore.getState().activeRegimenId, 'still_star_breathing');
  assert.equal(useTrainingStore.getState().activeIntensityId, 'steady');
  assert.deepEqual(notifications.at(-1), { tone: 'success', message: 'Training Hall practice started.' });

  controller.stopTraining();
  assert.equal(useActivityStore.getState().active, null);
  assert.equal(useTrainingStore.getState().activeRegimenId, null);
  assert.deepEqual(notifications.at(-1), { tone: 'info', message: 'Training Hall practice stopped.' });
});
