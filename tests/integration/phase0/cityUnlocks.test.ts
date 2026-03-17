import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advanceToGateThreshold,
  createPhase0Harness,
  getFirstBreakthroughRuntimeGateItem,
  getUnlockedCities,
  grantItem,
  performBreakthrough,
} from '../../helpers/phase0Harness.ts';
import { expectCurrentlyBrokenContract } from '../../helpers/expectedFailure.ts';

test('PHASE0 CONTRACT (expected broken): entering unlock realm should unlock next city in runtime progression', () => {
  const harness = createPhase0Harness();
  const expectedCityUnlock = harness.firstTransition.cityUnlockIdsForTargetRealm[0];

  assert.ok(expectedCityUnlock, 'First transition should declare which city unlocks at the target realm.');

  const runtimeGateItem = getFirstBreakthroughRuntimeGateItem(harness.fromRealmIndex);
  assert.ok(runtimeGateItem, 'Runtime gate table must define first breakthrough gate item');

  advanceToGateThreshold(harness.fromRealmIndex);
  grantItem(runtimeGateItem, 1);

  const advanced = performBreakthrough();
  assert.equal(advanced, true, 'Breakthrough preconditions should be satisfied for this contract test.');

  expectCurrentlyBrokenContract(() => {
    assert.equal(
      getUnlockedCities().includes(expectedCityUnlock),
      true,
      'After a legitimate realm entry, the next city should be unlocked and reachable.',
    );
  }, 'city unlock progression handoff after first realm transition');
});
