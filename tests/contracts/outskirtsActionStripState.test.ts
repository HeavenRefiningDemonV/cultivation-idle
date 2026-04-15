import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOutskirtsActionStripState } from '../../src/ui/world/buildOutskirtsActionStripState.js';

void test('outskirts action strip state resolves truthful Start state when inactive', () => {
  const state = buildOutskirtsActionStripState({
    isOutskirtsActive: false,
    killsSinceBoss: 3,
    killsToBoss: 10,
    autoContinue: false,
    stopAtBoss: true,
  });

  assert.equal(state.primaryActionLabel, 'Start');
  assert.equal(state.primaryActionTone, 'start');
  assert.equal(state.progressLabel, 'Hunt Progress 3 / 10');
  assert.equal(state.bossStatusLabel, 'Boss in 7 kills');
  assert.deepEqual(state.loopToggleLines, ['Auto-continue: Off', 'Stop at boss: On']);
});

void test('outskirts action strip state resolves truthful Stop state and boss-ready line when active', () => {
  const state = buildOutskirtsActionStripState({
    isOutskirtsActive: true,
    killsSinceBoss: 12,
    killsToBoss: 10,
    autoContinue: true,
    stopAtBoss: false,
  });

  assert.equal(state.primaryActionLabel, 'Stop');
  assert.equal(state.primaryActionTone, 'stop');
  assert.equal(state.progressLabel, 'Hunt Progress 10 / 10');
  assert.equal(state.bossStatusLabel, 'Boss available now');
  assert.deepEqual(state.loopToggleLines, ['Auto-continue: On', 'Stop at boss: Off']);
});
