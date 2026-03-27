import assert from 'node:assert/strict';
import test from 'node:test';

import { FRESH_SAVE_CHECKPOINT_IDS } from '../../helpers/release/freshSaveCheckpointCatalog.js';
import { FRESH_SAVE_ROUTE_CATALOG } from '../../helpers/release/runFreshSaveRoute.js';

test('fresh-save route catalog exposes stable normal/cautious/aggressive route IDs', () => {
  assert.deepEqual(
    FRESH_SAVE_ROUTE_CATALOG.map((entry) => entry.id),
    ['normal', 'cautious', 'aggressive'],
  );
});

test('fresh-save route catalog checkpoint references are valid and complete', () => {
  for (const route of FRESH_SAVE_ROUTE_CATALOG) {
    assert.equal(route.expectedCheckpoints.length > 0, true, `${route.id} must declare checkpoint expectations.`);
    route.expectedCheckpoints.forEach((checkpointId) => {
      assert.equal(FRESH_SAVE_CHECKPOINT_IDS.has(checkpointId), true, `Unknown checkpoint in ${route.id}: ${checkpointId}`);
    });
  }
});

test('exactly one route is currently blocking automated smoke coverage', () => {
  const automatedBlocking = FRESH_SAVE_ROUTE_CATALOG.filter((entry) => entry.automationMode === 'automated_smoke_blocking' && entry.isBlockingSmokeRoute);
  assert.equal(automatedBlocking.length, 1);
  assert.equal(automatedBlocking[0]?.id, 'normal');
});
