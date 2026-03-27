import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBalanceRegressionReport,
  renderBalanceRegressionReport,
  serializeBalanceRegressionReport,
} from '../../src/systems/balance/balanceRegressionReport.js';
import { runCanonicalBalanceRegressionSuite } from '../helpers/balance/runBalanceRegressionSuite.js';

test('balance regression flow keeps suite/report/json outputs aligned', async () => {
  const suite = await runCanonicalBalanceRegressionSuite();
  const report = buildBalanceRegressionReport(suite);

  assert.equal(report.sections.length, 7);
  assert.equal(report.sections.map((section) => section.sectionId).join(','), 'timing,activities,prep,combat,offline,prestige,telemetry');
  assert.equal(report.overallPass, suite.overallPass);

  const rendered = renderBalanceRegressionReport(report);
  assert.match(rendered, /Balance Regression Report/);
  assert.match(rendered, /Timing/);
  assert.match(rendered, /Telemetry/);

  const parsed = JSON.parse(serializeBalanceRegressionReport(report)) as { sections: Array<{ metrics: unknown[] }> };
  assert.equal(parsed.sections.length, 7);
  assert.equal(parsed.sections.every((section) => Array.isArray(section.metrics)), true);
});
