import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBalanceTelemetryCsvFiles,
  buildBalanceTelemetryExportEnvelope,
  buildBalanceTelemetryReport,
} from '../../src/services/diagnostics/balanceTelemetryExport.js';
import type { BalanceTelemetryEvent } from '../../src/services/diagnostics/balanceTelemetrySchema.js';

const fixture: BalanceTelemetryEvent[] = [
  { schemaVersion: 1, eventId: '1', emittedAt: 1000, family: 'progression', name: 'life_started', kind: 'progression/life_started', lifeId: 'L1', lifeOrdinal: 1, sessionKind: 'first_life', payload: { trigger: 'fresh_start', runStartTime: 1000 } },
  { schemaVersion: 1, eventId: '2', emittedAt: 5000, family: 'progression', name: 'gate_available', kind: 'progression/gate_available', lifeId: 'L1', lifeOrdinal: 1, sessionKind: 'first_life', payload: { trialId: 't1', gateIndex: 1, fromRealmId: 'r1', toRealmId: 'r2' } },
  { schemaVersion: 1, eventId: '3', emittedAt: 6000, family: 'trials', name: 'attempt_resolved', kind: 'trials/attempt_resolved', lifeId: 'L1', lifeOrdinal: 1, sessionKind: 'first_life', payload: { trialId: 't1', gateIndex: 1, attemptId: 'a1', outcome: 'cleared', durationSec: 10, countsTowardFailSafe: true } },
  { schemaVersion: 1, eventId: '4', emittedAt: 7000, family: 'economy', name: 'currency_earned', kind: 'economy/currency_earned', lifeId: 'L1', lifeOrdinal: 1, sessionKind: 'first_life', payload: { reason: 'Gate Trial clear', sourceKind: 'trial_clear', currencies: { merit: '15' } } },
  { schemaVersion: 1, eventId: '5', emittedAt: 9000, family: 'offline', name: 'applied', kind: 'offline/applied', lifeId: 'L1', lifeOrdinal: 1, sessionKind: 'first_life', payload: { rawOfflineSeconds: 120, effectiveOfflineSeconds: 120, effectiveEfficiency: 0.75, wasCapped: false, qiGained: '20', queuedActionsReady: 1, expeditionsReady: 0 } },
];

test('balance telemetry export envelope and report shape are stable', () => {
  const envelope = buildBalanceTelemetryExportEnvelope({ events: fixture, balanceCaptureEnabled: true, maxBalanceEvents: 5000, exportedAt: 10000 });
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.eventCount, fixture.length);
  assert.ok(envelope.summary.global.lifeCount >= 1);
});

test('balance telemetry csv builders return expected files and stable headers', () => {
  const csv = buildBalanceTelemetryCsvFiles(fixture);
  const names = Object.keys(csv).sort();
  assert.deepEqual(names, ['balance_economy.csv','balance_events.csv','balance_gates.csv','balance_lives.csv','balance_prestige.csv','balance_support.csv']);
  assert.equal(csv['balance_events.csv'].split('\n')[0], 'eventId,emittedAt,kind,lifeId,lifeOrdinal,sessionKind,realmId,realmIndex,cityId');
});

test('report derives core KPI sections from typed events', () => {
  const report = buildBalanceTelemetryReport(fixture);
  assert.equal(report.global.eventCount, fixture.length);
  assert.equal(report.gates[0]?.attempts, 1);
  assert.equal(report.economy.earnedBySource.trial_clear.merit, 15);
  assert.equal(report.offline.totalOfflineSeconds, 120);
});
