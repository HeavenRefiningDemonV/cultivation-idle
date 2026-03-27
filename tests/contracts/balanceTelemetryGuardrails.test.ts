import assert from 'node:assert/strict';
import test from 'node:test';

import { initializeTelemetry } from '../../src/services/diagnostics/initializeTelemetry.js';
import { GameEvents } from '../../src/services/events/GameEvents.js';
import { useTelemetryStore } from '../../src/stores/telemetryStore.js';
import { SaveService } from '../../src/services/save/SaveService.js';

test('balance ring clamps to configured max and hard cap', () => {
  const store = useTelemetryStore.getState();
  store.clearBalanceEvents();
  store.setMaxBalanceEvents(100);
  for (let i = 0; i < 150; i += 1) {
    store.addBalanceEvent({ ts: i, kind: 'progression/life_started', summary: 'x', payload: { schemaVersion: 1, eventId: `${i}`, emittedAt: i, family: 'progression', name: 'life_started', kind: 'progression/life_started', payload: { trigger: 'other', runStartTime: i } } as any });
  }
  assert.equal(useTelemetryStore.getState().balanceEvents.length, 100);
  store.setMaxBalanceEvents(50000);
  assert.equal(useTelemetryStore.getState().maxBalanceEvents <= 20000, true);
});

test('capture disabled is fast no-op for balance appends', () => {
  const store = useTelemetryStore.getState();
  store.clearBalanceEvents();
  store.setBalanceCaptureEnabled(false);
  store.addBalanceEvent({ ts: Date.now(), kind: 'progression/life_started', summary: 'x', payload: { schemaVersion: 1, eventId: 'nope', emittedAt: Date.now(), family: 'progression', name: 'life_started', kind: 'progression/life_started', payload: { trigger: 'other', runStartTime: Date.now() } } as any });
  assert.equal(useTelemetryStore.getState().balanceEvents.length, 0);
  store.setBalanceCaptureEnabled(true);
});

test('telemetry init remains idempotent', () => {
  const store = useTelemetryStore.getState();
  store.clear();
  initializeTelemetry();
  initializeTelemetry();
  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: Date.now(), runStartTime: Date.now(), elapsedMsSinceLifeStart: 0, trigger: 'other' } });
  const countAfterOneEmit = useTelemetryStore.getState().events.length;
  assert.equal(countAfterOneEmit, 1);
});

test('save export is not inflated with telemetry buffers', () => {
  const save = SaveService.exportSave();
  if (!save) {
    assert.ok(true);
    return;
  }
  assert.equal(save.includes('balanceEvents'), false);
});
