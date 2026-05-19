import assert from 'node:assert/strict';
import test from 'node:test';

import { createPostFirstGateScenario, loadProgressionContract } from '../../helpers/progression/index.js';
import { projectSaveShapeToScenario } from './adapters/toContractScenario.js';
import { toSaveShape } from './adapters/toSaveShape.js';

test('toSaveShape preserves canonical packet-1.5 cityState for post-first-gate scenarios', async () => {
  const contract = await loadProgressionContract();
  const scenario = createPostFirstGateScenario({ contract });
  const saveShape = toSaveShape({ scenario }, contract) as {
    cityState?: {
      currentCityId?: string | null;
      unlockedCityIds?: string[];
      selectedModuleByCity?: Record<string, string>;
    };
  };

  assert.equal(saveShape.cityState?.currentCityId, 'city_stonecrag_town');
  assert.deepEqual(saveShape.cityState?.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
  assert.equal(saveShape.cityState?.selectedModuleByCity?.city_stonecrag_town, 'outskirts');
});

test('toContractScenario uses save cityState first when canonical city truth is already present', async () => {
  const contract = await loadProgressionContract();
  const scenario = projectSaveShapeToScenario(
    {
      version: '2.0.0',
      gameState: { realm: { index: 1, substage: 0, name: 'Foundation Establishment' }, selectedPath: null },
      inventoryState: { items: {} },
      prestigeState: { currentRunAP: 0, highestRealmReached: 1 },
      cityState: {
        currentCityId: 'city_pinewind_hamlet',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
        selectedModuleByCity: {
          city_pinewind_hamlet: 'outskirts',
          city_stonecrag_town: 'outskirts',
        },
        cityFlagsById: {},
      },
    },
    contract,
  );

  assert.equal(scenario.cityState.currentCityId, 'city_pinewind_hamlet');
  assert.deepEqual(scenario.cityState.unlockedCityIds, ['city_pinewind_hamlet', 'city_stonecrag_town']);
});

test('toContractScenario still backfills city truth for intentionally incomplete legacy save shapes', async () => {
  const contract = await loadProgressionContract();
  const scenario = projectSaveShapeToScenario(
    {
      version: '2.0.0',
      gameState: { realm: { index: 5, substage: 0, name: 'Spirit Severing' }, selectedPath: null },
      inventoryState: { items: {} },
      prestigeState: { currentRunAP: 0, highestRealmReached: 5 },
    },
    contract,
  );

  assert.deepEqual(scenario.cityState.unlockedCityIds, [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ]);
  assert.equal(scenario.cityState.currentCityId, 'city_ironpeak_bastion');
  assert.equal(scenario.cityState.unlockedCityIds.includes('city_six'), false);
});


test('legacy partial-reset migration fixtures project to clean current city truth in canonical adapters', async () => {
  const contract = await loadProgressionContract();
  const scenario = projectSaveShapeToScenario(
    {
      version: '2.0.0',
      gameState: { realm: { index: 0, substage: 0, name: 'Qi Condensation' }, selectedPath: null },
      cityState: {
        currentCityId: 'city_stonecrag_town',
        unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
        selectedModuleByCity: { city_stonecrag_town: 'ruins' },
      },
      trialState: { progressByTrialId: {} },
      inventoryState: { items: {} },
      prestigeState: { currentRunAP: 0, highestRealmReached: 0 },
    },
    contract,
  );

  assert.deepEqual(scenario.cityState.unlockedCityIds, ['city_pinewind_hamlet']);
  assert.equal(scenario.cityState.currentCityId, 'city_pinewind_hamlet');
});


test('canonical fixture adapters normalize legacy offline timestamp splits out of current-save truth', async () => {
  const contract = await loadProgressionContract();
  const saveShape = toSaveShape({
    migrationFixture: {
      name: 'legacy-offline-split',
      data: {
        version: '2.0.0',
        timestamp: 1736035200000,
        meta: { lastActiveAtMs: 1736031000000 },
        gameState: {
          realm: { index: 0, substage: 0, name: 'Qi Condensation' },
          selectedPath: null,
          lastActiveTime: 1736032000000,
          lastTickTime: 1736033000000,
        },
        inventoryState: { items: {} },
        prestigeState: { currentRunAP: 0, highestRealmReached: 0 },
      },
    },
  }, contract) as { meta?: { lastActiveAtMs?: number }; gameState?: { lastActiveTime?: number; lastTickTime?: number } };

  assert.equal(saveShape.meta?.lastActiveAtMs, 1736033000000);
  assert.equal(saveShape.gameState?.lastActiveTime, 1736033000000);
  assert.equal(saveShape.gameState?.lastTickTime, 1736033000000);
});
