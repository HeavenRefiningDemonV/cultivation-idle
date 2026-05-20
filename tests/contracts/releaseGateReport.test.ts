import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { RELEASE_GATE_MANIFEST } from '../../src/services/diagnostics/release/releaseGateManifest.js';
import { buildReleaseGateReport, writeKnownIssuesDoc } from '../../src/services/diagnostics/release/releaseGate.js';
import { runReleaseGateAdapter } from '../../src/services/diagnostics/release/releaseGateAdapters.js';
import type { ReleaseGateCheckId, ReleaseGateCheckResult } from '../../src/services/diagnostics/release/releaseGateTypes.js';

const stubResult = (checkId: ReleaseGateCheckId, status: ReleaseGateCheckResult['status']): Omit<ReleaseGateCheckResult, 'checkId' | 'elapsedMs'> => ({
  status,
  commandOrBuilder: 'stub',
  summary: `stub ${status}`,
  blockerCount: status === 'fail' ? 1 : 0,
  warningCount: status === 'warning' ? 1 : 0,
  pendingManualCount: status === 'pending_manual' ? 1 : 0,
  findings: status === 'fail'
    ? [{
      findingId: `${checkId}_stub_blocker`,
      checkId,
      title: 'stub_blocker',
      message: 'stub blocker',
      severity: 'blocker',
      waivable: false,
      sourceKind: 'derived',
    }]
    : status === 'warning'
      ? [{
        findingId: `${checkId}_stub_warning`,
        checkId,
        title: 'stub warning',
        message: 'stub warning',
        severity: 'waiver_candidate',
        waivable: true,
        sourceKind: 'derived',
      }]
      : [],
  evidence: [],
});

void test('release gate manifest order is stable', () => {
  const ordered = RELEASE_GATE_MANIFEST.map((entry) => entry.order);
  const sorted = [...ordered].sort((a, b) => a - b);
  assert.deepEqual(ordered, sorted);
});

void test('release gate aggregates blockers and pending manual as NO_GO', async () => {
  const report = await buildReleaseGateReport({
    adapterOverrides: {
      build_audit: async () => stubResult('build_audit', 'pass'),
      content_validation: async () => stubResult('content_validation', 'pass'),
      progression_contract: async () => stubResult('progression_contract', 'fail'),
      fresh_run_acceptance: async () => stubResult('fresh_run_acceptance', 'pending_manual'),
      migration_matrix: async () => stubResult('migration_matrix', 'pass'),
      balance_regression: async () => stubResult('balance_regression', 'pass'),
      route_comparison: async () => stubResult('route_comparison', 'pass'),
      runtime_diagnostics: async () => stubResult('runtime_diagnostics', 'pass'),
      vocabulary_audit: async () => stubResult('vocabulary_audit', 'pass'),
      full_test_suite: async () => stubResult('full_test_suite', 'pass'),
    },
  });
  assert.equal(report.releaseReady, false);
  assert.equal(report.decisionSummary.headline, 'NO_GO');
  assert.equal(report.unresolvedBlockerCount > 0, true);
});

void test('release gate can produce clean pass when no blockers/warnings remain', async () => {
  const overrides = Object.fromEntries(
    RELEASE_GATE_MANIFEST.map((entry) => [entry.checkId, async () => stubResult(entry.checkId, 'pass')]),
  ) as Record<ReleaseGateCheckId, () => Promise<Omit<ReleaseGateCheckResult, 'checkId' | 'elapsedMs'>>>;

  const report = await buildReleaseGateReport({ adapterOverrides: overrides });
  assert.equal(report.releaseReady, true);
  assert.equal(report.overallPass, true);
  assert.equal(report.cleanPass, true);
  assert.equal(report.decisionSummary.headline, 'PASS');
});

void test('release gate adapter parses JSON payload when npm banner noise is present', async () => {
  const result = await runReleaseGateAdapter('vocabulary_audit', {
    runCommand: () => ({
      exitCode: 0,
      stdout: [
        '> cultivation-idle@0.0.0 release:vocab-audit:json',
        '> npm run release:vocab-audit -- --json',
        '{"overallPass":true,"staleFindings":[],"placeholderFindings":[]}',
      ].join('\n'),
      stderr: '',
    }),
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.blockerCount, 0);
  assert.equal(result.warningCount, 0);
});

void test('runtime diagnostics adapter accepts expected-negative scenario classifications', async () => {
  const result = await runReleaseGateAdapter('runtime_diagnostics', {
    runCommand: () => ({
      exitCode: 0,
      stdout: JSON.stringify({
        scenarios: {
          clean_baseline: { scenarioStatus: 'PASS', errorCount: 0, warningCount: 0, releaseGateBlocking: false },
          seeded_runtime_residue: { scenarioStatus: 'EXPECTED_NEGATIVE_PASS', errorCount: 3, warningCount: 0, releaseGateBlocking: false },
          content_failure_snapshot: { scenarioStatus: 'EXPECTED_NEGATIVE_PASS', errorCount: 2, warningCount: 0, releaseGateBlocking: false },
        },
      }),
      stderr: '',
    }),
  });

  assert.equal(result.status, 'pass');
  assert.equal(result.blockerCount, 0);
});

void test('runtime diagnostics adapter blocks drifted scenario classifications', async () => {
  const result = await runReleaseGateAdapter('runtime_diagnostics', {
    runCommand: () => ({
      exitCode: 0,
      stdout: JSON.stringify({
        scenarios: {
          clean_baseline: { scenarioStatus: 'PASS', errorCount: 0, warningCount: 0, releaseGateBlocking: false },
          seeded_runtime_residue: { scenarioStatus: 'BLOCKER', errorCount: 4, warningCount: 0, releaseGateBlocking: true },
        },
      }),
      stderr: '',
    }),
  });

  assert.equal(result.status, 'fail');
  assert.equal(result.blockerCount, 1);
});

void test('route comparison adapter accepts string warnings without converting them to blockers', async () => {
  const result = await runReleaseGateAdapter('route_comparison', {
    runCommand: () => ({
      exitCode: 0,
      stdout: JSON.stringify({
        overallPass: true,
        finalTruthSummary: { noFakeCitySixAcrossRoutes: true },
        warnings: ['high_skill:timing_outside_locked_envelope'],
      }),
      stderr: '',
    }),
  });

  assert.equal(result.status, 'warning');
  assert.equal(result.blockerCount, 0);
  assert.equal(result.warningCount, 1);
  assert.equal(result.findings[0]?.message, 'high_skill:timing_outside_locked_envelope');
});

void test('known issues markdown classifies waivers/debt by matched ledger entries and keeps unmatched findings untracked', async () => {
  const overrides = Object.fromEntries(
    RELEASE_GATE_MANIFEST.map((entry) => [entry.checkId, async () => stubResult(entry.checkId, 'pass')]),
  ) as Record<ReleaseGateCheckId, () => Promise<Omit<ReleaseGateCheckResult, 'checkId' | 'elapsedMs'>>>;
  overrides.build_audit = async () => ({
    status: 'warning',
    commandOrBuilder: 'stub',
    summary: 'stub warning',
    blockerCount: 0,
    warningCount: 2,
    pendingManualCount: 0,
    findings: [
      {
        findingId: 'build_waiver_match',
        checkId: 'build_audit',
        title: 'http-proxy',
        message: 'http-proxy warning',
        severity: 'waiver_candidate',
        waivable: true,
        sourceKind: 'derived',
      },
      {
        findingId: 'build_waiver_untracked',
        checkId: 'build_audit',
        title: 'unknown_warning',
        message: 'unknown warning',
        severity: 'waiver_candidate',
        waivable: true,
        sourceKind: 'derived',
      },
    ],
    evidence: [],
  });
  overrides.progression_contract = async () => ({
    status: 'warning',
    commandOrBuilder: 'stub',
    summary: 'stub warning',
    blockerCount: 0,
    warningCount: 1,
    pendingManualCount: 0,
    findings: [
      {
        findingId: 'progression_debt_match',
        checkId: 'progression_contract',
        title: 'OFFLINE_PIPELINE_SPLIT',
        message: 'offline split warning',
        severity: 'post_semester_debt',
        waivable: true,
        sourceKind: 'derived',
      },
    ],
    evidence: [],
  });

  const report = await buildReleaseGateReport({ adapterOverrides: overrides });
  writeKnownIssuesDoc(report);

  const markdown = readFileSync(path.resolve(process.cwd(), 'docs/release/known_issues.md'), 'utf8');
  const acceptedSection = markdown.split('## Accepted waivers')[1]?.split('## Post-semester debt')[0] ?? '';
  const debtSection = markdown.split('## Post-semester debt')[1]?.split('## Untracked findings (must classify)')[0] ?? '';
  const untrackedSection = markdown.split('## Untracked findings (must classify)')[1]?.split('## Typed ledger entries')[0] ?? '';

  assert.equal(acceptedSection.includes('build_waiver_match'), true);
  assert.equal(acceptedSection.includes('build_waiver_untracked'), false);
  assert.equal(debtSection.includes('progression_debt_match'), true);
  assert.equal(untrackedSection.includes('build_waiver_untracked'), true);
});
