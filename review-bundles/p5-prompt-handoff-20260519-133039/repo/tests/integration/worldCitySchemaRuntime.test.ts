import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { normalizeCitySaveState } from '../../src/save/cityStateNormalization.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { buildLiveCityPackageRegistry } from '../../src/systems/world/cityPackageRegistry.js';
import { LIVE_CITY_MODULE_ORDER } from '../../src/systems/world/liveWorldSchema.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const PINEWIND_CITY_ID = 'city_pinewind_hamlet';

const loadValidatedContent = async () => validateLoadedContent(await loadRawProgressionContent() as never);

const createCityStateInput = (moduleKey: string) => ({
  unlockedCityIds: [PINEWIND_CITY_ID],
  currentCityId: PINEWIND_CITY_ID,
  selectedModuleByCity: { [PINEWIND_CITY_ID]: moduleKey },
  cityFlagsById: {},
  initializedFromContent: true,
});

test.beforeEach(() => {
  useCityStore.getState().hardResetCity();
});

test('validated content resolves a complete live city package for all five cities', async () => {
  const validated = await loadValidatedContent();
  const packageRegistry = buildLiveCityPackageRegistry({
    cities: validated.cities,
    outskirtsById: Object.fromEntries(validated.outskirts.map((entry) => [entry.id, entry])),
    trialsById: Object.fromEntries(validated.trials.map((entry) => [entry.id, entry])),
    ruinsById: Object.fromEntries(validated.ruins.map((entry) => [entry.id, entry])),
    pavilionsById: Object.fromEntries(validated.pavilions.map((entry) => [entry.id, entry])),
    apothecaryById: Object.fromEntries(validated.apothecary_shops.map((entry) => [entry.id, entry])),
  });

  assert.equal(validated.cities.length, 5);
  assert.equal(packageRegistry.coverageIssues.length, 0);
  assert.equal(packageRegistry.packages.length, validated.cities.length);
  validated.cities.forEach((city) => {
    assert.deepEqual(city.modules, LIVE_CITY_MODULE_ORDER);
    assert.ok(packageRegistry.packagesByCityId[city.id]);
  });
});

test('save normalization fallback preserves valid ruins selections when content is unavailable', () => {
  const normalized = normalizeCitySaveState({
    content: null,
    realmIndex: 0,
    cityState: createCityStateInput('ruins'),
  });

  assert.equal(normalized.selectedModuleByCity[PINEWIND_CITY_ID], 'ruins');
});

test('save normalization fallback rejects deferred and unknown module selections', () => {
  const normalizedDeferred = normalizeCitySaveState({
    content: null,
    realmIndex: 0,
    cityState: createCityStateInput('alchemy'),
  });
  assert.equal(normalizedDeferred.selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');

  const normalizedUnknown = normalizeCitySaveState({
    content: null,
    realmIndex: 0,
    cityState: createCityStateInput('totally_fake_module'),
  });
  assert.equal(normalizedUnknown.selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});

test('city store initialization keeps valid ruins selections and clears deferred or unknown ones', async () => {
  const validated = await loadValidatedContent();
  const validatedCitiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);

  useCityStore.setState({
    unlockedCityIds: [PINEWIND_CITY_ID],
    currentCityId: PINEWIND_CITY_ID,
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'ruins' },
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(validatedCitiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'ruins');

  useCityStore.getState().hardResetCity();
  useCityStore.setState({
    unlockedCityIds: [PINEWIND_CITY_ID],
    currentCityId: PINEWIND_CITY_ID,
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'alchemy' },
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(validatedCitiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');

  useCityStore.getState().hardResetCity();
  useCityStore.setState({
    unlockedCityIds: [PINEWIND_CITY_ID],
    currentCityId: PINEWIND_CITY_ID,
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'totally_fake_module' },
    cityFlagsById: {},
    initializedFromContent: false,
  });
  useCityStore.getState().initializeFromContent(validatedCitiesSorted);
  assert.equal(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});
