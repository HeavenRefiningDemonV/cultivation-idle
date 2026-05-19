import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { runBalanceTelemetryProbe } from '../helpers/telemetry/runBalanceTelemetryProbe.js';

const script = path.resolve(process.cwd(), 'tmp-tests', 'scripts', 'validateBalanceTelemetry.js');
const loader = '--loader=./scripts/relativeJsLoader.mjs';

test('validateBalanceTelemetry accepts valid input and rejects broken fixtures', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'balance-telemetry-'));
  const validPath = path.join(dir, 'valid.json');
  const invalidPath = path.join(dir, 'invalid.json');

  const valid = { balanceEvents: runBalanceTelemetryProbe().balanceEvents };
  writeFileSync(validPath, JSON.stringify(valid), 'utf8');
  writeFileSync(invalidPath, JSON.stringify({ balanceEvents: [] }), 'utf8');

  const ok = spawnSync(process.execPath, [loader, script, '--input', validPath], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /overall=PASS/);

  const broken = spawnSync(process.execPath, [loader, script, '--input', invalidPath], { cwd: process.cwd(), encoding: 'utf8' });
  assert.notEqual(broken.status, 0);
  assert.match(broken.stdout + broken.stderr, /missing family|overall=FAIL/);
});
