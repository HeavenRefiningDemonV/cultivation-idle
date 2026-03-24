import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDefaultSaveState } from '../../src/save/defaultSaveState.js';
import { createDefaultTrialProgress, normalizeTrialProgress, useTrialStore } from '../../src/stores/trialStore.js';

const resetTrialStore = () => {
  useTrialStore.getState().hardResetTrials();
  useTrialStore.setState({ activeTrialSessionId: null });
};

test('trial store only increments eligible failures for qualifying losses', () => {
  resetTrialStore();

  const store = useTrialStore.getState();
  store.recordFailure('trial_novices_clearing', false);
  store.recordFailure('trial_novices_clearing', true);

  const progress = useTrialStore.getState().getProgress('trial_novices_clearing');
  assert.equal(progress.attempts, 2);
  assert.equal(progress.sessionAttempts, 2);
  assert.equal(progress.eligibleFailures, 1);
  assert.equal(progress.resolution, 'none');
});

test('trial store preserves attempt history on clear and records bypass resolution separately', () => {
  resetTrialStore();

  const startedAt = 111;
  const bypassedAt = 222;
  useTrialStore.getState().beginTrialSession('trial_novices_clearing', startedAt);
  useTrialStore.getState().recordFailure('trial_novices_clearing', true);
  useTrialStore.getState().markCleared('trial_novices_clearing');

  const cleared = useTrialStore.getState().getProgress('trial_novices_clearing');
  assert.equal(cleared.attempts, 2);
  assert.equal(cleared.sessionAttempts, 2);
  assert.equal(cleared.eligibleFailures, 1);
  assert.equal(cleared.resolution, 'cleared');
  assert.equal(cleared.cleared, true);
  assert.ok(cleared.lastClearAt != null);

  useTrialStore.getState().resetTrial('trial_novices_clearing');
  assert.deepEqual(useTrialStore.getState().getProgress('trial_novices_clearing'), createDefaultTrialProgress());

  useTrialStore.getState().recordAttemptSummary('trial_novices_clearing', {
    trialId: 'trial_novices_clearing',
    startedAt: 1,
    endedAt: 2,
    durationSec: 1,
    bossHpPct: 50,
    maxHit: 100,
    maxHitLabel: 'Boss hit',
    suggestions: ['legacy summary'],
  });
  useTrialStore.getState().markBypassed('trial_novices_clearing', bypassedAt);
  const bypassed = useTrialStore.getState().getProgress('trial_novices_clearing');
  assert.equal(bypassed.resolution, 'bypassed');
  assert.equal(bypassed.cleared, false);
  assert.equal(bypassed.bypassedAt, bypassedAt);
  assert.equal(bypassed.lastAttemptSummary, null);
  assert.equal(useTrialStore.getState().isResolved('trial_novices_clearing'), true);
});

test('trial progress normalization keeps legacy save data backwards compatible', () => {
  const unresolved = normalizeTrialProgress({
    attempts: 3,
    cleared: false,
    lastAttemptAt: null,
    lastClearAt: null,
  });
  assert.equal(unresolved.resolution, 'none');
  assert.equal(unresolved.eligibleFailures, 3);
  assert.equal(unresolved.cleared, false);

  const cleared = normalizeTrialProgress({
    attempts: 1,
    cleared: true,
    lastAttemptAt: 10,
    lastClearAt: 10,
  });
  assert.equal(cleared.resolution, 'cleared');
  assert.equal(cleared.eligibleFailures, 0);
  assert.equal(cleared.cleared, true);
});

test('default save serialization writes canonical packet-1.4 trial lifecycle fields', () => {
  resetTrialStore();
  useTrialStore.setState({
    activeTrialSessionId: null,
    progressByTrialId: {
      trial_novices_clearing: normalizeTrialProgress({
        attempts: 2,
        cleared: false,
        resolution: 'bypassed',
        bypassedAt: 123,
        lastAttemptAt: 123,
        lastClearAt: null,
      }),
    },
  });

  const save = buildDefaultSaveState();
  const progress = save.trialState?.progressByTrialId?.trial_novices_clearing;

  assert.ok(progress);
  assert.equal(progress.resolution, 'bypassed');
  assert.equal(progress.eligibleFailures, 0);
  assert.equal(progress.bypassedAt, 123);
});
