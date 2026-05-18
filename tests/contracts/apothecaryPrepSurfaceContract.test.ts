import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultMedicinePouchState } from '../../src/stores/medicinePouchStore.js';
import { buildApothecaryPrepSurface } from '../../src/features/apothecary/exact/apothecaryPrepSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('ApothecaryPrepSurfaceV1 separates inventory stock from pouch-ready medicine', async () => {
  const content = await getValidatedEconomicContent();
  const pouch = createDefaultMedicinePouchState().slots;

  const surface = buildApothecaryPrepSurface({
    content,
    cityId: 'city_pinewind_hamlet',
    itemCountsById: {
      cons_healing_pellet_t1: 12,
      cons_ironblood_pellet_t1: 4,
      cons_qi_elixir_t1: 4,
    },
    pouchSlots: pouch,
  });

  assert.equal(surface.version, 1);
  assert.ok(surface.stockRows.some((row) => row.state === 'minimum_met'));
  assert.ok(surface.pouchRows.some((row) => row.state === 'missing'));
  assert.equal(surface.conservativeSimulation.state, 'insufficient');
  assert.match(surface.summaryLine, /pouch|stock|trigger/i);
  assert.ok(surface.quickActions.some((action) => /configure/i.test(action.label)));
});
