import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const listScript = path.resolve(process.cwd(), 'tmp-progression-fixtures', 'scripts', 'listProgressionFixtures.js');
const validateScript = path.resolve(process.cwd(), 'tmp-progression-fixtures', 'scripts', 'validateProgressionFixtures.js');

test('fixture listing script supports human and JSON output', () => {
  const human = spawnSync(process.execPath, [listScript, '--packet=1.3'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(human.status, 0, human.stderr);
  assert.match(human.stdout, /gate-edge-pre-first/);

  const json = spawnSync(process.execPath, [listScript, '--tag=legacy', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(json.status, 0, json.stderr);
  const parsed = JSON.parse(json.stdout) as Array<{ id: string }>;
  assert.equal(parsed.some((entry) => entry.id === 'legacy-offline-split'), true);
});

test('fixture validation script emits matrix output and exits cleanly', () => {
  const proc = spawnSync(process.execPath, [validateScript, '--matrix'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(proc.status, 0, proc.stderr);
  assert.match(proc.stdout, /Progression Fixture Validation Matrix/);
  assert.match(proc.stdout, /fresh-save/);
});
