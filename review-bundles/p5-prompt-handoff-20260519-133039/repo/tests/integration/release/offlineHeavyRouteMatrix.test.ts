import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAlternativeRouteCommonInvariants,
  assertOfflineRouteExcludesCombatProgress,
} from '../../helpers/release/alternativeRouteAssertions.js';
import { runOfflineHeavyAlternativeRoute } from '../../helpers/release/runAlternativeRoute.js';

test('offline-heavy route verifies offline contributions without combat/trial skipping', async () => {
  const result = await runOfflineHeavyAlternativeRoute();

  assertAlternativeRouteCommonInvariants(result);
  assertOfflineRouteExcludesCombatProgress(result);

  assert.equal(result.failures.length, 0, result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | '));
  assert.equal(result.finalSnapshot.offlineWindowsApplied, 2);

  const trialRow = result.comparisonRows.find((row) => row.metric === 'offline_trial_clear_count');
  assert.ok(trialRow);
  assert.equal(trialRow?.routeValue, 0);

  const gateWallCheckpoint = result.checkpoints.find((row) => row.checkpointId === 'offline_gate_wall_verified');
  assert.ok(gateWallCheckpoint);
});
