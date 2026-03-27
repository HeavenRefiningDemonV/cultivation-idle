import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBalanceRegressionReport,
  renderBalanceRegressionReport,
  serializeBalanceRegressionReport,
} from '../../src/systems/balance/balanceRegressionReport.js';
import type { BalanceRegressionSuiteResult } from '../helpers/balance/runBalanceRegressionSuite.js';

const fixture: BalanceRegressionSuiteResult = {
  suiteVersion: '6.9c',
  overallPass: false,
  hardFailureCount: 1,
  warningCount: 0,
  generatedAt: 123,
  metrics: [
    {
      metricId: 'timing.gate_1_available',
      label: 'Gate 1 availability window',
      sectionId: 'timing',
      comparator: 'between',
      actual: 2200,
      target: { min: 1800, max: 3300 },
      passed: true,
    },
    {
      metricId: 'combat.gate_5.recommended.win_rate',
      label: 'Gate 5 recommended win-rate',
      sectionId: 'combat',
      comparator: 'between',
      actual: 0.6,
      target: { min: 0.68, max: 0.82 },
      passed: false,
      notes: 'under floor',
    },
  ],
};

test('buildBalanceRegressionReport returns stable envelope + ordering', () => {
  const report = buildBalanceRegressionReport(fixture, { createdAt: 999 });
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.createdAt, 999);
  assert.equal(report.sections[0]?.sectionId, 'timing');
  assert.equal(report.sections.at(-1)?.sectionId, 'telemetry');

  const combat = report.sections.find((section) => section.sectionId === 'combat');
  assert.ok(combat);
  assert.equal(combat!.failingMetricCount, 1);
  assert.equal(combat!.metrics[0]?.actual, 0.6);
});

test('render + serialize output is deterministic and compact', () => {
  const report = buildBalanceRegressionReport(fixture, { createdAt: 999 });
  const rendered = renderBalanceRegressionReport(report);
  assert.match(rendered, /Balance Regression Report/);
  assert.match(rendered, /\[FAIL\] Combat/);
  assert.match(rendered, /combat\.gate_5\.recommended\.win_rate/);

  const json = serializeBalanceRegressionReport(report);
  const parsed = JSON.parse(json) as { overallPass: boolean; sections: Array<{ sectionId: string }> };
  assert.equal(parsed.overallPass, false);
  assert.equal(parsed.sections[0]?.sectionId, 'timing');
});
