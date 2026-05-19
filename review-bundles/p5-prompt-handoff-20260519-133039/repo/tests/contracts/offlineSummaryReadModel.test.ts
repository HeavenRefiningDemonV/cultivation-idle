import assert from 'node:assert/strict';
import test from 'node:test';

import type { OfflineCatchupSummary } from '../../src/services/time/OfflineCatchup.js';
import { buildOfflineModalRows, getQueuedActionReadinessDelta } from '../../src/systems/offline/offlineSummaryReadModel.js';

test('offline summary rows keep canonical qi -> queued actions -> expeditions ordering and omit unknown rows', () => {
  const summary: OfflineCatchupSummary = {
    offlineSeconds: 8 * 60 * 60,
    offlineDuration: '8h',
    efficiency: 0.7,
    wasCapped: false,
    parts: [
      { kind: 'expeditions', label: 'Expeditions ready', value: '1' },
      { kind: 'qi_gained', label: 'Qi gained', value: '1200' },
      { kind: 'queued_actions', label: 'Queued actions ready', value: '3' },
    ],
  };

  const rows = buildOfflineModalRows(summary);
  assert.deepEqual(rows.map((row) => row.kind), ['qi_gained', 'queued_actions', 'expeditions']);
});

test('offline summary rows omit empty/zero entries while keeping capped state outside row filtering', () => {
  const summary: OfflineCatchupSummary = {
    offlineSeconds: 43_200,
    offlineDuration: '12h',
    efficiency: 0.9,
    wasCapped: true,
    parts: [
      { kind: 'qi_gained', label: 'Qi gained', value: '0' },
      { kind: 'queued_actions', label: 'Queued actions ready', value: '0' },
      { kind: 'expeditions', label: 'Expeditions ready', value: '0' },
    ],
  };

  const rows = buildOfflineModalRows(summary);
  assert.deepEqual(rows, []);
  assert.equal(summary.wasCapped, true);
});

test('queued-action readiness delta tracks newly ready jobs even when queue lengths are unchanged', () => {
  const beforeAt = 1_000;
  const afterAt = 10_000;
  const delta = getQueuedActionReadinessDelta({
    before: {
      alchemyQueue: [{ id: 'a', recipeId: 'r', qty: 1, startedAt: 1_000, endsAt: 5_000, cityId: 'city' }],
      talismanQueue: [{ id: 't', recipeId: 'r', qty: 1, startedAt: 1_000, endsAt: 6_000, cityId: 'city' }],
      forgeQueue: [{ id: 'f', blueprintId: 'b', qty: 1, startedAt: 1_000, endsAt: 9_000, cityId: 'city', status: 'ACTIVE' }],
    },
    after: {
      alchemyQueue: [{ id: 'a', recipeId: 'r', qty: 1, startedAt: 1_000, endsAt: 5_000, cityId: 'city' }],
      talismanQueue: [{ id: 't', recipeId: 'r', qty: 1, startedAt: 1_000, endsAt: 6_000, cityId: 'city' }],
      forgeQueue: [{ id: 'f', blueprintId: 'b', qty: 1, startedAt: 1_000, endsAt: 9_000, cityId: 'city', status: 'READY_TO_CLAIM' }],
    },
    beforeAt,
    afterAt,
  });

  assert.equal(delta.totalReadyBefore, 0);
  assert.equal(delta.totalReadyAfter, 3);
  assert.equal(delta.newlyReady, 3);
  assert.deepEqual(delta.byStation, { alchemy: 1, talisman: 1, forge: 1 });
});
