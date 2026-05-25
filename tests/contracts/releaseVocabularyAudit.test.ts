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
  assert.equal(report.daoMandateV2.schemaVersion, 'status-v3-dao-decommission-vocabulary-audit');
  assert.equal(Array.isArray(report.daoMandateV2.matches), true);
  assert.equal(Array.isArray(report.daoMandateV2.publicActiveRoots), true);
  assert.equal(Array.isArray(report.daoMandateV2.internalAllowlist), true);
  assert.equal(typeof report.daoMandateV2.blockerCount, 'number');
  assert.equal(typeof report.daoMandateV2.summaryByClassification, 'object');

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
  assert.equal(human.includes('Status V3 public Dao/Omen decommission vocabulary'), true);
  assert.equal(human.includes('daoMandateV2Blockers'), true);
  assert.equal(human.includes('Replacement map:'), true);
  assert.equal(json.includes('"schemaVersion": "7.5b-vocabulary-audit"'), true);
  assert.equal(json.includes('"schemaVersion": "status-v3-dao-decommission-vocabulary-audit"'), true);
});

void test('canonical terms and stale findings remain distinct lists', () => {
  const report = runVocabularyAudit();
  const canonicalSet = new Set(report.canonicalTerms.map((entry) => entry.toLowerCase()));

  report.staleFindings.forEach((finding) => {
    assert.equal(canonicalSet.has(finding.term.toLowerCase()), false);
  });
});

void test('Status V3 vocabulary audit blocks reachable public old Dao/Omen labels', () => {
  const report = runVocabularyAudit({
    publicActiveRoots: ['src/components/screens'],
    internalAllowlist: [],
    files: [
      {
        path: 'src/components/screens/FakeStatusScreen.tsx',
        text: 'export function FakeStatusScreen() { return <span>Current Omen</span>; }',
      },
    ],
  });

  assert.equal(report.daoMandateV2.overallPass, false);
  assert.equal(report.overallPass, false);
  assert.equal(report.daoMandateV2.blockerCount, 1);
  assert.equal(report.daoMandateV2.matches[0]?.classification, 'reachable_public_ui');
  assert.equal(report.daoMandateV2.matches[0]?.normalizedTerm, 'Current Omen');
});

void test('Status V3 vocabulary audit does not forbid concrete Status Ledger labels globally', () => {
  const report = runVocabularyAudit({
    publicActiveRoots: ['src/components/screens'],
    internalAllowlist: [],
    files: [
      {
        path: 'src/components/screens/FakeStatusScreen.tsx',
        text: [
          'Mission Requirements',
          'Current Bottleneck',
          'Best Improvements',
          'Forge Floor',
          'Healing Reserve',
          'Doctrine Stock',
          'Expedition Support',
          'Item Ledger',
          'Return Report',
        ].join(' | '),
      },
    ],
  });

  assert.equal(report.daoMandateV2.blockerCount, 0);
  assert.equal(report.daoMandateV2.matches.length, 0);
});

void test('Status V3 vocabulary audit treats retired Status V2 surface as internal after Packet C', () => {
  const report = runVocabularyAudit();
  const retiredStatusBlockers = report.daoMandateV2.matches.filter(
    (finding) => finding.severity === 'blocker' && finding.file === 'src/systems/ui/status/statusV2Surface.ts',
  );

  assert.deepEqual(retiredStatusBlockers, []);
});

void test('Dao Mandate V2 vocabulary audit allows test guards and historical evidence docs', () => {
  const report = runVocabularyAudit({
    files: [
      {
        path: 'tests/contracts/fakeVocabularyGuard.test.ts',
        text: "assert.doesNotMatch(source, /Primary Route/);",
      },
      {
        path: 'docs/release/fake_v2_evidence.md',
        text: 'Primary Route was removed from default Status.',
      },
    ],
  });

  assert.equal(report.daoMandateV2.overallPass, true);
  assert.equal(report.daoMandateV2.blockerCount, 0);
  assert.deepEqual(
    report.daoMandateV2.matches.map((finding) => finding.classification).sort(),
    ['historical_doc', 'test_guard'],
  );
});

void test('Dao Mandate V2 vocabulary audit allows internal raw route truth', () => {
  const report = runVocabularyAudit({
    files: [
      {
        path: 'src/systems/ui/runCompass/buildRunCompassSurfaceV2.ts',
        text: "const label = 'Current Omen'; export const primaryRoute = { label };",
      },
    ],
  });

  assert.equal(report.daoMandateV2.overallPass, true);
  assert.equal(report.daoMandateV2.blockerCount, 0);
  assert.equal(report.daoMandateV2.matches[0]?.classification, 'internal_adapter');
  assert.equal(report.daoMandateV2.matches[0]?.severity, 'allowed');
});
