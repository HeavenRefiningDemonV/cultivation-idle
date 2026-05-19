import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { RELEASE_GATE_MANIFEST } from '../../src/services/diagnostics/release/releaseGateManifest.js';
import type { ReleaseGateReport } from '../../src/services/diagnostics/release/releaseGateTypes.js';

const runScript = (args: string[], env: NodeJS.ProcessEnv = {}) =>
  spawnSync(
    'node',
    ['--experimental-strip-types', 'scripts/release/buildReleaseHandoffBundle.ts', ...args],
    { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, ...env } },
  );

const mkStubReport = (releaseReady: boolean): ReleaseGateReport => ({
  schemaVersion: '7.6-release-gate',
  generatedAt: Date.now(),
  overallPass: releaseReady,
  cleanPass: releaseReady,
  releaseReady,
  unresolvedBlockerCount: releaseReady ? 0 : 1,
  acceptedWaiverCount: 0,
  unresolvedWaiverCandidateCount: 0,
  pendingManualCount: 0,
  checks: RELEASE_GATE_MANIFEST.map((entry) => ({
    checkId: entry.checkId,
    status: releaseReady ? 'pass' : entry.checkId === 'build_audit' ? 'fail' : 'pass',
    elapsedMs: 1,
    commandOrBuilder: 'stub',
    summary: 'stub',
    blockerCount: releaseReady ? 0 : entry.checkId === 'build_audit' ? 1 : 0,
    warningCount: 0,
    pendingManualCount: 0,
    findings: releaseReady
      ? []
      : [{
        findingId: 'build_audit_blocker',
        checkId: entry.checkId,
        title: 'blocker',
        message: 'blocker',
        severity: 'blocker',
        waivable: false,
        sourceKind: 'derived',
      }],
    evidence: [],
  })),
  knownIssueSummary: {
    openBlockers: releaseReady ? 0 : 1,
    acceptedWaivers: 0,
    postSemesterDebt: 0,
    resolved: 0,
    untrackedFindings: 0,
  },
  decisionSummary: {
    headline: releaseReady ? 'PASS' : 'NO_GO',
    rationale: releaseReady ? ['pass'] : ['no go'],
  },
  sliceSummary: {
    contentCapRealmId: 'spirit_severing',
    liveCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'],
    liveCityCount: 5,
    fakeCitySixDetected: false,
    deferredSystems: [],
  },
});

void test('--help and --dry-run work', () => {
  const help = runScript(['--help']);
  assert.equal(help.status, 0);
  assert.equal(help.stdout.includes('Usage: buildReleaseHandoffBundle'), true);

  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-handoff-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify(mkStubReport(true)), 'utf8');
  const dryRun = runScript(['--dry-run'], { RELEASE_HANDOFF_STUB_REPORT: stubPath });
  rmSync(tempDir, { recursive: true, force: true });
  assert.equal(dryRun.status, 0);
  assert.equal(dryRun.stdout.includes('decision=GO'), true);
  assert.equal(dryRun.stdout.includes('dry-run: no files written'), true);
});

void test('default mode writes expected docs and output lists paths', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-handoff-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify(mkStubReport(true)), 'utf8');

  const run = runScript([], { RELEASE_HANDOFF_STUB_REPORT: stubPath });
  assert.equal(run.status, 0);
  assert.equal(run.stdout.includes('decision=GO'), true);
  assert.equal(run.stdout.includes('go_no_go_checklist.md'), true);
  assert.equal(run.stdout.includes('signoff_sheet.md'), true);
  assert.equal(run.stdout.includes('release_handoff_bundle.md'), true);

  assert.equal(existsSync(path.resolve(process.cwd(), 'docs/release/go_no_go_checklist.md')), true);
  assert.equal(existsSync(path.resolve(process.cwd(), 'docs/release/signoff_sheet.md')), true);
  assert.equal(existsSync(path.resolve(process.cwd(), 'docs/release/release_handoff_bundle.md')), true);

  rmSync(tempDir, { recursive: true, force: true });
});

void test('--fail-on-blockers exits nonzero for synthetic no-go report', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-handoff-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify(mkStubReport(false)), 'utf8');

  const run = runScript(['--fail-on-blockers'], { RELEASE_HANDOFF_STUB_REPORT: stubPath });
  assert.equal(run.status, 2);
  assert.equal(run.stdout.includes('decision=NO_GO'), true);

  rmSync(tempDir, { recursive: true, force: true });
});
