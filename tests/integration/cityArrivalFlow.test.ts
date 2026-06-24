import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { normalizeCitySaveState } from '../../src/save/cityStateNormalization.js';
import { buildDefaultSaveState } from '../../src/save/defaultSaveState.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import {
  setInventoryStoreGetter,
  setPrestigeStoreGetter,
  useGameStore,
} from '../../src/stores/gameStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

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
      trials: (await readJson<{ trials: RuntimeContent['trials'] }>('trials.json')).trials,
      bounties: await readJson('bounties.json'),
      prestige_store: await readJson('prestige_store.json'),
    }))();
  }
  return runtimeContentPromise;
};

const primeRuntimeStores = async () => {
  const content = await loadRuntimeContent();
  const citiesSorted = [...content.cities].sort((a, b) => a.index - b.index);
  const citiesById = Object.fromEntries(citiesSorted.map((city) => [city.id, city]));

  useContentStore.setState({
    raw: content as never,
    economy: content.economy as never,
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
  useUIStore.getState().hardResetUI();
  useBountyStore.getState().hardResetBounties();
  useGameStore.getState().hardResetGameState();
  // M.II.1 made breakthrough() refuse to run until a life identity is committed
  // (path + Heart Law + breath). The real Foundation breakthrough these arrival tests
  // exercise is exactly the realm-advance path it guards, so commit a complete identity
  // and pin the major-realm risk roll high (>= riskPercent) so the gate clears
  // deterministically rather than on a dice flake.
  useGameStore.setState({ selectedPath: 'heaven' });
  useCultivationStore.setState({ selectedHeartLawId: 'heartlaw_quiet_breath', breathMode: 'balanced' });
  useGameStore.getState().__setBreakthroughRiskRollForTest?.(() => 1);
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
    getSpiritRootTotalMultiplier: () => 1,
    spiritRoot: null,
  }));
};

const createFoundationArrival = () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  installRuntimeDeps({ gate_foundation_pill: 1 });

  useGameStore.setState((state) => ({
    ...state,
    qi: '999999999999',
    realm: { index: 0, substage: REALMS[0].substages, name: REALMS[0].name },
  }));

  return useGameStore.getState().breakthrough();
};

test.beforeEach(async () => {
  resetRuntimeStores();
  await primeRuntimeStores();
});

test('fresh bootstrap suppresses a fake Pinewind arrival while seeding Pinewind as the baseline city', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  const cityState = useCityStore.getState();
  assert.equal(cityState.currentCityId, 'city_pinewind_hamlet');
  assert.equal(cityState.selectedModuleByCity.city_pinewind_hamlet, 'outskirts');
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_pinewind_hamlet'), true);
  assert.equal(useUIStore.getState().pendingCityArrivalId, null);
});

test('real Foundation breakthrough queues Stonecrag arrival, focuses Stonecrag, and leaves it unacknowledged', () => {
  const success = createFoundationArrival();
  const cityState = useCityStore.getState();

  assert.equal(success, true);
  assert.equal(useGameStore.getState().realm.index, 1);
  assert.equal(cityState.currentCityId, 'city_stonecrag_town');
  assert.equal(cityState.selectedModuleByCity.city_stonecrag_town, 'outskirts');
  assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_stonecrag_town');
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_stonecrag_town'), false);
});

test('acknowledging an arrival clears pending UI and persists through default save gathering', () => {
  const success = createFoundationArrival();
  assert.equal(success, true);

  useCityStore.getState().acknowledgeCityArrival('city_stonecrag_town');

  const cityState = useCityStore.getState();
  assert.equal(useUIStore.getState().pendingCityArrivalId, null);
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_stonecrag_town'), true);

  const save = buildDefaultSaveState();
  assert.equal(save.cityState?.acknowledgedArrivalCityIds?.includes('city_stonecrag_town'), true);
});

test('re-initializing content does not replay a city arrival that was already acknowledged', () => {
  const success = createFoundationArrival();
  assert.equal(success, true);
  useCityStore.getState().acknowledgeCityArrival('city_stonecrag_town');

  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);

  assert.equal(useUIStore.getState().pendingCityArrivalId, null);
});

test('old saves with no arrival acknowledgement field backfill unlocked cities and do not replay retro banners', () => {
  const normalized = normalizeCitySaveState({
    content: useContentStore.getState().raw,
    realmIndex: 1,
    cityState: {
      currentCityId: 'city_stonecrag_town',
      unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
      selectedModuleByCity: {
        city_pinewind_hamlet: 'outskirts',
        city_stonecrag_town: 'outskirts',
      },
      cityFlagsById: {
        city_pinewind_hamlet: {
          outskirtsBossDefeated: false,
          gateTrialCleared: false,
          ruinsCleared: false,
        },
        city_stonecrag_town: {
          outskirtsBossDefeated: false,
          gateTrialCleared: false,
          ruinsCleared: false,
        },
      },
      initializedFromContent: true,
    },
  });

  assert.deepEqual(normalized.acknowledgedArrivalCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);

  useCityStore.setState((state) => ({
    ...state,
    ...normalized,
  }));
  useUIStore.getState().clearCityArrival();
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);

  assert.equal(useUIStore.getState().pendingCityArrivalId, null);
});

test('saved unresolved arrivals requeue after bootstrap when only earlier cities were acknowledged', () => {
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    acknowledgedArrivalCityIds: ['city_pinewind_hamlet'],
    selectedModuleByCity: {
      city_pinewind_hamlet: 'outskirts',
      city_stonecrag_town: 'outskirts',
    },
    cityFlagsById: {
      city_pinewind_hamlet: {
        outskirtsBossDefeated: false,
        gateTrialCleared: false,
        ruinsCleared: false,
      },
      city_stonecrag_town: {
        outskirtsBossDefeated: false,
        gateTrialCleared: false,
        ruinsCleared: false,
      },
    },
    initializedFromContent: true,
  }));

  useUIStore.getState().clearCityArrival();
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);

  assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_stonecrag_town');
});

test('multi-city realm sync only surfaces the newest arrival while backfilling older unlocks as acknowledged', () => {
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);

  const unlocked = useCityStore.getState().syncRealmEntry('nascent_soul');
  const cityState = useCityStore.getState();

  assert.deepEqual(unlocked, ['city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford']);
  assert.equal(cityState.currentCityId, 'city_lotusford');
  assert.equal(useUIStore.getState().pendingCityArrivalId, 'city_lotusford');
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_pinewind_hamlet'), true);
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_stonecrag_town'), true);
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_spirit_cavern_city'), true);
  assert.equal(cityState.acknowledgedArrivalCityIds.includes('city_lotusford'), false);
});

test('GameLayout mounts the city arrival banner in the global overlay stack with notification toasts still present', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/components/GameLayout.tsx'), 'utf8');

  assert.match(source, /CityArrivalBanner/);
  assert.match(source, /<CityArrivalBanner\s*\/?>/);
  assert.match(source, /NotificationToasts/);

  const bannerIndex = source.indexOf('<CityArrivalBanner');
  const notificationsIndex = source.indexOf('<NotificationToasts');
  const renderContentIndex = source.indexOf('{renderContent()}');

  assert.notEqual(bannerIndex, -1);
  assert.notEqual(notificationsIndex, -1);
  assert.notEqual(renderContentIndex, -1);
  assert.equal(bannerIndex > renderContentIndex, true);
  assert.equal(bannerIndex < notificationsIndex, true);
});

test('CityArrivalBanner source uses canonical quick-open routing and blocks on overlay UI guards', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/components/system/CityArrivalBanner.tsx'), 'utf8');

  assert.match(source, /buildCityPhaseTeachingSurface/);
  assert.match(source, /openWorldModule/);
  assert.match(source, /getCityArrivalQuickOpenLabel/);
  assert.match(source, /cityArrivalBannerRole/);
  assert.match(source, /cityArrivalBannerPhaseDetail/);
  assert.match(source, /showPerkSelectionModal/);
  assert.match(source, /showWorldBuildingModal/);
  assert.match(source, /combatPresentation/);
  assert.equal(/setActiveTab\s*\(/.test(source), false);
  assert.equal(/setSelectedModule\s*\(/.test(source), false);
});

test('WorldScreen source surfaces the city lesson inside the current-city summary area', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/components/screens/WorldScreen.tsx'), 'utf8');

  // The current-city lesson summary was refactored from the inline buildCityPhaseTeachingSurface
  // block into the buildCityPhaseSurfaceFromSnapshot surface, rendered as condensed
  // "City Phase:" / "Pressure:" lines fed to the WorldOverlayRibbon. Same intent: WorldScreen
  // still surfaces the city's phase lesson and pressure in the current-city summary area.
  assert.equal(source.includes('buildCityPhaseSurfaceFromSnapshot'), true);
  assert.equal(source.includes('cityPhaseSurface'), true);
  assert.equal(source.includes('City Phase:'), true);
  assert.equal(source.includes('phaseLesson'), true);
  assert.equal(source.includes('Pressure:'), true);
  assert.equal(source.includes('newPressure'), true);
  assert.equal(source.includes('phaseLine'), true);
  assert.equal(source.includes('pressureLine'), true);
  assert.equal(source.includes('new_city'), false);
});
