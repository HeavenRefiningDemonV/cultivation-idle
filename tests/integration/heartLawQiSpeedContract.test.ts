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
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { setPrestigeStoreGetter, useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildCultivationExactSurfaceFromStores } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const HEART_LAW_ID = 'heart_quiet_breath_method';

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
  useContentStore.setState((state) => ({
    ...state,
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...state.maps,
      citiesById: Object.fromEntries(content.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(content.items.map((item) => [item.id, item])),
      trialsById: Object.fromEntries(content.trials.map((trial) => [trial.id, trial])),
      heartLawsById: Object.fromEntries(content.heart_laws.map((law) => [law.id, law])),
    },
  }));
}

function resetRuntime(content: ValidatedContent): void {
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  useActivityStore.getState().hardResetActivity();
  usePrestigeStore.getState().hardResetPrestige();
  primeContentStore(content);
  setPrestigeStoreGetter(() => ({
    updateHighestRealm: () => {},
    getQiMultiplier: () => 1,
    getCombatMultiplier: () => 1,
    getSpiritRootTotalMultiplier: () => 1,
    spiritRoot: null,
    purchasesById: {},
  }));
  useGameStore.setState({
    selectedPath: 'heaven',
    focusMode: 'balanced',
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    qi: '120000',
  });
  useCultivationStore.setState({
    selectedHeartLawId: HEART_LAW_ID,
    unlockedHeartLawIds: [HEART_LAW_ID],
    chapter: 1,
    breathMode: 'balanced',
    daoHeartClarity: 60,
    turbulence: 10,
    rootResonanceByPair: {},
    heartLawXpById: { [HEART_LAW_ID]: 0 },
    verseMasteryByLawId: {},
  });
}

function setHeartLawLevel(level: number): number {
  useCultivationStore.setState({
    heartLawLevelById: { [HEART_LAW_ID]: level },
  });
  useGameStore.getState().calculateQiPerSecond();
  return Number(useGameStore.getState().qiPerSecond);
}

function approx(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

let content: ValidatedContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
});

test.beforeEach(() => {
  resetRuntime(content);
});

test('MP3 live Qi/sec applies Heart Law mind alignment after the old Heart Law signature effect', () => {
  const aligned = setHeartLawLevel(9);
  const lagging = setHeartLawLevel(7);
  const leading = setHeartLawLevel(10);
  const overexpressed = setHeartLawLevel(11);

  approx(lagging / aligned, 0.88 / 1.03);
  approx(leading / aligned, 1.06 / 1.03);
  approx(overexpressed / aligned, 0.94 / 1.03);
});

test('MP3 live surfaces expose the same mind alignment text before breakthrough', () => {
  setHeartLawLevel(7);

  const cultivation = buildCultivationExactSurfaceFromStores();
  const status = buildStatusDashboardSurface().statusLedger;

  const cultivationRow = cultivation.breakthroughReadiness.rows.find((row) => row.id === 'mind-alignment');
  const statusRow = status.cultivationBase.rows.find((row) => row.id === 'cultivation-mind-alignment');

  assert.equal(
    cultivationRow?.value,
    'Heart Law trails cultivation by 2 stages: cultivation speed -12%, breakthrough risk +8.',
  );
  assert.equal(statusRow?.value, cultivationRow?.value);
});
