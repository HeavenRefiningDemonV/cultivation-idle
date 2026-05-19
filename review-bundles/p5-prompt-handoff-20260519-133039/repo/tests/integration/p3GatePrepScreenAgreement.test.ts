import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultMedicinePouchState } from '../../src/stores/medicinePouchStore.js';
import { buildGatePrepPackageSurface } from '../../src/systems/economy/gatePrepPackageSurface.js';
import { buildForgeFloorSurface } from '../../src/systems/forge/forgeFloorSurface.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { buildApothecaryPrepSurface } from '../../src/features/apothecary/exact/apothecaryPrepSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('P3 gate prep, Apothecary, and Forge surfaces agree on shared row routes', async () => {
  const content = await getValidatedEconomicContent();
  const pouchSlots = createDefaultMedicinePouchState().slots;
  const forgeFloor = buildForgeFloorReadModel({
    weaponRefineFloor: 0,
    accessoryRefineFloor: 0,
    temperSuccessesBySlot: { weapon: 0, accessory: 0 },
    inventoryRuneCounts: {},
    socketedRuneIds: [],
    cityIndex: 0,
  });

  const gate = buildGatePrepPackageSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    currentRealmIndex: 0,
    currentSubstage: 9,
    itemCountsById: {},
    currencies: { gold: '0', merit: '0', spiritStones: '0' },
    pouchSlots,
    forgeFloor,
  });
  const forge = buildForgeFloorSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    itemCountsById: {},
    currencies: { gold: '0', merit: '0', spiritStones: '0' },
    forgeFloor,
  });
  const apothecary = buildApothecaryPrepSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    itemCountsById: {},
    pouchSlots,
  });

  assert.equal(gate.rows.find((row) => row.group === 'gear_floor')?.route?.moduleKey, 'forge');
  assert.equal(gate.rows.find((row) => row.group === 'healing_stock')?.route?.moduleKey, 'apothecary');
  assert.equal(forge.cheapestFix?.rowId, 'weapon_refine');
  assert.equal(apothecary.conservativeSimulation.state, 'insufficient');
});
