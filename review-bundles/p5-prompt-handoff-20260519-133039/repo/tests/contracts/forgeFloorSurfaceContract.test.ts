import assert from 'node:assert/strict';
import test from 'node:test';

import { buildForgeFloorSurface } from '../../src/systems/forge/forgeFloorSurface.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('ForgeFloorSurfaceV1 names the missing floor, cheapest fix, and material route', async () => {
  const content = await getValidatedEconomicContent();
  const surface = buildForgeFloorSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    itemCountsById: {},
    currencies: { gold: '0', merit: '0', spiritStones: '0' },
    forgeFloor: buildForgeFloorReadModel({
      weaponRefineFloor: 0,
      accessoryRefineFloor: 0,
      temperSuccessesBySlot: { weapon: 0, accessory: 0 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: 0,
    }),
  });

  assert.equal(surface.version, 1);
  assert.equal(surface.cheapestFix?.rowId, 'weapon_refine');
  assert.match(surface.readinessDeltaForecast ?? '', /floor|minimum|readiness/i);
  assert.ok(surface.missingMaterialRoutes.some((route) => route.moduleKey === 'ruins' || route.moduleKey === 'outskirts' || route.moduleKey === 'expeditions'));
});
