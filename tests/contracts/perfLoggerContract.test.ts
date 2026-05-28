import assert from 'node:assert/strict';
import test from 'node:test';
import {
  configurePerfForTests,
  exportPerfSnapshot,
  incrementCounter,
  PERF_LABELS,
  recordEvent,
  resetPerfSnapshot,
  startTimer,
  time,
  timeAsync,
} from '../../src/services/performance/index.js';

test('disabled performance logger is inert and deterministic', () => {
  configurePerfForTests({ enabled: false, source: 'disabled' });
  resetPerfSnapshot();

  incrementCounter('ci:test:disabled');
  const result = time('ci:test:disabled:time', () => 42);
  const end = startTimer('ci:test:disabled:timer');
  end();

  const snapshot = exportPerfSnapshot();
  assert.equal(result, 42);
  assert.equal(snapshot.enabled, false);
  assert.deepEqual(snapshot.counters, {});
  assert.deepEqual(snapshot.measures, {});
  assert.equal(snapshot.recentEvents.length, 0);
});

test('enabled performance logger aggregates counters, timers, async timers, and reset', async () => {
  configurePerfForTests({ enabled: true, source: 'test', maxEventEntries: 3, maxMeasureEntries: 3 });
  resetPerfSnapshot();

  incrementCounter('ci:test:counter');
  incrementCounter('ci:test:counter', 4);
  const syncResult = time('ci:test:sync', () => 'ok');
  const asyncResult = await timeAsync('ci:test:async', async () => 'async-ok');
  const end = startTimer('ci:test:manual');
  end();

  const snapshot = exportPerfSnapshot();
  assert.equal(syncResult, 'ok');
  assert.equal(asyncResult, 'async-ok');
  assert.equal(snapshot.enabled, true);
  assert.equal(snapshot.counters['ci:test:counter']?.count, 5);
  assert.equal(snapshot.measures['ci:test:sync']?.count, 1);
  assert.equal(snapshot.measures['ci:test:async']?.count, 1);
  assert.equal(snapshot.measures['ci:test:manual']?.count, 1);
  assert.equal(snapshot.measures['ci:test:sync']?.minMs >= 0, true);

  resetPerfSnapshot();
  const resetSnapshot = exportPerfSnapshot();
  assert.deepEqual(resetSnapshot.counters, {});
  assert.deepEqual(resetSnapshot.measures, {});
});

test('recent event buffer is capped and sanitized', () => {
  configurePerfForTests({ enabled: true, source: 'test', maxEventEntries: 2, maxMeasureEntries: 2 });
  resetPerfSnapshot();

  recordEvent('ci:test:event', {
    safe: 'kept',
    saveData: '{"qi":"999"}',
    localStorageValue: 'raw-local-storage',
    token: 'secret-token',
  });
  recordEvent('ci:test:event:2', { safe: 'second' });
  recordEvent('ci:test:event:3', { safe: 'third' });

  const snapshotText = JSON.stringify(exportPerfSnapshot());
  const snapshot = exportPerfSnapshot();
  assert.equal(snapshot.recentEvents.length, 2);
  assert.equal(snapshot.recentEvents[0]?.name, 'ci:test:event:2');
  assert.equal(snapshot.recentEvents[1]?.name, 'ci:test:event:3');
  assert.equal(snapshotText.includes('raw-local-storage'), false);
  assert.equal(snapshotText.includes('secret-token'), false);
  assert.equal(snapshotText.includes('{"qi":"999"}'), false);
});

test('non-browser debug installation does not throw or expose window', () => {
  configurePerfForTests({ enabled: true, source: 'test', exposeWindowDebug: true });
  resetPerfSnapshot();

  assert.equal(typeof globalThis.window, 'undefined');
  assert.doesNotThrow(() => exportPerfSnapshot());
});

test('scheduler labels aggregate through existing performance export without sensitive data', () => {
  configurePerfForTests({ enabled: true, source: 'test', maxEventEntries: 4, maxMeasureEntries: 4 });
  resetPerfSnapshot();

  incrementCounter(PERF_LABELS.schedulerDrain);
  incrementCounter(PERF_LABELS.schedulerJobCultivationAuthoritative);
  incrementCounter(PERF_LABELS.schedulerJobError, 1, {
    name: 'combat-fixed-step',
    savePayload: '{"qi":"999"}',
  });

  const snapshotText = JSON.stringify(exportPerfSnapshot());
  const snapshot = exportPerfSnapshot();
  assert.equal(snapshot.counters[PERF_LABELS.schedulerDrain]?.count, 1);
  assert.equal(snapshot.counters[PERF_LABELS.schedulerJobCultivationAuthoritative]?.count, 1);
  assert.equal(snapshot.counters[PERF_LABELS.schedulerJobError]?.count, 1);
  assert.equal(snapshotText.includes('{"qi":"999"}'), false);
});
