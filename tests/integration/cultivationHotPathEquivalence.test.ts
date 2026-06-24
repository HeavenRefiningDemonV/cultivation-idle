import assert from 'node:assert/strict';
import test from 'node:test';

import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { D } from '../../src/utils/numbers.js';

function withMockedClock<T>(startAt: number, action: (advance: (deltaMs: number) => number) => T): T {
  const originalNow = Date.now;
  let now = startAt;
  Date.now = () => now;
  const advance = (deltaMs: number) => {
    now += deltaMs;
    return now;
  };
  try {
    return action(advance);
  } finally {
    Date.now = originalNow;
  }
}

function resetCultivationRuntime() {
  useActivityStore.getState().hardResetActivity();
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  // Qi accrual is gated behind a committed life identity (the M.II.3 hot-path gate: tick()/flush early-return
  // until path + Heart Law + breath are set). Commit one so the hot path actually accrues. Mirrors the
  // now-passing cityUnlockRuntime/cityArrivalFlow setup.
  useGameStore.setState({
    qi: '0',
    qiPerSecond: '10',
    lastTickTime: 1_000,
    lastActiveTime: 1_000,
    selectedPath: 'heaven',
  });
  useCultivationStore.setState({ selectedHeartLawId: 'heartlaw_quiet_breath', breathMode: 'balanced' });
}

test('cultivation hot path preserves 60 seconds of exact Qi after an explicit flush', () => {
  withMockedClock(1_000, (advance) => {
    resetCultivationRuntime();

    for (let elapsed = 0; elapsed < 60_000; elapsed += 250) {
      useGameStore.getState().tick(250);
      advance(250);
    }
    useGameStore.getState().flushCultivationAccumulation('test');

    assert.equal(D(useGameStore.getState().qi).toString(), '600');
  });
});
