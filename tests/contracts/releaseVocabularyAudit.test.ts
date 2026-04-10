import assert from 'node:assert/strict';
import test from 'node:test';
import { runVocabularyAudit, renderVocabularyAuditReport } from '../../src/services/diagnostics/release/vocabularyAudit.js';
import { LIVE_SURFACE_MANIFEST } from '../../src/services/diagnostics/release/liveSurfaceManifest.js';

void test('vocabulary audit report shape is stable and tracked scope has no duplicates', () => {
  const report = runVocabularyAudit();

  assert.equal(report.schemaVersion, '7.5b-vocabulary-audit');
  assert.equal(Array.isArray(report.canonicalTerms), true);
  assert.equal(Array.isArray(report.staleFindings), true);
  assert.equal(Array.isArray(report.placeholderFindings), true);

  const uniqueFiles = new Set(report.trackedFiles);
  assert.equal(uniqueFiles.size, report.trackedFiles.length);

  const uniqueSurfaces = new Set(LIVE_SURFACE_MANIFEST.trackedSurfaceIds);
  assert.equal(uniqueSurfaces.size, LIVE_SURFACE_MANIFEST.trackedSurfaceIds.length);

  assert.equal(Boolean(report.replacementMap.Embermist), true);
  assert.equal(Boolean(report.replacementMap['Not implemented yet']), true);
});

void test('vocabulary audit renderers support stable human and json modes', () => {
  const report = runVocabularyAudit();
  const human = renderVocabularyAuditReport(report);
  const json = JSON.stringify(report, null, 2);

  assert.equal(human.includes('Release Vocabulary Audit'), true);
  assert.equal(human.includes('Replacement map:'), true);
  assert.equal(json.includes('"schemaVersion": "7.5b-vocabulary-audit"'), true);
});

void test('canonical terms and stale findings remain distinct lists', () => {
  const report = runVocabularyAudit();
  const canonicalSet = new Set(report.canonicalTerms.map((entry) => entry.toLowerCase()));

  report.staleFindings.forEach((finding) => {
    assert.equal(canonicalSet.has(finding.term.toLowerCase()), false);
  });
});
