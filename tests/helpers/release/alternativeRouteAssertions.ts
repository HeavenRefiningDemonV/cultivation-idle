import assert from 'node:assert/strict';

import { SEMESTER_SLICE_CONTRACT } from '../../../src/systems/progression/contract/semesterSlice.js';
import type { AlternativeRouteResult } from './alternativeRouteTypes.js';

export function assertRouteWarningsAndFailuresAreExplicit(result: AlternativeRouteResult) {
  assert.equal(Array.isArray(result.warnings), true);
  assert.equal(Array.isArray(result.failures), true);
  result.failures.forEach((failure) => {
    assert.equal(typeof failure.code, 'string');
    assert.equal(typeof failure.message, 'string');
    assert.equal(typeof failure.blocker, 'boolean');
  });
}

export function assertRouteStaysInSemesterSlice(result: AlternativeRouteResult) {
  const outOfSlice = result.finalSnapshot.unlockedCityIds.filter((cityId) => !SEMESTER_SLICE_CONTRACT.liveCityIds.includes(cityId));
  assert.deepEqual(outOfSlice, [], `Out-of-slice city ids detected: ${outOfSlice.join(',')}`);
}

export function assertNoFakeCitySix(result: AlternativeRouteResult) {
  assert.equal(result.finalSnapshot.noFakeCitySix, true, 'Fake city 6 leak detected.');
  assert.equal(result.finalSnapshot.unlockedCityIds.includes('city_six' as never), false, 'city_six should never appear.');
  assert.equal(result.finalSnapshot.unlockedCityIds.includes('city_fake_future_metropolis' as never), false, 'future fake city should never appear.');
}

export function assertFinalCityValid(result: AlternativeRouteResult) {
  if (!result.finalSnapshot.currentCityId) return;
  assert.equal(
    SEMESTER_SLICE_CONTRACT.liveCityIds.includes(result.finalSnapshot.currentCityId),
    true,
    `Final city must be in live slice: ${result.finalSnapshot.currentCityId}`,
  );
}

export function assertBypassNotMislabeledAsClear(result: AlternativeRouteResult) {
  if (result.routeId !== 'fail_safe') return;
  const bypassComparison = result.comparisonRows.find((row) => row.metric === 'fail_safe_resolution_mode');
  assert.ok(bypassComparison, 'fail_safe_resolution_mode comparison is required');
  assert.equal(bypassComparison?.routeValue, 'bypassed');
}

export function assertOfflineRouteExcludesCombatProgress(result: AlternativeRouteResult) {
  if (result.routeId !== 'offline_heavy') return;
  const combatRow = result.comparisonRows.find((row) => row.metric === 'offline_combat_progress');
  assert.ok(combatRow, 'offline_combat_progress comparison is required');
  assert.equal(combatRow?.routeValue, 0);
}

export function assertLowAttentionBudget(result: AlternativeRouteResult, budgetMax: number) {
  if (result.routeId !== 'low_attention') return;
  const interactions = result.finalSnapshot.estimatedAttentionInteractions ?? result.interactionLog.length;
  assert.equal(interactions <= budgetMax, true, `Low-attention interaction budget exceeded: ${interactions} > ${budgetMax}`);
}

export function assertAlternativeRouteCommonInvariants(result: AlternativeRouteResult) {
  assertRouteWarningsAndFailuresAreExplicit(result);
  assertRouteStaysInSemesterSlice(result);
  assertNoFakeCitySix(result);
  assertFinalCityValid(result);
  assert.equal(result.completedAt >= result.startedAt, true);
  assert.equal(result.elapsedMs >= 0, true);
}
