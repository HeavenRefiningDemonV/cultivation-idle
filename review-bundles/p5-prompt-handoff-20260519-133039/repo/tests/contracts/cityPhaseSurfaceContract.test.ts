import assert from 'node:assert/strict';
import test from 'node:test';

import { REALMS } from '../../src/constants/index.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { buildLiveCityPhaseSurface } from '../../src/systems/world/cityPhaseSurface.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(content.cities);
  useGameStore.setState({ selectedPath: 'earth' });
  return content;
}

test('CityPhaseSurfaceV1 reads queued Stonecrag arrival without unlocking cities', async () => {
  await primeRuntime();
  useGameStore.setState({
    realm: { index: 1, substage: 1, name: REALMS[1]!.name },
  });
  useCityStore.setState({
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    acknowledgedArrivalCityIds: ['city_pinewind_hamlet'],
  });
  useUIStore.getState().queueCityArrival('city_stonecrag_town');
  const beforeUnlocked = [...useCityStore.getState().unlockedCityIds];

  const surface = buildLiveCityPhaseSurface();

  assert.equal(surface.version, 1);
  assert.equal(surface.cityId, 'city_stonecrag_town');
  assert.equal(surface.state, 'newly_arrived');
  assert.equal(surface.phaseLesson.code, 'permanent_floor');
  assert.equal(surface.firstRecommendedModule.moduleKey, 'forge');
  assert.match(surface.nextGateLine ?? '', /gate|core|trial/i);
  assert.deepEqual(useCityStore.getState().unlockedCityIds, beforeUnlocked);
});

test('CityPhaseSurfaceV1 is honest at authored content cap', async () => {
  const content = await primeRuntime();
  useGameStore.setState({
    realm: { index: 5, substage: REALMS[5]!.substages, name: REALMS[5]!.name },
  });
  useCityStore.setState({
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: content.cities.map((city) => city.id),
    acknowledgedArrivalCityIds: content.cities.map((city) => city.id),
  });
  useUIStore.getState().clearCityArrival();

  const surface = buildLiveCityPhaseSurface();

  assert.equal(surface.state, 'cap');
  assert.equal(surface.phaseLesson.code, 'content_cap');
  assert.equal(surface.firstRecommendedModule.moduleKey, 'prestige');
  assert.doesNotMatch(`${surface.newPressure.explanation} ${surface.nextGateLine ?? ''}`, /future city|unknown gate/i);
});
