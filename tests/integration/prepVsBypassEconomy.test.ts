import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildAllPrepVsBypassEconomyReports } from '../../src/systems/economy/prepVsBypassReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

test('prep-vs-bypass economics keeps bypass emergency-only and ratio bands locked', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const reports = buildAllPrepVsBypassEconomyReports(validated);
  assert.equal(reports.length, 5);

  for (const report of reports) {
    assert.equal(report.minimumRatioWithinBand, true, `gate ${report.gateIndex} minimum prep ratio drifted`);
    assert.equal(report.recommendedRatioWithinBand, true, `gate ${report.gateIndex} recommended prep ratio drifted`);
    assert.equal(report.failSafeExceedsMinimumUpper, true, `gate ${report.gateIndex} fail-safe should exceed minimum prep upper`);
    assert.equal(report.failSafeExceedsRecommendedUpper, true, `gate ${report.gateIndex} fail-safe should exceed recommended prep upper`);
    assert.equal(report.emergencyOnly, true, `gate ${report.gateIndex} bypass should remain emergency-only`);
  }
});
