import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS,
  getActivityThroughputTargets,
} from '../../src/systems/balance/activityThroughputTargets.js';
import { buildAllActivityThroughputSnapshots } from '../../src/systems/economy/activityThroughputReadModel.js';
import { buildAllSupportThroughputCityReports } from '../../src/systems/economy/supportThroughputReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

test('bounty/expedition support throughput stays aligned with reserve pacing and expedition equivalence targets', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const supportReports = buildAllSupportThroughputCityReports(validated);
  const activeThroughput = buildAllActivityThroughputSnapshots(validated);
  const targets = getActivityThroughputTargets();
  const tolerance = targets.expeditionEquivalenceTargets.validationTolerance.absoluteRatioTolerance;

  assert.equal(supportReports.length, 5);

  for (const report of supportReports) {
    const active = activeThroughput.find((entry) => entry.cityId === report.cityId);
    assert.ok(active, `${report.cityId} missing active throughput snapshot`);

    assert.ok(
      report.bounty.reserveContribution.meritCoverageAtMinClaims >=
        ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.bountyMeritCoverageAtMinClaimsMinRatio,
      `${report.cityId} bounty merit reserve pacing too weak`,
    );
    assert.ok(
      report.bounty.reserveContribution.spiritCoverageAtMinClaims >=
        ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.bountySpiritCoverageAtMinClaimsMinRatio,
      `${report.cityId} bounty spirit reserve pacing too weak`,
    );

    const easySupportValue = report.bounty.payoutsByDifficulty.easy.merit + report.bounty.payoutsByDifficulty.easy.spiritStones;
    const hardSupportValue = report.bounty.payoutsByDifficulty.hard.merit + report.bounty.payoutsByDifficulty.hard.spiritStones;
    assert.ok(
      hardSupportValue >= easySupportValue * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.bountyHardSupportPayoutVsEasyMinRatio,
      `${report.cityId} hard bounty support payout should clearly exceed easy`,
    );

    const bountyGoldPerExpectedClaim =
      report.bounty.supportPayoutByExpectedBand.maxClaims.gold / Math.max(1, report.bounty.expectedClaimBand.maxClaims);
    const bountyGoldPerMinute = bountyGoldPerExpectedClaim / Math.max(1, targets.probeAssumptions.bountyClaimCadenceMinutesByCityIndex[report.bounty.cityIndex]);
    assert.ok(
      bountyGoldPerMinute <= active.outskirts.goldPerMinute * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.bountyGoldVsOutskirtsMaxShare,
      `${report.cityId} bounty gold should stay secondary to outskirts gold lane`,
    );

    for (const expedition of report.expeditions) {
      const shortRatio = expedition.durations.find((entry) => entry.durationId === 'short')?.equivalenceRatioVsRuin ?? 0;
      const mediumRatio = expedition.durations.find((entry) => entry.durationId === 'medium')?.equivalenceRatioVsRuin ?? 0;
      const longRatio = expedition.durations.find((entry) => entry.durationId === 'long')?.equivalenceRatioVsRuin ?? 0;

      assert.ok(Math.abs(shortRatio - 0.35) <= tolerance, `${report.cityId}/${expedition.expeditionTypeId} short ratio drifted`);
      assert.ok(Math.abs(mediumRatio - 0.75) <= tolerance, `${report.cityId}/${expedition.expeditionTypeId} medium ratio drifted`);
      assert.ok(Math.abs(longRatio - 1.25) <= tolerance, `${report.cityId}/${expedition.expeditionTypeId} long ratio drifted`);

      assert.ok(shortRatio < mediumRatio && mediumRatio < longRatio, `${report.cityId}/${expedition.expeditionTypeId} duration value ordering drifted`);
      assert.ok(longRatio < 1.5, `${report.cityId}/${expedition.expeditionTypeId} long ratio should remain supplemental/non-dominant`);
    }

    const averagedShort = average(report.expeditions.map((entry) => entry.durations.find((duration) => duration.durationId === 'short')?.equivalenceRatioVsRuin ?? 0));
    const averagedMedium = average(report.expeditions.map((entry) => entry.durations.find((duration) => duration.durationId === 'medium')?.equivalenceRatioVsRuin ?? 0));
    const averagedLong = average(report.expeditions.map((entry) => entry.durations.find((duration) => duration.durationId === 'long')?.equivalenceRatioVsRuin ?? 0));
    assert.ok(averagedShort < averagedMedium && averagedMedium < averagedLong, `${report.cityId} averaged expedition durations should be monotonic`);
  }
});
