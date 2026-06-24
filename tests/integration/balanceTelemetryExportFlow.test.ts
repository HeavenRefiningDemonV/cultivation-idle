import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from '../helpers/telemetry/createBalanceTelemetryHarness.js';
import {
  buildBalanceTelemetryCsvFiles,
  buildBalanceTelemetryExportEnvelope,
  summarizeBalanceTelemetryReport,
} from '../../src/services/diagnostics/balanceTelemetryExport.js';

test('runtime balance telemetry can be exported and consumed by cli', () => {
  const harness = createBalanceTelemetryHarness();
  const now = Date.now();
  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: now, runStartTime: now - 1000, elapsedMsSinceLifeStart: 1000, trigger: 'fresh_start' } });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { timestamp: now, trialId: 't1', gateIndex: 1, attemptId: 'a1', outcome: 'defeated', durationSec: 15, countsTowardFailSafe: true } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '20' }, reason: 'gate_fail_safe:t1' } });
  GameEvents.emit({ type: 'prestige/performed', payload: { timestamp: now + 10, apGained: 5, totalAPAfter: 5, realmReached: 2, resolvedGateCount: 1, timeSpentSec: 120 } });
  GameEvents.emit({ type: 'offline/applied', payload: { timestamp: now + 20, rawOfflineSeconds: 60, effectiveOfflineSeconds: 60, effectiveEfficiency: 0.8, wasCapped: false, qiGained: '10', queuedActionsReady: 1, expeditionsReady: 0 } });

  const events = harness.balanceEvents;
  const envelope = buildBalanceTelemetryExportEnvelope({ events, balanceCaptureEnabled: true, maxBalanceEvents: 5000 });
  const csv = buildBalanceTelemetryCsvFiles(events);
  const textSummary = summarizeBalanceTelemetryReport(envelope.summary);
  assert.equal(csv['balance_events.csv'].length > 0, true);
  assert.equal(textSummary.length > 0, true);

  const tempDir = mkdtempSync(join(tmpdir(), 'bal-telemetry-'));
  const inputFile = join(tempDir, 'input.json');
  writeFileSync(inputFile, JSON.stringify(envelope, null, 2));

  const exportResult = spawnSync('node', ['--loader=./scripts/relativeJsLoader.mjs', '--experimental-strip-types', 'scripts/exportBalanceTelemetry.ts', '--input', inputFile, '--out-dir', tempDir], { encoding: 'utf8' });
  assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
  assert.equal(existsSync(join(tempDir, 'balance_events.csv')), true);

  const summaryResult = spawnSync('node', ['--loader=./scripts/relativeJsLoader.mjs', '--experimental-strip-types', 'scripts/summarizeBalanceTelemetry.ts', '--input', inputFile], { encoding: 'utf8' });
  assert.equal(summaryResult.status, 0, summaryResult.stderr || summaryResult.stdout);
  assert.equal(readFileSync(join(tempDir, 'balance_summary.txt'), 'utf8').length > 0, true);
  assert.equal(summaryResult.stdout.trim().length > 0, true);
});
