import assert from 'node:assert/strict';
import test from 'node:test';

import { PRESTIGE_TARGETS } from '../../src/systems/balance/prestigeTargets.js';
import { runReclaimProbe } from '../helpers/balance/runReclaimProbe.js';

const inRangeMinutes = (seconds: number, min: number, max: number) => {
  const minutes = seconds / 60;
  return minutes >= min && minutes <= max;
};

test('packet 6.7d reclaim speed scenarios and first-purchase feel satisfy targets', async () => {
  const reclaim = await runReclaimProbe();

  const coreTarget = PRESTIGE_TARGETS.reclaimMilestoneTargets.first_viable_core_reset_starter_spend.milestonesMinutes;
  assert.ok(inRangeMinutes(reclaim.coreStarter.gate1Available, coreTarget.gate1Available.min, coreTarget.gate1Available.max));
  assert.ok(inRangeMinutes(reclaim.coreStarter.foundationEntry, coreTarget.foundationEntry.min, coreTarget.foundationEntry.max));
  assert.ok(inRangeMinutes(reclaim.coreStarter.coreReentry, coreTarget.coreReentry.min, coreTarget.coreReentry.max));

  const capTarget = PRESTIGE_TARGETS.reclaimMilestoneTargets.deep_cap_reset_starter_spend.milestonesMinutes;
  assert.ok(inRangeMinutes(reclaim.capStarter.gate1Available, capTarget.gate1Available.min, capTarget.gate1Available.max));
  assert.ok(inRangeMinutes(reclaim.capStarter.foundationEntry, capTarget.foundationEntry.min, capTarget.foundationEntry.max));
  assert.ok(inRangeMinutes(reclaim.capStarter.coreReentry, capTarget.coreReentry.min, capTarget.coreReentry.max));
  assert.ok(inRangeMinutes(reclaim.capStarter.nascentReentry ?? 0, capTarget.nascentReentry!.min, capTarget.nascentReentry!.max));

  assert.equal(reclaim.firstViableCoreStarterSpend.passes, true);
  assert.equal(reclaim.deepCapStarterSpend.passes, true);

  assert.ok(reclaim.firstPurchaseFeel.bestImprovement >= PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio);
  assert.equal(reclaim.firstPurchaseFeel.passes, true);
});
