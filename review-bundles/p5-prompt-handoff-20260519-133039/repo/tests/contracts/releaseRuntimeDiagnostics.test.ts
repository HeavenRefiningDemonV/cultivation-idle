import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDiagnosticsBundle } from '../../src/services/diagnostics/buildDiagnosticsBundle.js';
import { buildRuntimeDiagnosticsReport, renderRuntimeDiagnosticsReport } from '../../src/services/diagnostics/release/runtimeDiagnosticsReport.js';

test('runtime diagnostics report has grouped sections and safe-repair visibility', () => {
  const report = buildRuntimeDiagnosticsReport();

  assert.equal(report.schemaVersion, '7.4c');
  assert.equal(typeof report.generatedAt, 'number');
  assert.equal(Array.isArray(report.groupedSections), true);
  assert.equal(typeof report.repairableCount, 'number');
  assert.equal(typeof report.nonRepairableCount, 'number');

  const rendered = renderRuntimeDiagnosticsReport(report);
  assert.equal(rendered.includes('Sections:'), true);
  assert.equal(rendered.includes('repairable'), true);
});

test('buildDiagnosticsBundle remains compatible and includes enriched validation summary', () => {
  const bundle = buildDiagnosticsBundle();

  assert.equal(bundle.schemaVersion, 1);
  assert.equal(Array.isArray(bundle.validation.issues), true);
  assert.equal(Array.isArray(bundle.validation.groupedSummary), true);
  assert.equal(typeof bundle.validation.repairableCount, 'number');
  assert.equal(typeof bundle.validation.nonRepairableCount, 'number');
  assert.equal('lastLoadFailure' in bundle.save, true);
});
