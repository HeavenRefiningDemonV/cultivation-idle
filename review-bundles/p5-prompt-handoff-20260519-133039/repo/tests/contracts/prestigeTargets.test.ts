import assert from 'node:assert/strict';
import test from 'node:test';

import { PRESTIGE_TARGETS } from '../../src/systems/balance/prestigeTargets.js';

test('prestige targets lock 6.7 unlock floor and no-time-bonus policy', () => {
  assert.equal(PRESTIGE_TARGETS.unlock.unlockRealmIndex, 2);
  assert.equal(PRESTIGE_TARGETS.unlock.unlockRealmId, 'core_formation');
  assert.equal(PRESTIGE_TARGETS.policy.timeBonusEnabled, false);
  assert.equal(PRESTIGE_TARGETS.policy.recommendedResetPolicy, 'content_cap_only');
});

test('prestige targets expose checkpoint AP/hour, reclaim, cadence, and visibility policy truths', () => {
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.foundation_entry, { minAp: 0, maxAp: 0 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.core_entry, { minAp: 10, maxAp: 14 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.nascent_entry, { minAp: 24, maxAp: 32 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.soul_entry, { minAp: 42, maxAp: 56 });
  assert.deepEqual(PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry, { minAp: 72, maxAp: 90 });

  assert.equal(PRESTIGE_TARGETS.apPerHourPolicy.coreFormationApPerHourFloor, 4.4);
  assert.equal(PRESTIGE_TARGETS.apPerHourPolicy.nascentVsCoreMultiplierFloor, 1.05);
  assert.equal(PRESTIGE_TARGETS.apPerHourPolicy.soulVsNascentMultiplierFloor, 0.98);
  assert.equal(PRESTIGE_TARGETS.apPerHourPolicy.capVsSoulMultiplierFloor, 1.05);

  assert.deepEqual(PRESTIGE_TARGETS.starterSpendCadencePolicy.coreStarterPair, ['ap_idle_qi_mult', 'ap_combat_mult']);
  assert.ok(PRESTIGE_TARGETS.reclaimMilestoneTargets.first_viable_core_reset_starter_spend);
  assert.ok(PRESTIGE_TARGETS.reclaimMilestoneTargets.deep_cap_reset_starter_spend);
  assert.equal(PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio, 0.15);

  assert.ok(PRESTIGE_TARGETS.visibilityPromotionPolicy.masteryRetentionNodes.includes('ap_mastery_retention_10'));
  assert.ok(PRESTIGE_TARGETS.visibilityPromotionPolicy.unsupportedNodesRemainHidden.includes('ap_unlock_meridian_hall'));
});
