import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAlternativeRouteCommonInvariants,
  assertReclaimAccelerationRowsPresent,
} from '../../helpers/release/alternativeRouteAssertions.js';
import { buildReclaimRouteReport, runReclaimAlternativeRoute } from '../../helpers/release/runAlternativeRoute.js';

test('reclaim route verifies material acceleration and prestige-surface coherence', async () => {
  const result = await runReclaimAlternativeRoute();
  const report = await buildReclaimRouteReport();

  assertAlternativeRouteCommonInvariants(result);
  assertReclaimAccelerationRowsPresent(result);

  assert.equal(result.failures.length, 0, result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | '));
  assert.equal(report.overallPass, true);
  assert.equal(report.starterSpendPlan.length > 0, true);

  assert.equal(report.milestoneTimings.foundationSpeedupRatio >= 0.15, true);
  assert.equal(report.milestoneTimings.coreSpeedupRatio >= 0.15, true);
  assert.equal(report.milestoneTimings.nascentSpeedupRatio >= 0.1, true);

  const feelRow = result.comparisonRows.find((row) => row.metric === 'reclaim_first_purchase_feel_passes');
  assert.ok(feelRow);
  assert.equal(feelRow?.routeValue, true);

  const unsupportedNodeWatch = result.exploitWatchlist?.find((entry) => entry.code === 'unsupported_prestige_node_in_starter_plan');
  assert.ok(unsupportedNodeWatch);
  assert.equal(unsupportedNodeWatch?.triggered, false);
});
