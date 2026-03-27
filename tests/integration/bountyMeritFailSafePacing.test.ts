import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildAllSupportReservePacingReports } from '../../src/systems/economy/supportReservePacingReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';
import { assertBalanceMetric } from '../helpers/balance/assertBalanceMetric.js';

test('bounty merit fail-safe pacing keeps reserve route and fail-safe affordance stable', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const reports = buildAllSupportReservePacingReports(validated);

  for (const report of reports) {
    assertBalanceMetric('activities.bounty_support_primary', report.verdicts.reserveGapRoutesToBountiesFirst, `gate=${report.gateIndex}`);
    assertBalanceMetric('prep.route_first.reserve', report.verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats, `gate=${report.gateIndex}`);
    assertBalanceMetric('prep.route_first.reserve', report.verdicts.failSafeAffordableAfterHighBandPlusDefeats, `gate=${report.gateIndex}`);
  }
});
