import assert from 'node:assert/strict';
import test from 'node:test';

import { BALANCE_REGRESSION_MANIFEST, listBalanceRegressionMetricIds } from '../../src/systems/balance/balanceRegressionManifest.js';

test('balance regression manifest exposes a single frozen id registry', () => {
  assert.ok(BALANCE_REGRESSION_MANIFEST.length > 20);
  const ids = listBalanceRegressionMetricIds();
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length);
  assert.equal(ids.includes('timing.city_phase.pinewind'), true);
  assert.equal(ids.includes('offline.no_combat_progress'), true);
  assert.equal(ids.includes('telemetry.kpi.attempts_per_gate'), true);
});

test('manifest rows contain locked packet + owner metadata', () => {
  for (const row of BALANCE_REGRESSION_MANIFEST) {
    assert.match(row.lockedByPacket, /^[0-9]+\.[0-9]+[a-z]?$/i);
    assert.ok(row.owner.length > 0);
  }
});
