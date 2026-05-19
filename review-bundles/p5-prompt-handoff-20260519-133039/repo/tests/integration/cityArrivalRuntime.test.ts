import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import {
  getQueuedCityArrivalCandidate,
  normalizeAcknowledgedArrivalCityIds,
} from '../../src/systems/world/cityArrivalContract.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

type RuntimeContent = {
  economy: Record<string, unknown>;
  cities: Array<{ id: string; index: number; name: string; modules: string[]; unlockMajorRealm: string }>;
  items: Array<{ id: string }>;
  trials: Array<{ id: string; cityId: string; gateItemId: string; gatesToMajorRealm?: string; eligibilityRule?: unknown }>;
  bounties: Record<string, unknown>;
  prestige_store: { upgrades?: Array<{ id: string }> };
};

let runtimeContentPromise: Promise<RuntimeContent> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadRuntimeContent = async (): Promise<RuntimeContent> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      economy: await readJson('economy.json'),
      cities: await readJson('cities.json'),
      items: await readJson('items.json'),
      trials: await readJson('trials.json'),
      bounties: await readJson('bounties.json'),
      prestige_store: await readJson('prestige_store.json'),
    }))();
  }
  return runtimeContentPromise;
};

test.beforeEach(async () => {
  useCityStore.getState().hardResetCity();
  useBountyStore.getState().hardResetBounties();
  useUIStore.getState().hardResetUI();
  const content = await loadRuntimeContent();
  const citiesSorted = [...content.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState({
    raw: { ...content, cities: citiesSorted } as never,
    economy: content.economy as never,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: citiesSorted as never,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(citiesSorted.map((city) => [city.id, city])) as never,
    },
  });
});

test('missing acknowledgement field backfills unlocked truth while present empty stays empty', async () => {
  const content = await loadRuntimeContent();
  const validCityIds = content.cities.map((city) => city.id);
  const unlockedCityIds = ['city_pinewind_hamlet', 'city_stonecrag_town'];

  assert.deepEqual(
    normalizeAcknowledgedArrivalCityIds({ incoming: undefined, unlockedCityIds, validCityIds, fieldWasPresent: false }),
    unlockedCityIds,
  );
  assert.deepEqual(
    normalizeAcknowledgedArrivalCityIds({ incoming: [], unlockedCityIds, validCityIds, fieldWasPresent: true }),
    [],
  );
});

test('fresh bootstrap suppresses Pinewind arrival while an unresolved later city can still be queued', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  assert.deepEqual(useCityStore.getState().acknowledgedArrivalCityIds, ['city_pinewind_hamlet']);
  assert.equal(useUIStore.getState().pendingCityArrivalId, null);

  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    selectedModuleByCity: {
      ...state.selectedModuleByCity,
      city_stonecrag_town: 'outskirts',
    },
    initializedFromContent: true,
  }));
  const queued = useCityStore.getState().ensurePendingCityArrival('city_stonecrag_town');

  assert.equal(queued, 'city_stonecrag_town');
  assert.deepEqual(useCityStore.getState().acknowledgedArrivalCityIds, ['city_pinewind_hamlet']);
  assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_stonecrag_town');
  assert.equal(useCityStore.getState().selectedModuleByCity.city_stonecrag_town, 'outskirts');
});

test('queued city arrival prefers the preferred unlocked city and otherwise uses the highest unlocked unacknowledged city', () => {
  const citiesById = useContentStore.getState().maps.citiesById;

  assert.equal(
    getQueuedCityArrivalCandidate({
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      acknowledgedArrivalCityIds: ['city_pinewind_hamlet'],
      citiesById,
      preferredCityId: 'city_stonecrag_town',
    }),
    'city_stonecrag_town',
  );

  assert.equal(
    getQueuedCityArrivalCandidate({
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'],
      acknowledgedArrivalCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      citiesById,
      preferredCityId: 'city_stonecrag_town',
    }),
    'city_spirit_cavern_city',
  );
});
