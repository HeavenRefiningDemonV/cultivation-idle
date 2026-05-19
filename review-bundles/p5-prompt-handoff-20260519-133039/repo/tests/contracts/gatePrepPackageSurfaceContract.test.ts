import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultMedicinePouchState } from '../../src/stores/medicinePouchStore.js';
import { buildGatePrepPackageSurface } from '../../src/systems/economy/gatePrepPackageSurface.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('GatePrepPackageSurfaceV1 groups missing gear, healing, support, reserve, and entry rows', async () => {
  const content = await getValidatedEconomicContent();
  const surface = buildGatePrepPackageSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    currentRealmIndex: 0,
    currentSubstage: 9,
    itemCountsById: {},
    currencies: { gold: '0', merit: '0', spiritStones: '0' },
    pouchSlots: createDefaultMedicinePouchState().slots,
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
  assert.equal(surface.readinessBand, 'missing_minimum');
  assert.equal(surface.rows.find((row) => row.group === 'gear_floor')?.route?.moduleKey, 'forge');
  assert.equal(surface.rows.find((row) => row.group === 'healing_stock')?.route?.moduleKey, 'apothecary');
  assert.equal(surface.rows.find((row) => row.group === 'safety_net')?.route?.moduleKey, 'gateTrial');
  assert.doesNotMatch(surface.rows.find((row) => row.group === 'entry')?.currentLine ?? '', /proof.*required|gate proof required/i);
  assert.ok(surface.primaryMissingRow);
});
