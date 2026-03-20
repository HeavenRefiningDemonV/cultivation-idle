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
  cities: Array<{ id: string; index: number; name: string; modules: string[]; unlockMajorRealm: string }>;
};

let runtimeContentPromise: Promise<RuntimeContent> | null = null;

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadRuntimeContent = async (): Promise<RuntimeContent> => {
  if (!runtimeContentPromise) {
    runtimeContentPromise = (async () => ({
      cities: await readJson('cities.json'),
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
    raw: { cities: citiesSorted } as never,
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

test('fresh bootstrap suppresses Pinewind arrival while later unlock queues the newest city', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  assert.deepEqual(useCityStore.getState().acknowledgedArrivalCityIds, ['city_pinewind_hamlet']);
  assert.equal(useUIStore.getState().pendingCityArrivalId, null);

  const unlocked = useCityStore.getState().syncRealmEntry('foundation_establishment');

  assert.deepEqual(unlocked, ['city_stonecrag_town']);
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
