import assert from 'node:assert/strict';
import test from 'node:test';

import { PRESTIGE_TARGETS } from '../../src/systems/balance/prestigeTargets.js';

test('prestige targets lock 6.7 unlock floor and no-time-bonus policy', () => {
  assert.equal(PRESTIGE_TARGETS.unlock.unlockRealmIndex, 2);
  assert.equal(PRESTIGE_TARGETS.unlock.unlockRealmId, 'core_formation');
  assert.equal(PRESTIGE_TARGETS.policy.timeBonusEnabled, false);
  assert.equal(PRESTIGE_TARGETS.policy.recommendedResetPolicy, 'content_cap_only');
});

test('prestige targets expose checkpoint AP ranges and prompt-2 ap/hour placeholders', () => {
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.foundation_entry, { minAp: 0, maxAp: 0 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.core_entry, { minAp: 10, maxAp: 14 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.nascent_entry, { minAp: 24, maxAp: 32 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.soul_entry, { minAp: 42, maxAp: 56 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry, { minAp: 72, maxAp: 90 });

  assert.ok(PRESTIGE_TARGETS.apPerHourTargets.core_viable_ap_per_hour);
  assert.ok(PRESTIGE_TARGETS.apPerHourTargets.nascent_ap_per_hour);
  assert.ok(PRESTIGE_TARGETS.apPerHourTargets.soul_ap_per_hour);
  assert.ok(PRESTIGE_TARGETS.apPerHourTargets.cap_ap_per_hour);
});
