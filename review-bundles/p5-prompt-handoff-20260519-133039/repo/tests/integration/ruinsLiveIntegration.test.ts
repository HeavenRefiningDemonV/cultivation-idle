import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { bootstrapLiveWorldStores } from '../../src/systems/world/bootstrapLiveWorld.js';
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
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])) as never,
    },
  });

  return { citiesSorted, ruins: validated.ruins };
};

const resetStores = () => {
  useCityStore.getState().hardResetCity();
  useRuinsStore.getState().hardResetRuins();
  useActivityStore.getState().hardResetActivity();
  useCombatStore.getState().hardResetCombat();
  useUIStore.getState().hardResetUI();
};

test.beforeEach(async () => {
  resetStores();
  await primeStores();
});

test('bootstrapLiveWorldStores initializes city state, backfills ruins progress additively, and then syncs realm entry focus', () => {
  const citiesSorted = useContentStore.getState().citiesSorted;
  const ruins = useContentStore.getState().raw?.ruins ?? [];
  const firstRuinId = ruins[0]?.id;
  const laterRuinId = ruins.at(-1)?.id;

  assert.ok(firstRuinId);
  assert.ok(laterRuinId);

  useRuinsStore.setState({
    progressByRuinId: {
      [firstRuinId]: {
        totalRuns: 7,
        totalRoomsCleared: 23,
        bossKills: 2,
        bossChestRareFailures: 1,
      },
    },
  });

  bootstrapLiveWorldStores({
    cities: citiesSorted,
    ruins,
    majorRealmId: 'foundation_establishment',
  });

  assert.equal(useCityStore.getState().currentCityId, STONECRAG_CITY_ID);
  assert.equal(useCityStore.getState().selectedModuleByCity[STONECRAG_CITY_ID], 'outskirts');
  assert.equal(useRuinsStore.getState().progressByRuinId[firstRuinId].totalRuns, 7);
  assert.deepEqual(useRuinsStore.getState().progressByRuinId[laterRuinId], {
    totalRuns: 0,
    totalRoomsCleared: 0,
    bossKills: 0,
    bossChestRareFailures: 0,
  });
});

test('openCombatPreview preserves preview state for ruins and keeps the modal keyed to ruins', () => {
  const ruinId = Object.values(useContentStore.getState().maps.ruinsById).find((ruin) => ruin.cityId === PINEWIND_CITY_ID)?.id;
  assert.ok(ruinId);

  useUIStore.getState().openCombatPreview({
    type: 'ruins',
    cityId: PINEWIND_CITY_ID,
    sourceId: ruinId,
  });

  const uiState = useUIStore.getState();
  assert.equal(uiState.combatPresentation.mode, 'preview');
  assert.deepEqual(uiState.combatPresentation.context, {
    type: 'ruins',
    cityId: PINEWIND_CITY_ID,
    sourceId: ruinId,
    moduleKey: 'ruins',
  });
  assert.equal(uiState.showWorldBuildingModal, true);
  assert.equal(uiState.worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(uiState.worldBuildingModalKey, 'ruins');
});

test('openCombatPreview keeps trial previews mapped to the gateTrial world modal key', () => {
  useUIStore.getState().openCombatPreview({
    type: 'trial',
    cityId: PINEWIND_CITY_ID,
    sourceId: 'trial_novices_clearing',
  });

  const uiState = useUIStore.getState();
  assert.equal(uiState.combatPresentation.mode, 'preview');
  assert.deepEqual(uiState.combatPresentation.context, {
    type: 'trial',
    cityId: PINEWIND_CITY_ID,
    sourceId: 'trial_novices_clearing',
    moduleKey: 'gateTrial',
  });
  assert.equal(uiState.showWorldBuildingModal, true);
  assert.equal(uiState.worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(uiState.worldBuildingModalKey, 'gateTrial');
});
