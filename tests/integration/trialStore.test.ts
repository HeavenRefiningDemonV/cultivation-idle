import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultTrialProgress, useTrialStore } from '../../src/stores/trialStore.js';

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

  useTrialStore.getState().markBypassed('trial_novices_clearing', bypassedAt);
  const bypassed = useTrialStore.getState().getProgress('trial_novices_clearing');
  assert.equal(bypassed.resolution, 'bypassed');
  assert.equal(bypassed.cleared, false);
  assert.equal(bypassed.bypassedAt, bypassedAt);
  assert.equal(useTrialStore.getState().isResolved('trial_novices_clearing'), true);
});
