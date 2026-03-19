import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { buildWorldCitySelectorEntries } from '../../src/systems/world/travelContract.js';
import { adaptProgressionAuthoredContent, getProgressionContract } from '../../src/systems/progression/contract/index.js';
import { getCityUnlockRequirementText } from '../../src/systems/progression/runtime/cityProgression.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const primeStores = async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  const contract = getProgressionContract(adaptProgressionAuthoredContent(validated));
  const cityRequirementById = Object.fromEntries(
    citiesSorted.map((city) => [city.id, getCityUnlockRequirementText(contract, city.id)]),
  ) as Record<string, string | null>;

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

  return { citiesSorted, cityRequirementById };
};

test.beforeEach(() => {
  useCityStore.getState().hardResetCity();
});

test('fresh-save semester selector visibility shows the five live cities with Pinewind current and later cities locked', async () => {
  const { citiesSorted, cityRequirementById } = await primeStores();
  useCityStore.getState().initializeFromContent(citiesSorted);

  const selectorEntries = buildWorldCitySelectorEntries({
    cities: citiesSorted,
    currentCityId: useCityStore.getState().currentCityId,
    unlockedCityIds: useCityStore.getState().unlockedCityIds,
    requirementTextByCityId: cityRequirementById,
  });

  assert.deepEqual(selectorEntries.map((entry) => entry.city.id), SEMESTER_SLICE_CONTRACT.liveCityIds);
  assert.equal(selectorEntries[0]?.city.id, 'city_pinewind_hamlet');
  assert.equal(selectorEntries[0]?.isCurrent, true);
  assert.equal(selectorEntries[0]?.isUnlocked, true);

  selectorEntries.slice(1).forEach((entry) => {
    assert.equal(entry.isUnlocked, false);
    assert.equal(entry.disabled, true);
    assert.equal(typeof entry.requirementText, 'string');
    assert.equal((entry.requirementText ?? '').length > 0, true);
  });
});

test('selector ordering keeps current city pinned first, then other unlocked, then locked live cities', async () => {
  const { citiesSorted, cityRequirementById } = await primeStores();
  useCityStore.setState({
    currentCityId: 'city_lotusford',
    unlockedCityIds: [
      'city_pinewind_hamlet',
      'city_stonecrag_town',
      'city_spirit_cavern_city',
      'city_lotusford',
    ],
    selectedModuleByCity: {},
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(citiesSorted);

  const selectorEntries = buildWorldCitySelectorEntries({
    cities: citiesSorted,
    currentCityId: useCityStore.getState().currentCityId,
    unlockedCityIds: useCityStore.getState().unlockedCityIds,
    requirementTextByCityId: cityRequirementById,
  });

  assert.deepEqual(selectorEntries.map((entry) => entry.city.id), [
    'city_lotusford',
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_ironpeak_bastion',
  ]);
});

test('non-slice cities are excluded from selector entries', async () => {
  const { citiesSorted, cityRequirementById } = await primeStores();
  useCityStore.getState().initializeFromContent(citiesSorted);

  const selectorEntries = buildWorldCitySelectorEntries({
    cities: [
      ...citiesSorted,
      {
        id: 'city_fake_future_metropolis',
        index: 99,
        name: 'Fake Future Metropolis',
        unlockMajorRealm: 'spirit_severing',
        modules: ['outskirts'],
        refs: {
          outskirtsId: 'outskirts_training_forest',
          gateTrialId: 'trial_novices_clearing',
          ruinId: 'ruin_hollow_log_den',
          pavilionId: 'pavilion_pinewind',
          apothecaryId: 'shop_apothecary_pinewind',
        },
        themeTags: [],
      },
    ],
    currentCityId: useCityStore.getState().currentCityId,
    unlockedCityIds: useCityStore.getState().unlockedCityIds,
    requirementTextByCityId: cityRequirementById,
  });

  assert.equal(selectorEntries.some((entry) => entry.city.id === 'city_fake_future_metropolis'), false);
});
