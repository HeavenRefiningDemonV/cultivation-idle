import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = path.resolve(process.cwd(), 'tmp-tests', 'scripts', 'saveMigrationDryRun.js');

test('dry-run CLI works on fixture input with human-readable output', () => {
  const proc = spawnSync(process.execPath, [scriptPath, '--fixture=legacy-unversioned-save'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(proc.status, 0, proc.stderr);
  assert.match(proc.stdout, /Save Migration Dry Run/);
  assert.match(proc.stdout, /Source version/);
});

test('dry-run CLI JSON mode emits machine-readable report', () => {
  const proc = spawnSync(
    process.execPath,
    [scriptPath, '--fixture=current-save', '--json'],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.equal(proc.status, 0, proc.stderr);
  const parsed = JSON.parse(proc.stdout) as { sourceVersion: string; mode: string; stepResults: unknown[] };
  assert.equal(parsed.mode, 'dry-run');
  assert.ok(Array.isArray(parsed.stepResults));
});
