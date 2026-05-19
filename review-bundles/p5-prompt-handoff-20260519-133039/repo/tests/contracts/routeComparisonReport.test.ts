import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRouteComparisonReport,
  renderRouteComparisonReport,
  serializeRouteComparisonReport,
} from '../../src/services/diagnostics/release/routeComparisonReport.js';

test('route comparison report aggregates all packet-7.3 routes with stable shape', async () => {
  const report = await buildRouteComparisonReport();

  assert.equal(report.schemaVersion, '7.3f');
  assert.equal(typeof report.generatedAt, 'number');
  assert.equal(report.baselineKind.length > 0, true);

  const routeIds = report.routeSummaries.map((row) => row.routeId).sort();
  assert.deepEqual(routeIds, ['fail_safe', 'high_skill', 'low_attention', 'offline_heavy', 'reclaim']);

  assert.equal(Array.isArray(report.comparisonRows), true);
  assert.equal(Array.isArray(report.blockers), true);
  assert.equal(Array.isArray(report.warnings), true);
  assert.equal(Array.isArray(report.exploitWatchlist), true);

  assert.equal(typeof report.finalTruthSummary.failSafeEmergencyOnly, 'boolean');
  assert.equal(typeof report.finalTruthSummary.offlineMeaningfulButBounded, 'boolean');
  assert.equal(typeof report.finalTruthSummary.lowAttentionViable, 'boolean');
  assert.equal(typeof report.finalTruthSummary.highSkillRewardedWithoutDominance, 'boolean');
  assert.equal(typeof report.finalTruthSummary.reclaimMateriallyFaster, 'boolean');
  assert.equal(typeof report.finalTruthSummary.noFakeCitySixAcrossRoutes, 'boolean');

  const rendered = renderRouteComparisonReport(report);
  assert.equal(rendered.includes('Route Summaries:'), true);
  assert.equal(rendered.includes('Final Truth Summary:'), true);

  const json = serializeRouteComparisonReport(report);
  const parsed = JSON.parse(json) as typeof report;
  assert.equal(parsed.schemaVersion, '7.3f');
  assert.equal(parsed.routeSummaries.length, 5);
});
