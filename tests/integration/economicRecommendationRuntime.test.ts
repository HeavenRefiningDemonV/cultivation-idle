import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLiveEconomicRuntimeSnapshot } from '../../src/systems/economy/economicSnapshot.js';
import { buildLiveEconomicRecommendationEngine } from '../../src/systems/economy/economicRecommendationEngine.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

let contentPromise: ReturnType<typeof getValidatedEconomicContent> | null = null;
async function getContent() {
  if (!contentPromise) contentPromise = getValidatedEconomicContent();
  return contentPromise;
}

test.beforeEach(async () => {
  const content = await getContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
});

test('economic recommendation runtime builds a live snapshot from stores and keeps live module truth intact', async () => {
  const content = await getContent();
  useCityStore.setState({
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    selectedModuleByCity: { city_stonecrag_town: 'outskirts' },
  });
  useGameStore.setState({
    realm: { index: 1, substage: 3, name: 'Foundation Establishment' },
    selectedPath: 'earth',
  });
  useInventoryStore.getState().addItem('cons_healing_pellet_t1', 4);
  useInventoryStore.getState().addCurrency('gold', '120');
  useEquipmentStore.setState({
    refineLevelBySlot: { weapon: 1, accessory: 0 },
    temperBonusesBySlot: { weapon: [], accessory: [] },
  });
  useExpeditionStore.getState().hydrate({
    slots: 2,
    active: [{
      slotIndex: 0,
      expeditionTypeId: content.expeditions.types[0]!.id,
      durationId: content.expeditions.durations[0]!.id,
      cityId: 'city_stonecrag_town',
      cityIndex: 1,
      startedAt: 0,
      endsAt: 999999999,
      seed: 1,
      status: 'running',
    }],
  }, 0);

  const snapshot = buildLiveEconomicRuntimeSnapshot();
  const result = buildLiveEconomicRecommendationEngine();

  assert.equal(snapshot.currentCityId, 'city_stonecrag_town');
  assert.equal(snapshot.expeditionState.activeRunTypeIds.length, 1);
  assert.equal(result.snapshot.currentCityId, 'city_stonecrag_town');
  assert.equal(result.topRouteCandidates.every((candidate) => ['outskirts', 'ruins', 'apothecary', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'].includes(candidate.destinationModuleKey)), true);
});

test('economic recommendation runtime never returns hidden/deferred modules or a separate Alchemy room and keeps expedition-purpose mapping honest', async () => {
  const content = await getContent();
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
    selectedModuleByCity: { city_pinewind_hamlet: 'ruins' },
  });
  useGameStore.setState({
    realm: { index: 0, substage: 3, name: 'Qi Condensation' },
    selectedPath: 'heaven',
  });
  useInventoryStore.getState().addItem('cons_healing_pellet_t1', 1);
  useInventoryStore.getState().addItem('cons_qi_elixir_t1', 1);
  useInventoryStore.getState().addCurrency('gold', '0');
  useExpeditionStore.getState().hydrate({
    slots: 1,
    active: [{
      slotIndex: 0,
      expeditionTypeId: content.expeditions.types[0]!.id,
      durationId: content.expeditions.durations[0]!.id,
      cityId: 'city_pinewind_hamlet',
      cityIndex: 0,
      startedAt: 0,
      endsAt: 999999999,
      seed: 1,
      status: 'running',
    }],
  }, 0);

  const result = buildLiveEconomicRecommendationEngine();
  assert.equal(result.topRouteCandidates.some((candidate) => candidate.destinationModuleKey === 'alchemy' as never), false);
  assert.equal(result.topRouteCandidates.some((candidate) => candidate.destinationModuleKey === 'talisman' as never), false);
  const expeditionCandidates = result.topRouteCandidates.filter((candidate) => candidate.destinationModuleKey === 'expeditions');
  expeditionCandidates.forEach((candidate) => {
    assert.equal(candidate.actionKind, 'launch_expedition');
  });
});
