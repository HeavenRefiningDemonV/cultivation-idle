import assert from 'node:assert/strict';
import test from 'node:test';
import { RELEASE_GATE_MANIFEST } from '../../src/services/diagnostics/release/releaseGateManifest.js';
import { KNOWN_ISSUES_LEDGER } from '../../src/services/diagnostics/release/knownIssuesLedger.js';
import { RELEASE_CHECKLIST_QUESTIONS, buildReleaseDecisionDocs } from '../../src/services/diagnostics/release/releaseDecisionDocs.js';
import type { ReleaseGateCheckResult, ReleaseGateReport } from '../../src/services/diagnostics/release/releaseGateTypes.js';

const mkCheck = (checkId: ReleaseGateCheckResult['checkId'], status: ReleaseGateCheckResult['status']): ReleaseGateCheckResult => ({
  checkId,
  status,
  elapsedMs: 1,
  commandOrBuilder: 'stub',
  summary: `stub ${status}`,
  blockerCount: status === 'fail' ? 1 : 0,
  warningCount: status === 'warning' ? 1 : 0,
  pendingManualCount: status === 'pending_manual' ? 1 : 0,
  findings: status === 'fail'
    ? [{ findingId: `${checkId}_block`, checkId, title: 'block', message: 'block', severity: 'blocker', waivable: false, sourceKind: 'derived' }]
    : [],
  evidence: [],
});

const mkReport = (overrides: Partial<ReleaseGateReport> = {}): ReleaseGateReport => ({
  schemaVersion: '7.6-release-gate',
  generatedAt: Date.now(),
  overallPass: true,
  cleanPass: true,
  releaseReady: true,
  unresolvedBlockerCount: 0,
  acceptedWaiverCount: 1,
  unresolvedWaiverCandidateCount: 0,
  pendingManualCount: 0,
  checks: RELEASE_GATE_MANIFEST.map((entry) => mkCheck(entry.checkId, 'pass')),
  knownIssueSummary: {
    openBlockers: 0,
    acceptedWaivers: 1,
    postSemesterDebt: 0,
    resolved: 0,
    untrackedFindings: 0,
  },
  decisionSummary: {
    headline: 'PASS_WITH_ACCEPTED_WAIVERS',
    rationale: ['1 accepted waiver active'],
  },
  sliceSummary: {
    contentCapRealmId: 'spirit_severing',
    liveCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
    liveCityCount: 5,
    fakeCitySixDetected: false,
    deferredSystems: [],
  },
  ...overrides,
});

void test('checklist includes required questions and maps to valid check ids', () => {
  const docs = buildReleaseDecisionDocs({ report: mkReport(), manifest: RELEASE_GATE_MANIFEST, ledger: KNOWN_ISSUES_LEDGER });
  const expectedIds = [
    'eng_build_green',
    'eng_content_validation',
    'eng_full_test_suite',
    'prog_contract_drift',
    'prog_fresh_run_completable',
    'prog_manual_coverage',
    'prog_migration_matrix',
    'balance_regression',
    'balance_route_truth',
    'runtime_diagnostics_zero_errors',
    'runtime_save_reload_safety',
    'runtime_load_failure_explicit',
    'copy_vocabulary_audit',
    'copy_surface_truth_coverage',
    'copy_visual_icon_consistency',
    'issues_nonpass_ledgered',
    'issues_waivers_policy',
  ];

  expectedIds.forEach((id) => assert.equal(docs.checklistRows.some((row) => row.checklistId === id), true));
  docs.checklistRows.forEach((row) => row.checkIds.forEach((id) => assert.equal(RELEASE_GATE_MANIFEST.some((entry) => entry.checkId === id), true)));
  assert.equal(RELEASE_CHECKLIST_QUESTIONS.length >= expectedIds.length, true);
});

void test('checklist status logic yields YES/NO/PENDING', () => {
  const noReport = mkReport({
    releaseReady: false,
    overallPass: false,
    unresolvedBlockerCount: 1,
    checks: RELEASE_GATE_MANIFEST.map((entry) => mkCheck(entry.checkId, entry.checkId === 'build_audit' ? 'fail' : 'pass')),
  });
  const pendingReport = mkReport({
    releaseReady: false,
    pendingManualCount: 1,
    checks: RELEASE_GATE_MANIFEST.map((entry) => mkCheck(entry.checkId, entry.checkId === 'fresh_run_acceptance' ? 'pending_manual' : 'pass')),
  });

  const noDocs = buildReleaseDecisionDocs({ report: noReport, manifest: RELEASE_GATE_MANIFEST, ledger: KNOWN_ISSUES_LEDGER });
  const pendingDocs = buildReleaseDecisionDocs({ report: pendingReport, manifest: RELEASE_GATE_MANIFEST, ledger: KNOWN_ISSUES_LEDGER });

  assert.equal(noDocs.checklistRows.find((row) => row.checklistId === 'eng_build_green')?.status, 'NO');
  assert.equal(pendingDocs.checklistRows.find((row) => row.checklistId === 'prog_manual_coverage')?.status, 'PENDING');
  assert.equal(noDocs.checklistRows.find((row) => row.checklistId === 'issues_waivers_policy')?.status, 'YES');
});

void test('sign-off renders binary GO/NO_GO and separate waiver/blocker sections', () => {
  const goDocs = buildReleaseDecisionDocs({ report: mkReport(), manifest: RELEASE_GATE_MANIFEST, ledger: KNOWN_ISSUES_LEDGER });
  const noGoDocs = buildReleaseDecisionDocs({
    report: mkReport({
      releaseReady: false,
      overallPass: false,
      decisionSummary: { headline: 'NO_GO', rationale: ['1 unresolved blocker remain'] },
      unresolvedBlockerCount: 1,
      checks: RELEASE_GATE_MANIFEST.map((entry) => mkCheck(entry.checkId, entry.checkId === 'runtime_diagnostics' ? 'fail' : 'pass')),
    }),
    manifest: RELEASE_GATE_MANIFEST,
    ledger: KNOWN_ISSUES_LEDGER,
  });

  assert.equal(goDocs.signoffMarkdown.includes('RELEASE DECISION: GO'), true);
  assert.equal(noGoDocs.signoffMarkdown.includes('RELEASE DECISION: NO_GO'), true);
  assert.equal(goDocs.signoffMarkdown.includes('### Accepted waivers'), true);
  assert.equal(goDocs.signoffMarkdown.includes('### Unresolved blockers'), true);
});

void test('handoff bundle includes command/doc/source map and known-issues snapshot without generic placeholders', () => {
  const docs = buildReleaseDecisionDocs({ report: mkReport(), manifest: RELEASE_GATE_MANIFEST, ledger: KNOWN_ISSUES_LEDGER });
  assert.equal(docs.handoffMarkdown.includes('## Command map'), true);
  assert.equal(docs.handoffMarkdown.includes('npm run release:gate'), true);
  assert.equal(docs.handoffMarkdown.includes('## Evidence/doc map'), true);
  assert.equal(docs.handoffMarkdown.includes('docs/release/known_issues.md'), true);
  assert.equal(docs.handoffMarkdown.includes('## Report/source map'), true);
  assert.equal(docs.handoffMarkdown.includes('## Known issues snapshot'), true);
  assert.equal(docs.handoffMarkdown.includes('content cap realm'), true);
  assert.equal(docs.handoffMarkdown.toLowerCase().includes('tbd'), false);
});
