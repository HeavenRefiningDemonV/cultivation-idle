import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAlternativeRouteCommonInvariants,
  assertHighSkillWatchlistIsStructured,
} from '../../helpers/release/alternativeRouteAssertions.js';
import { runHighSkillAlternativeRoute } from '../../helpers/release/runAlternativeRoute.js';

test('high-skill route is faster/cleaner than representative baseline without policy drift', async () => {
  const result = await runHighSkillAlternativeRoute();

  assertAlternativeRouteCommonInvariants(result);
  assertHighSkillWatchlistIsStructured(result);

  assert.equal(result.failures.length, 0, result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | '));
  assert.ok(result.decisionPolicy && result.decisionPolicy.length >= 3);

  const speedupRows = result.comparisonRows.filter((row) => row.metric.includes('delta_seconds'));
  assert.equal(speedupRows.length >= 2, true);
  assert.equal(speedupRows.some((row) => typeof row.routeValue === 'number' && row.routeValue > 0), true);

  const bypassRow = result.comparisonRows.find((row) => row.metric === 'high_skill_bypass_emergency_only');
  assert.ok(bypassRow);
  assert.equal(bypassRow?.routeValue, true);

  const watchlistBlockers = result.exploitWatchlist?.filter((entry) => entry.severity === 'blocker' && entry.triggered) ?? [];
  assert.deepEqual(watchlistBlockers, []);
});
