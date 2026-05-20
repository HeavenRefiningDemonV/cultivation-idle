import assert from 'node:assert/strict';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useTrialStore } from '../../src/stores/trialStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import {
  performDaoMandateRouteAction,
  type DaoMandateRoute,
} from '../../src/systems/ui/daoMandate/index.js';
import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../helpers/economy/setupEconomicRuntimeScenario.js';

function tabRoute(overrides: Partial<DaoMandateRoute> = {}): DaoMandateRoute {
  return {
    id: 'route-cultivation',
    label: 'Return to Cultivation',
    actionLabel: 'Open Cultivation',
    detail: 'Qi refinement is the current route.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: 'Qi increases.',
    source: 'progression',
    priority: 10,
    ...overrides,
  };
}

async function primeRuntime() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  useCityStore.getState().initializeFromContent(useContentStore.getState().citiesSorted);
  useCombatStore.getState().hardResetCombat();
  useUIStore.setState({
    activeTab: 'status',
    showWorldBuildingModal: false,
    worldBuildingModalCityId: null,
    worldBuildingModalKey: null,
    worldBuildingModalIntent: null,
  });
  return content;
}

function criticalRuntimeSnapshot() {
  return {
    combat: { inCombat: useCombatStore.getState().inCombat },
    inventory: {
      currencies: { ...useInventoryStore.getState().currencies },
      items: { ...useInventoryStore.getState().items },
    },
    trial: JSON.parse(JSON.stringify(useTrialStore.getState().progressByTrialId)) as unknown,
  };
}

test('Dao Mandate route adapter refuses blocked and targetless routes with reasons', async () => {
  await primeRuntime();

  const blocked = performDaoMandateRouteAction(tabRoute({
    id: 'blocked',
    blocked: true,
    blockedReason: 'Blocked by test setup.',
  }));
  const targetless = performDaoMandateRouteAction(tabRoute({
    id: 'targetless',
    target: null,
  }));

  assert.deepEqual(blocked, { performed: false, reason: 'Blocked by test setup.' });
  assert.deepEqual(targetless, { performed: false, reason: 'Route target is unavailable.' });
  assert.equal(useUIStore.getState().activeTab, 'status');
});

test('Dao Mandate tab route dispatches through the UI tab owner only', async () => {
  await primeRuntime();
  const before = criticalRuntimeSnapshot();

  const result = performDaoMandateRouteAction(tabRoute());

  assert.deepEqual(result, { performed: true, reason: null });
  assert.equal(useUIStore.getState().activeTab, 'cultivation');
  assert.deepEqual(criticalRuntimeSnapshot(), before);
});

test('Dao Mandate world route opens the existing world module helper without touching combat, rewards, or trials', async () => {
  const content = await primeRuntime();
  const cityId = content.cities[0].id;
  const before = criticalRuntimeSnapshot();

  const result = performDaoMandateRouteAction(tabRoute({
    id: 'route-forge',
    label: 'Refine Forge Floor',
    actionLabel: 'Open Forge',
    detail: 'Forge is the current route.',
    destinationLabel: 'Forge',
    target: { kind: 'world_module', cityId, moduleKey: 'forge' },
    source: 'readiness',
  }));

  const ui = useUIStore.getState();
  assert.deepEqual(result, { performed: true, reason: null });
  assert.equal(ui.activeTab, 'adventure');
  assert.equal(useCityStore.getState().selectedModuleByCity[cityId], 'forge');
  assert.equal(ui.showWorldBuildingModal, true);
  assert.equal(ui.worldBuildingModalCityId, cityId);
  assert.equal(ui.worldBuildingModalKey, 'forge');
  assert.deepEqual(criticalRuntimeSnapshot(), before);
});

test('Dao Mandate world route returns false when the target city cannot be opened', async () => {
  await primeRuntime();
  const before = criticalRuntimeSnapshot();

  const result = performDaoMandateRouteAction(tabRoute({
    id: 'route-missing-city',
    label: 'Open Missing Forge',
    actionLabel: 'Open Forge',
    detail: 'This route points to a city that is not loaded.',
    destinationLabel: 'Forge',
    target: { kind: 'world_module', cityId: 'city_missing_for_test', moduleKey: 'forge' },
    source: 'readiness',
  }));

  const ui = useUIStore.getState();
  assert.deepEqual(result, {
    performed: false,
    reason: 'Route could not be opened. The target may be locked, unavailable, or blocked by the current activity.',
  });
  assert.equal(ui.activeTab, 'status');
  assert.equal(ui.showWorldBuildingModal, false);
  assert.deepEqual(criticalRuntimeSnapshot(), before);
});

test('Dao Mandate world route returns false when the target module is unavailable', async () => {
  const content = await primeRuntime();
  const cityId = content.cities[0].id;
  const before = criticalRuntimeSnapshot();

  const result = performDaoMandateRouteAction(tabRoute({
    id: 'route-deferred-module',
    label: 'Open Deferred Module',
    actionLabel: 'Open Alchemy',
    detail: 'This route points to a deferred module.',
    destinationLabel: 'Alchemy',
    target: { kind: 'world_module', cityId, moduleKey: 'alchemy' as never },
    source: 'economy',
  }));

  const ui = useUIStore.getState();
  assert.deepEqual(result, {
    performed: false,
    reason: 'Route could not be opened. The target may be locked, unavailable, or blocked by the current activity.',
  });
  assert.equal(ui.activeTab, 'status');
  assert.equal(ui.showWorldBuildingModal, false);
  assert.deepEqual(criticalRuntimeSnapshot(), before);
});
