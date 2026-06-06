import assert from 'node:assert/strict';
import test from 'node:test';

import { runFreshSaveRoute } from '../helpers/release/runFreshSaveRoute.js';

test('fresh-save route harness reaches the documented Spirit Severing content cap deterministically', async () => {
  const route = await runFreshSaveRoute('normal');

  assert.equal(route.finalSnapshot.finalRealmId, 'spirit_severing');
  assert.equal(route.finalSnapshot.currentCityId, 'city_ironpeak_bastion');
  assert.equal(route.checkpoints.some((entry) => entry.checkpointId === 'foundation_entry'), true);
  assert.equal(route.checkpoints.some((entry) => entry.checkpointId === 'content_cap_reached'), true);
  assert.deepEqual(route.failures, []);
});
