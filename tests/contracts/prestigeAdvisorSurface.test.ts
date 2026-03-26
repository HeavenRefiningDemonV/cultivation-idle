import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getPrestigeAdvisorSurface } from '../../src/features/prestige/prestigeAdvisorSurface.js';
import type { RawProgressionContentLike } from '../../src/systems/progression/contract/index.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { usePrestigeStore, setGameStoreGetter } from '../../src/stores/prestigeStore.js';

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
  setGameStoreGetter(() => useGameStore.getState());
  await primeContentStore();
});

test('advisor AP forecast is sourced from live prestige store truth only', () => {
  usePrestigeStore.setState({
    totalAP: 12,
    lifetimeAP: 25,
    highestRealmReached: 2,
    runStartTime: Date.now() - 2 * 60 * 60 * 1000,
  });
  useGameStore.setState((state) => ({
    ...state,
    realm: { ...state.realm, index: 2, substage: 3 },
  }));

  const surface = getPrestigeAdvisorSurface();
  const store = usePrestigeStore.getState();

  assert.equal(surface.apForecast.potentialGain, store.calculateAPGain());
  assert.deepEqual(surface.apForecast.breakdown, store.getApBreakdown());
  assert.equal(surface.apForecast.breakdown.rows.some((row) => row.key === 'time'), false);
  assert.equal(surface.apForecast.breakdown.rows.some((row) => row.label === 'Time cultivated'), false);
});

test('advisor state label uses canonical Too Early / Viable / Recommended values', () => {
  usePrestigeStore.setState({ highestRealmReached: 0, runStartTime: Date.now() });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 0, substage: 1 } }));
  assert.equal(getPrestigeAdvisorSurface().stateLabel, 'Too Early');

  usePrestigeStore.setState({ highestRealmReached: 1, runStartTime: Date.now() });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 1, substage: 1 } }));
  assert.equal(getPrestigeAdvisorSurface().stateLabel, 'Too Early');

  usePrestigeStore.setState({ highestRealmReached: 2, runStartTime: Date.now() - 2 * 60 * 60 * 1000 });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 2, substage: 5 } }));
  assert.equal(getPrestigeAdvisorSurface().stateLabel, 'Viable');

  usePrestigeStore.setState({ highestRealmReached: 5, runStartTime: Date.now() - 2 * 60 * 60 * 1000 });
  useGameStore.setState((state) => ({ ...state, realm: { ...state.realm, index: 5, substage: 3 } }));
  assert.equal(getPrestigeAdvisorSurface().stateLabel, 'Recommended');
});

test('advisor reset preview buckets keep permanent, reset, and rebuilt semantics honest', () => {
  const surface = getPrestigeAdvisorSurface();

  assert.ok(surface.resetPreview.resetsThisLife.includes('Inventory and currencies'));
  assert.ok(surface.resetPreview.carriesForward.includes('Ascension Points (AP)'));
  assert.ok(surface.resetPreview.rebuiltNextLife.includes('Spirit root (new roll)'));
});
