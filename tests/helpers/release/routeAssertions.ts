import assert from 'node:assert/strict';

import { SEMESTER_SLICE_CONTRACT } from '../../../src/systems/progression/contract/semesterSlice.js';
import { FRESH_SAVE_CHECKPOINT_ORDER } from './freshSaveCheckpointCatalog.js';
import type { FreshSaveRouteResult } from './freshSaveRouteTypes.js';

const EXPECTED_CITY_CHAIN = [...SEMESTER_SLICE_CONTRACT.liveCityIds];
const EXPECTED_REALM_CAP = SEMESTER_SLICE_CONTRACT.contentCapRealm;

export function assertNormalFreshSaveRouteResult(result: FreshSaveRouteResult) {
  assert.equal(result.routeId, 'normal', 'Blocking smoke must execute normal route.');
  assert.equal(result.automationMode, 'automated_smoke_blocking', 'Normal route must remain the automated blocking smoke route.');
  assert.equal(result.isBlockingSmokeRoute, true, 'Normal route should be marked as blocking smoke.');

  assert.equal(result.failures.length, 0, `Route failures: ${result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | ')}`);
  assert.equal(result.assistedSteps.length, 0, 'Blocking smoke route must not use assisted steps.');

  assert.equal(result.finalSnapshot.finalRealmId, EXPECTED_REALM_CAP, 'Final realm must be Spirit Severing.');
  assert.equal(result.finalSnapshot.elapsedMsToCap !== null, true, 'Content cap checkpoint must be reached.');

  assert.deepEqual(result.finalSnapshot.unlockedCityIds, EXPECTED_CITY_CHAIN, 'Unlocked cities must match live five-city chain exactly.');
  assert.equal(result.finalSnapshot.unlockedCityIds.includes('city_fake_future_metropolis' as never), false, 'Fake city 6 must not appear.');

  const outOfSliceCities = result.finalSnapshot.unlockedCityIds.filter((cityId) => !SEMESTER_SLICE_CONTRACT.liveCityIds.includes(cityId));
  assert.deepEqual(outOfSliceCities, [], 'No out-of-slice city IDs are allowed.');

  const unresolvedGate = result.finalSnapshot.gateResolutionSummary.find((entry) => entry.resolution !== 'cleared');
  assert.equal(unresolvedGate, undefined, unresolvedGate ? `Gate ${unresolvedGate.gateIndex} unresolved (${unresolvedGate.resolution}).` : undefined);

  assert.equal(result.finalSnapshot.currentChapterExhaustedTruth, true, 'Current chapter exhausted truth must be available at cap.');
  assert.equal(result.finalSnapshot.prestigeAdvisorLabel !== null, true, 'Prestige advisor surface must be readable at cap.');
  assert.equal(result.finalSnapshot.lifeSummaryAvailable, true, 'Current life summary surface must be available.');

  const checkpointIds = new Set(result.checkpoints.map((entry) => entry.checkpointId));
  for (const checkpointId of FRESH_SAVE_CHECKPOINT_ORDER) {
    assert.equal(checkpointIds.has(checkpointId), true, `Missing checkpoint: ${checkpointId}`);
  }

  const checkpointAt = (id: string) => result.checkpoints.find((entry) => entry.checkpointId === id)?.elapsedMsSinceLifeStart ?? null;
  for (const gateIndex of [1, 2, 3, 4, 5]) {
    const available = checkpointAt(`gate_${gateIndex}_available`);
    const resolved = checkpointAt(`gate_${gateIndex}_resolved`);
    assert.equal(typeof available === 'number', true, `Missing gate_${gateIndex}_available checkpoint.`);
    assert.equal(typeof resolved === 'number', true, `Missing gate_${gateIndex}_resolved checkpoint.`);
    assert.equal((available ?? 0) <= (resolved ?? 0), true, `gate_${gateIndex} resolved before it became available.`);
  }
}
