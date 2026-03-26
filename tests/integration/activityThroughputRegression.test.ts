import assert from 'node:assert/strict';
import test from 'node:test';

import { ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS } from '../../src/systems/balance/activityThroughputTargets.js';
import { runActivityThroughputProbe } from '../helpers/balance/runActivityThroughputProbe.js';

test('activity throughput regression keeps Outskirts and Ruins numeric roles intact across all live cities', async () => {
  const probe = await runActivityThroughputProbe();

  assert.equal(probe.snapshots.length >= 5, true);

  for (const city of probe.snapshots) {
    assert.ok(city.outskirts.goldPerMinute > city.ruins.goldPerMinute, `${city.cityId} Outskirts gold/min should exceed Ruins`);
    assert.ok(
      city.outskirts.commonMaterialUnitsPerMinute > city.ruins.commonMaterialUnitsPerMinute,
      `${city.cityId} Outskirts common/min should exceed Ruins`,
    );
    assert.ok(
      city.ruins.targetedMaterialUnitsPerMinute > city.outskirts.targetedMaterialUnitsPerMinute,
      `${city.cityId} Ruins targeted/min should exceed Outskirts`,
    );

    assert.ok(
      city.ruins.anchorUnitsPerRun >= ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.ruinsAnchorUnitsPerRunMinimum,
      `${city.cityId} Ruins anchor units should stay guaranteed`,
    );

    assert.ok(city.outskirts.bossSpiritStoneSupportPerHour > 0, `${city.cityId} Outskirts boss spirit support should remain positive`);
    assert.ok(
      city.roleChecks.outskirtsSupportSecondary,
      `${city.cityId} Outskirts spirit-stone support should remain materially secondary`,
    );

    assert.equal(city.roleChecks.outskirtsGoldDominance, true, `${city.cityId} Outskirts gold dominance threshold failed`);
    assert.equal(city.roleChecks.outskirtsCommonDominance, true, `${city.cityId} Outskirts common dominance threshold failed`);
    assert.equal(city.roleChecks.ruinsTargetedDominance, true, `${city.cityId} Ruins targeted dominance threshold failed`);
    assert.equal(city.roleChecks.ruinsAnchorGuaranteed, true, `${city.cityId} Ruins guaranteed anchor threshold failed`);

    assert.ok(
      city.ruins.anchorUnitsPerRun >= city.ruins.guaranteedAnchorUnits,
      `${city.cityId} Ruins run output must retain guaranteed anchor quantity even with additive bonus`,
    );
    assert.ok(city.ruins.shortageRecoveryValue > city.outskirts.shortageRecoveryValue, `${city.cityId} shortage recovery should favor Ruins`);
    assert.ok(city.outskirts.roleShare.targetedAndAnchorShare < city.outskirts.roleShare.commonShare, `${city.cityId} Outskirts targeted+anchor share should stay below common share`);
  }
});
