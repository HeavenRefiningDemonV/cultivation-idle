import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const fixtureOutputRoot = path.resolve(process.cwd(), '.tmp', 'progression-fixtures');
const listScript = path.join(fixtureOutputRoot, 'scripts', 'listProgressionFixtures.js');
const validateScript = path.join(fixtureOutputRoot, 'scripts', 'validateProgressionFixtures.js');

test('progression fixture output avoids the tracked legacy temp tree', () => {
  const tsconfig = JSON.parse(readFileSync(path.resolve(process.cwd(), 'tsconfig.progression-fixtures.json'), 'utf8')) as {
    compilerOptions?: { outDir?: string };
  };
  const pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert.equal(tsconfig.compilerOptions?.outDir, './.tmp/progression-fixtures');
  assert.match(pkg.scripts?.['build:progression-fixtures'] ?? '', /tsconfig\.progression-fixtures\.json/);
  assert.match(pkg.scripts?.['progression:fixtures'] ?? '', /\.tmp\/progression-fixtures\/scripts\/listProgressionFixtures\.js/);
  assert.match(pkg.scripts?.['validate:progression-fixtures'] ?? '', /\.tmp\/progression-fixtures\/scripts\/validateProgressionFixtures\.js/);
  assert.match(pkg.scripts?.['progression:matrix'] ?? '', /\.tmp\/progression-fixtures\/scripts\/validateProgressionFixtures\.js --matrix/);
  assert.match(pkg.scripts?.['test:progression-fixtures'] ?? '', /\.tmp\/progression-fixtures\/tests\/contracts\/\*\.js/);
});

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
