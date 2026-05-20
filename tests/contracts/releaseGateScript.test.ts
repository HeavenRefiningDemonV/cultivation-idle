import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const runScript = (args: string[], env: NodeJS.ProcessEnv = {}) =>
  spawnSync(
    'node',
    ['--loader=./scripts/relativeJsLoader.mjs', '--experimental-strip-types', 'scripts/release/runReleaseGate.ts', ...args],
    { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, ...env } },
  );

void test('release gate script supports --help and --json', () => {
  const help = runScript(['--help']);
  assert.equal(help.status, 0);
  assert.equal(help.stdout.includes('Usage: runReleaseGate'), true);

  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-gate-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify({ build_audit: { status: 'pass' } }), 'utf8');
  const json = runScript(['--json', '--only=build_audit'], { RELEASE_GATE_STUB_RESULTS: stubPath });
  rmSync(tempDir, { recursive: true, force: true });
  assert.equal(json.status, 0);
  assert.equal(json.stdout.includes('"schemaVersion": "7.6-release-gate"'), true);
});

void test('release gate script supports --only/--skip and fail-on-blockers', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-gate-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify({ build_audit: { status: 'fail' }, content_validation: { status: 'pass' } }), 'utf8');

  const only = runScript(['--json', '--only=build_audit,content_validation', '--skip=content_validation'], {
    RELEASE_GATE_STUB_RESULTS: stubPath,
  });
  assert.equal(only.status, 0);
  assert.equal(only.stdout.includes('"checkId": "build_audit"'), true);
  assert.equal(only.stdout.includes('"checkId": "content_validation"'), true);
  assert.equal(only.stdout.includes('"status": "skipped"'), true);

  const failOnBlockers = runScript(['--only=build_audit', '--fail-on-blockers'], {
    RELEASE_GATE_STUB_RESULTS: stubPath,
  });
  assert.equal(failOnBlockers.status, 2);

  rmSync(tempDir, { recursive: true, force: true });
});

void test('release gate script can write known issues markdown', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'release-gate-stub-'));
  const stubPath = path.join(tempDir, 'stub.json');
  writeFileSync(stubPath, JSON.stringify({ build_audit: { status: 'pass' } }), 'utf8');
  const result = runScript(['--only=build_audit', '--write-known-issues'], { RELEASE_GATE_STUB_RESULTS: stubPath });
  assert.equal(result.status, 0);
  const knownIssues = readFileSync(path.resolve(process.cwd(), 'docs/release/known_issues.md'), 'utf8');
  assert.equal(knownIssues.includes('Known Issues Ledger'), true);
  rmSync(tempDir, { recursive: true, force: true });
});
