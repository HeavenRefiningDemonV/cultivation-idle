import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import {
  setInventoryStoreGetter,
  setPrestigeStoreGetter,
  useGameStore,
} from '../../src/stores/gameStore.js';

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

const primeContentStore = async () => {
  const content = await loadRuntimeContent();
  const citiesSorted = [...content.cities].sort((a, b) => a.index - b.index);
  const citiesById = Object.fromEntries(citiesSorted.map((city) => [city.id, city]));

  useContentStore.setState({
    raw: content as never,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: citiesSorted as never,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: citiesById as never,
    },
  });

  return { content, citiesSorted };
};

const resetRuntimeStores = () => {
  useCityStore.getState().hardResetCity();
  useBountyStore.getState().hardResetBounties();
  useGameStore.getState().hardResetGameState();
};

const installRuntimeDeps = (items: Record<string, number>) => {
  const inventory = {
    getItemCount: (itemId: string) => items[itemId] ?? 0,
    removeItem: (itemId: string, quantity: number) => {
      if ((items[itemId] ?? 0) < quantity) return false;
      items[itemId] -= quantity;
      return true;
    },
    resetInventory: () => {
      Object.keys(items).forEach((key) => {
        delete items[key];
      });
    },
  };

  setInventoryStoreGetter(() => inventory);
  setPrestigeStoreGetter(() => ({
    updateHighestRealm: () => {},
    getQiMultiplier: () => 1,
    getCombatMultiplier: () => 1,
    getCultivationMultiplier: () => 1,
    getSpiritRootTotalMultiplier: () => 1,
    spiritRoot: null,
  }));
};

test.beforeEach(async () => {
  resetRuntimeStores();
  await primeContentStore();
});

test('fresh bootstrap seeds only Pinewind Hamlet and defaults it to Outskirts', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  const cityState = useCityStore.getState();
  assert.deepEqual(cityState.unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(cityState.currentCityId, 'city_pinewind_hamlet');
  assert.equal(cityState.selectedModuleByCity.city_pinewind_hamlet, 'outskirts');
});

test('content bootstrap does not auto-unlock later cities just because content loaded', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  assert.equal(useCityStore.getState().unlockedCityIds.includes('city_stonecrag_town'), false);
  assert.deepEqual(useBountyStore.getState().activeByCityId, {});
});

test('runtime sync backfills city progression from realm entry and focuses the newest unlocked city', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  const unlocked = useCityStore.getState().syncRealmEntry('nascent_soul');
  const cityState = useCityStore.getState();

  assert.deepEqual(unlocked, [
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
  ]);
  assert.deepEqual(cityState.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
  ]);
  assert.equal(cityState.currentCityId, 'city_lotusford');
  assert.equal(cityState.selectedModuleByCity.city_lotusford, 'outskirts');
  assert.equal((useBountyStore.getState().activeByCityId.city_lotusford ?? []).length, 3);
});

test('successful breakthrough into Foundation unlocks Stonecrag, focuses it, and seeds first-visit bounties', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  installRuntimeDeps({ gate_foundation_pill: 1 });

  useGameStore.setState((state) => ({
    ...state,
    qi: '999999999999',
    realm: { index: 0, substage: REALMS[0].substages, name: REALMS[0].name },
  }));

  const success = useGameStore.getState().breakthrough();
  const cityState = useCityStore.getState();

  assert.equal(success, true);
  assert.equal(useGameStore.getState().realm.index, 1);
  assert.equal(cityState.unlockedCityIds.includes('city_stonecrag_town'), true);
  assert.equal(cityState.currentCityId, 'city_stonecrag_town');
  assert.equal(cityState.selectedModuleByCity.city_stonecrag_town, 'outskirts');
  assert.equal((useBountyStore.getState().activeByCityId.city_stonecrag_town ?? []).length, 3);
});

test('trial completion alone and substage advancement alone do not unlock the next city', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  installRuntimeDeps({});

  useCityStore.getState().markGateTrialCleared('city_pinewind_hamlet');
  assert.equal(useCityStore.getState().unlockedCityIds.includes('city_stonecrag_town'), false);

  useGameStore.setState((state) => ({
    ...state,
    qi: '999999999999',
    realm: { index: 0, substage: 1, name: REALMS[0].name },
  }));

  const success = useGameStore.getState().breakthrough();
  assert.equal(success, true);
  assert.equal(useGameStore.getState().realm.index, 0);
  assert.equal(useGameStore.getState().realm.substage, 2);
  assert.equal(useCityStore.getState().unlockedCityIds.includes('city_stonecrag_town'), false);
});

test('entering Spirit Severing does not create a fake city six or change the current city away from Ironpeak', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().syncRealmEntry('soul_formation');
  installRuntimeDeps({ gate_severing_seal: 1 });

  useGameStore.setState((state) => ({
    ...state,
    qi: '999999999999',
    realm: { index: 4, substage: REALMS[4].substages, name: REALMS[4].name },
  }));

  const success = useGameStore.getState().breakthrough();
  const cityState = useCityStore.getState();

  assert.equal(success, true);
  assert.equal(useGameStore.getState().realm.index, 5);
  assert.deepEqual(cityState.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ]);
  assert.equal(cityState.currentCityId, 'city_ironpeak_bastion');
});
