import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = path.resolve(process.cwd(), 'tmp-tests', 'scripts', 'balanceRegressionReport.js');
const loader = '--loader=./scripts/relativeJsLoader.mjs';

test('balanceRegressionReport supports human, json, and section modes', () => {
  const human = spawnSync(process.execPath, [loader, script], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(human.status, 0, human.stderr);
  assert.match(human.stdout, /Balance Regression Report/);
  assert.match(human.stdout, /\[PASS\]|\[FAIL\]/);

  const json = spawnSync(process.execPath, [loader, script, '--json'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(json.status, 0, json.stderr);
  const parsed = JSON.parse(json.stdout) as { schemaVersion: number; sections: unknown[] };
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(Array.isArray(parsed.sections), true);

  const section = spawnSync(process.execPath, [loader, script, '--section=timing'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(section.status, 0, section.stderr);
  assert.match(section.stdout, /Timing/);

  const help = spawnSync(process.execPath, [loader, script, '--help'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage: balanceRegressionReport/);
});
