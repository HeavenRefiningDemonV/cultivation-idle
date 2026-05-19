import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildAllSupportReservePacingReports } from '../../src/systems/economy/supportReservePacingReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

test('support reserve pacing remains reachable on bounty route with claim-band pacing + eligible-defeat fallback', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const reports = buildAllSupportReservePacingReports(validated, { merit: 0, spiritStones: 0 });
  assert.equal(reports.length, 5);

  for (const report of reports) {
    assert.equal(report.failSafeThreshold, 3, `gate ${report.gateIndex} fail-safe threshold drifted`);
    assert.equal(report.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats, true, `gate ${report.gateIndex} low-band merit+defeats should reach minimum`);
    assert.equal(report.verdicts.reachesTargetMeritReserveWithHighBandPlusDefeats, true, `gate ${report.gateIndex} high-band merit+defeats should reach target`);
    assert.equal(report.verdicts.reachesFailSafeMeritCostWithHighBandPlusDefeats, true, `gate ${report.gateIndex} high-band merit+defeats should reach fail-safe merit cost`);
    assert.equal(report.verdicts.reserveGapRoutesToBountiesFirst, true, `gate ${report.gateIndex} reserve route should remain bounties-first`);
    assert.equal(report.blockers.length, 0, `gate ${report.gateIndex} should not report reserve pacing blockers`);
  }

  const gatesWithSpiritMinimum = reports.filter((entry) => entry.gateIndex >= 2);
  for (const report of gatesWithSpiritMinimum) {
    assert.equal(report.verdicts.reachesMinimumSpiritReserveWithHighBand, true, `gate ${report.gateIndex} high-band spirit should reach minimum reserve`);
    assert.ok(report.verdicts.spiritIdealProgressRatioAtHighBand >= 0.8, `gate ${report.gateIndex} high-band spirit ideal progress should meet target`);
  }
});
