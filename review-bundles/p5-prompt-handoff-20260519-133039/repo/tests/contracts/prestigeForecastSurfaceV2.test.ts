import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildPrestigeForecastSurfaceV2 } from '../../src/features/prestige/prestigeForecastSurface.js';
import type { RawProgressionContentLike } from '../../src/systems/progression/contract/index.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

let runtimeContentPromise: Promise<RawProgressionContentLike> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadRuntimeContent = async (): Promise<RawProgressionContentLike> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      economy: await readJson('economy.json'),
      cities: await readJson('cities.json'),
      items: await readJson('items.json'),
      trials: await readJson('trials.json'),
      prestige_store: await readJson('prestige_store.json'),
      heart_laws: await readJson('heart_laws.json'),
    }))();
  }
  return runtimeContentPromise;
};

const primeContentStore = async () => {
  const content = await loadRuntimeContent();
  useContentStore.setState((state) => ({
    ...state,
    raw: content as never,
    isLoaded: true,
    isLoading: false,
    error: null,
  }));
};

test.beforeEach(async () => {
  usePrestigeStore.getState().hardResetPrestige();
  useGameStore.getState().hardResetGameState();
  useTrialStore.getState().hardResetTrials();
  setGameStoreGetter(() => useGameStore.getState());
  await primeContentStore();
});

test('forecast v2 exposes service-derived reset buckets and locks too-early resets', () => {
  usePrestigeStore.setState({ highestRealmReached: 0, runStartTime: Date.now() });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 0, substage: 1 } }));

  const surface = buildPrestigeForecastSurfaceV2();

  assert.equal(surface.version, 2);
  assert.equal(surface.advisorState, 'too_early');
  assert.equal(surface.ap.potentialGain, 0);
  assert.ok(surface.resetBuckets.some((line) => line.id === 'inventory_currencies'));
  assert.ok(surface.carryBuckets.some((line) => line.id === 'ap'));
  assert.ok(surface.rebuiltBuckets.some((line) => line.id === 'new_spirit_root'));
  assert.equal(surface.warnings.some((line) => line.includes('does not progress combat')), true);
});

test('forecast v2 marks chapter exhausted separately and recommends only runtime-live nodes', () => {
  usePrestigeStore.setState({
    totalAP: 12,
    highestRealmReached: 5,
    runStartTime: Date.now() - 2 * 60 * 60 * 1000,
  });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 5, substage: 2 } }));

  const surface = buildPrestigeForecastSurfaceV2();

  assert.equal(surface.advisorState, 'chapter_exhausted');
  assert.equal(surface.recommendedPurchases.length > 0, true);
  assert.equal(surface.recommendedPurchases.every((line) => line.runtimeHonesty === 'live'), true);
  assert.equal(surface.recommendedPurchases.some((line) => line.upgradeId === 'ap_unlock_meridian_hall'), false);
  assert.equal(surface.recommendedPurchases.some((line) => line.upgradeId === 'ap_fragment_gain_boost'), false);
});

test('forecast v2 plans first prestige purchases from post-ritual AP, not current AP only', () => {
  usePrestigeStore.setState({
    totalAP: 0,
    highestRealmReached: 2,
    runStartTime: Date.now() - 90 * 60 * 1000,
  });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 2, substage: 1 } }));

  const surface = buildPrestigeForecastSurfaceV2();

  assert.equal(surface.ap.currentAvailable, 0);
  assert.equal(surface.ap.potentialGain >= 10, true);
  assert.equal(surface.ap.afterRitual, surface.ap.currentAvailable + surface.ap.potentialGain);
  assert.equal(surface.recommendedPurchases.length > 0, true);
  assert.equal(
    surface.recommendedPurchases.some((line) => line.affordance === 'buy_now' && line.cost <= surface.ap.afterRitual),
    true,
  );
});

test('forecast v2 shows active mastery retention as hybrid memory and falls back when prior times are absent', () => {
  usePrestigeStore.setState({
    totalAP: 140,
    purchasesById: { ap_mastery_retention_25: 1 },
    highestRealmReached: 2,
    prestigeRuns: [],
    runStartTime: Date.now() - 90 * 60 * 1000,
  });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 2, substage: 3 } }));

  const surface = buildPrestigeForecastSurfaceV2();

  assert.equal(surface.hybridBuckets.some((line) => line.id === 'mastery_retention_active'), true);
  assert.equal(surface.retainedEffects.some((line) => line.runtimeConsumer === 'mastery_retention'), true);
  assert.equal(surface.reclaimForecast.some((line) => line.confidence === 'low'), true);
  assert.equal(surface.reclaimForecast.some((line) => line.previous.includes('No prior')), true);
});
