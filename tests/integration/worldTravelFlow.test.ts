import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { openWorldModule } from '../../src/systems/world/openWorldModule.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const PINEWIND_CITY_ID = 'city_pinewind_hamlet';
const STONECRAG_CITY_ID = 'city_stonecrag_town';

const primeStores = async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(citiesSorted.map((city) => [city.id, city])) as never,
    },
  });
  return { citiesSorted };
};

const resetStores = () => {
  useCityStore.getState().hardResetCity();
  useActivityStore.getState().hardResetActivity();
  useCombatStore.getState().hardResetCombat();
  useUIStore.getState().hardResetUI();
};

test.beforeEach(async () => {
  resetStores();
  await primeStores();
});

test('later-save fallback chooses the highest unlocked valid live city', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.setState({
    currentCityId: 'city_invalid_legacy',
    unlockedCityIds: [
      PINEWIND_CITY_ID,
      STONECRAG_CITY_ID,
      'city_spirit_cavern_city',
      'city_lotusford',
    ],
    selectedModuleByCity: {},
    cityFlagsById: {},
    initializedFromContent: false,
  });

  useCityStore.getState().initializeFromContent(citiesSorted);
  assert.equal(useCityStore.getState().currentCityId, 'city_lotusford');
});

test('new city unlock focuses the new city and defaults it to Outskirts', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  const unlocked = useCityStore.getState().syncRealmEntry('foundation_establishment');
  assert.deepEqual(unlocked, [STONECRAG_CITY_ID]);
  assert.equal(useCityStore.getState().unlockedCityIds.includes(STONECRAG_CITY_ID), true);
  assert.equal(useCityStore.getState().currentCityId, STONECRAG_CITY_ID);
  assert.equal(useCityStore.getState().selectedModuleByCity[STONECRAG_CITY_ID], 'outskirts');
});

test('backtracking preserves per-city surfaced module memory', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().unlockCity(STONECRAG_CITY_ID);

  useCityStore.getState().setSelectedModule(PINEWIND_CITY_ID, 'manualPavilion');
  useCityStore.getState().setCurrentCity(STONECRAG_CITY_ID);
  useCityStore.getState().setSelectedModule(STONECRAG_CITY_ID, 'forge');
  useCityStore.getState().setCurrentCity(PINEWIND_CITY_ID);
  useCityStore.getState().setCurrentCity(STONECRAG_CITY_ID);

  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'manualPavilion');
  assert.equal(useCityStore.getState().selectedModuleByCity[STONECRAG_CITY_ID], 'forge');
});

test('valid hidden module memory is preserved', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.setState({
    currentCityId: PINEWIND_CITY_ID,
    unlockedCityIds: [PINEWIND_CITY_ID],
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'ruins' },
    cityFlagsById: {},
    initializedFromContent: false,
  });

  useCityStore.getState().initializeFromContent(citiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'ruins');
});

test('invalid and deferred module selections still normalize to Outskirts', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;

  useCityStore.setState({
    currentCityId: PINEWIND_CITY_ID,
    unlockedCityIds: [PINEWIND_CITY_ID],
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'alchemy' },
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(citiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');

  useCityStore.getState().hardResetCity();
  useCityStore.setState({
    currentCityId: PINEWIND_CITY_ID,
    unlockedCityIds: [PINEWIND_CITY_ID],
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'totally_fake_module' },
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(citiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});

test('openWorldModule cannot open locked cities', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);

  openWorldModule({ cityId: STONECRAG_CITY_ID, moduleKey: 'forge' });

  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.equal(useCityStore.getState().selectedModuleByCity[STONECRAG_CITY_ID], undefined);
  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, null);
});

test('openWorldModule blocks cross-city routing during active combat, combat activity, or combat presentation', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.getState().unlockCity(STONECRAG_CITY_ID);

  useCombatStore.setState({ inCombat: true });
  openWorldModule({ cityId: STONECRAG_CITY_ID, moduleKey: 'forge' });
  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().showWorldBuildingModal, false);

  useCombatStore.getState().hardResetCombat();
  useActivityStore.setState({
    active: { type: 'outskirts', cityId: PINEWIND_CITY_ID, startedAt: Date.now(), payload: { cityId: PINEWIND_CITY_ID } },
  });
  openWorldModule({ cityId: STONECRAG_CITY_ID, moduleKey: 'forge' });
  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().showWorldBuildingModal, false);

  useActivityStore.getState().hardResetActivity();
  useUIStore.setState({
    combatPresentation: {
      mode: 'active',
      context: { type: 'outskirts', cityId: PINEWIND_CITY_ID, moduleKey: 'outskirts' },
    },
  });
  openWorldModule({ cityId: STONECRAG_CITY_ID, moduleKey: 'forge' });
  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
});

test('same-city open still works while combat is active because packet 2.2 blocks travel, not local module opens', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  useCityStore.getState().initializeFromContent(citiesSorted);
  useCombatStore.setState({ inCombat: true });

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'forge' });

  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'forge');
  assert.equal(useUIStore.getState().showWorldBuildingModal, true);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().worldBuildingModalKey, 'forge');
});
