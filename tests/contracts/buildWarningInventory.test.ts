import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBuildAuditReport,
  parseBuildAuditOutput,
  renderBuildAuditReport,
} from '../../src/services/diagnostics/release/buildAuditReport.js';

test('build warning parser captures blocker + warning and dedupes repeats', () => {
  const sample = [
    '[vite] Internal server error: Transform failed with 1 error:',
    'src/components/screens/SettingsScreen.tsx:123:4: ERROR: Unexpected token',
    'npm warn Unknown env config "http-proxy".',
    'npm warn Unknown env config "http-proxy".',
  ].join('\n');

  const entries = parseBuildAuditOutput(sample);
  const blockers = entries.filter((entry) => entry.level === 'blocker');
  const warnings = entries.filter((entry) => entry.level === 'warning');

  assert.equal(blockers.length >= 1, true);
  assert.equal(warnings.length >= 1, true);
  assert.equal(entries.filter((entry) => entry.rawExcerpt.includes('http-proxy')).length, 1);
});

test('build audit report + renderer keep stable release fields', () => {
  const report = buildBuildAuditReport({
    output: 'warning: sample warning\nerror: sample blocker',
    buildPassed: false,
  });

  assert.equal(report.schemaVersion, '7.4a');
  assert.equal(typeof report.generatedAt, 'number');
  assert.equal(typeof report.groupedCounts.vite.warning, 'number');
  assert.equal(report.blockerCount >= 1, true);

  const rendered = renderBuildAuditReport(report);
  assert.equal(rendered.includes('Build Warning Inventory'), true);
  assert.equal(rendered.includes('disposition='), true);
});

test('build warning inventory doc vocabulary remains stable', () => {
  const report = buildBuildAuditReport({
    output: 'warning: sample warning\\nerror: sample blocker',
    buildPassed: false,
  });
  const dispositions = new Set(report.entries.map((entry) => entry.disposition));
  assert.equal(dispositions.size >= 1, true);
  dispositions.forEach((entry) => {
    assert.equal(['fix_now', 'acceptable_for_semester_rc', 'post_semester_debt'].includes(entry), true);
  });
});
