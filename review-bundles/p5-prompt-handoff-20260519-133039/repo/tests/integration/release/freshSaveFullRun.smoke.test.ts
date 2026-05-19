import assert from 'node:assert/strict';
import test from 'node:test';

import { assertNormalFreshSaveRouteResult } from '../../helpers/release/routeAssertions.js';
import { runFreshSaveRoute } from '../../helpers/release/runFreshSaveRoute.js';

test('fresh-save normal route reaches spirit severing/current cap without assisted steps or future leakage', async () => {
  const result = await runFreshSaveRoute('normal');

  try {
    assertNormalFreshSaveRouteResult(result);
  } catch (error) {
    const failureDetails = result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | ') || 'none';
    const warnings = result.warnings.map((entry) => `${entry.code}: ${entry.message}`).join(' | ') || 'none';
    assert.fail(
      `Fresh-save smoke contradiction detected. failures=${failureDetails}; warnings=${warnings}; finalRealm=${result.finalSnapshot.finalRealmId}; unlockedCities=${result.finalSnapshot.unlockedCityIds.join(',')}`,
    );
  }

  assert.equal(result.assistedSteps.length, 0);
  assert.equal(result.finalSnapshot.unlockedCityIds.includes('city_fake_future_metropolis' as never), false);
});
