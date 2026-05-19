import assert from 'node:assert/strict';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { performRunCompassAction } from '../../src/systems/ui/runCompass/performRunCompassAction.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useUIStore.setState({
    activeTab: 'status',
    showWorldBuildingModal: false,
    worldBuildingModalCityId: null,
    worldBuildingModalKey: null,
    worldBuildingModalIntent: null,
  });
  return content;
}

test('Run Compass tab route dispatches through the UI tab owner', async () => {
  await primeRuntime();

  performRunCompassAction({
    id: 'route-cultivation',
    label: 'Return to Cultivation',
    why: 'Qi refinement is the current route.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    blocked: false,
    blockedReason: null,
  });

  assert.equal(useUIStore.getState().activeTab, 'cultivation');
});

test('Run Compass world route opens the existing world module modal', async () => {
  const content = await primeRuntime();
  const cityId = content.cities[0].id;

  performRunCompassAction({
    id: 'route-forge',
    label: 'Refine Forge Floor',
    why: 'Forge is the current route.',
    destinationLabel: 'Forge',
    target: { kind: 'world_module', cityId, moduleKey: 'forge' },
    blocked: false,
    blockedReason: null,
  });

  const ui = useUIStore.getState();
  assert.equal(ui.activeTab, 'adventure');
  assert.equal(useCityStore.getState().selectedModuleByCity[cityId], 'forge');
  assert.equal(ui.showWorldBuildingModal, true);
  assert.equal(ui.worldBuildingModalCityId, cityId);
  assert.equal(ui.worldBuildingModalKey, 'forge');
});

test('Run Compass dispatcher ignores blocked or targetless routes', async () => {
  await primeRuntime();

  performRunCompassAction({
    id: 'blocked',
    label: 'Blocked',
    why: 'No safe route.',
    destinationLabel: 'Prestige',
    target: { kind: 'tab', tab: 'prestige' },
    blocked: true,
    blockedReason: 'Blocked by test setup.',
  });

  assert.equal(useUIStore.getState().activeTab, 'status');
});
