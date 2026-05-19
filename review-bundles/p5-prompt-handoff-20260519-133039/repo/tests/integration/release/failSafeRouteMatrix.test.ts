import assert from 'node:assert/strict';
import test from 'node:test';

import { getAlternativeRouteSpec } from '../../helpers/release/alternativeRouteCatalog.js';
import {
  assertAlternativeRouteCommonInvariants,
  assertBypassNotMislabeledAsClear,
} from '../../helpers/release/alternativeRouteAssertions.js';
import { runFailSafeAlternativeRoute } from '../../helpers/release/runAlternativeRoute.js';

test('fail-safe route verifies threshold gating, bypass resolution honesty, and emergency-only economics', async () => {
  const spec = getAlternativeRouteSpec('fail_safe');
  assert.ok(spec);

  const result = await runFailSafeAlternativeRoute();

  assertAlternativeRouteCommonInvariants(result);
  assertBypassNotMislabeledAsClear(result);

  assert.equal(result.failures.length, 0, result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | '));
  assert.equal(result.finalSnapshot.bypassPurchases?.length, 1);
  assert.equal((result.finalSnapshot.bypassPurchases?.[0]?.eligibleFailures ?? 0) >= (result.finalSnapshot.bypassPurchases?.[0]?.threshold ?? 0), true);

  const policy = result.comparisonRows.find((row) => row.metric === 'fail_safe_emergency_only_policy');
  assert.ok(policy);
  assert.equal(policy?.routeValue, true);

  const continuity = result.checkpoints.find((entry) => entry.checkpointId === 'post_bypass_continuity');
  assert.ok(continuity);
});
