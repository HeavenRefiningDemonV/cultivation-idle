import assert from 'node:assert/strict';
import test from 'node:test';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { SimulationScheduler } from '../../src/services/time/SimulationScheduler.js';
import { D } from '../../src/utils/numbers.js';

function resetCultivationRuntime() {
  useActivityStore.getState().hardResetActivity();
  useGameStore.getState().hardResetGameState();
  useCultivationStore.getState().resetForNewLife();
  useGameStore.setState({
    qi: '0',
    qiPerSecond: '10',
    lastTickTime: 1_000_000,
    lastActiveTime: 1_000_000,
  });
}

function runGameTickSeries(stepMs: number, elapsedMs: number): string {
  resetCultivationRuntime();
  const steps = Math.floor(elapsedMs / stepMs);
  const remainder = elapsedMs - steps * stepMs;
  for (let index = 0; index < steps; index += 1) {
    useGameStore.getState().tick(stepMs);
  }
  if (remainder > 0) {
    useGameStore.getState().tick(remainder);
  }
  useGameStore.getState().flushCultivationAccumulation('test');
  return useGameStore.getState().qi;
}

function runScheduledGameTicks(elapsedMs: number): string {
  resetCultivationRuntime();
  const scheduler = new SimulationScheduler({ autoStartHost: false });
  scheduler.register({
    name: 'cultivation-authoritative',
    intervalMs: 250,
    maxCatchupMs: 1000,
    maxStepsPerDrain: 4,
    run: ({ elapsedMs: stepElapsedMs }) => {
      useGameStore.getState().tick(stepElapsedMs);
    },
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  for (let now = 250; now <= elapsedMs; now += 250) {
    scheduler.drain(now, 'test');
  }
  useGameStore.getState().flushCultivationAccumulation('test');
  return useGameStore.getState().qi;
}

test('scheduled game ticks preserve 60 seconds of Qi gain within decimal tolerance', () => {
  const oldStyleQi = runGameTickSeries(1000 / 60, 60_000);
  const scheduledQi = runScheduledGameTicks(60_000);
  const diff = D(oldStyleQi).minus(D(scheduledQi)).abs();

  assert.equal(diff.lessThanOrEqualTo(D('0.000000001')), true);
  assert.equal(D(scheduledQi).toString(), '600');
});

test('scheduled cultivation cadence preserves activity timestamp validity for idle and meditate states', () => {
  resetCultivationRuntime();
  useActivityStore.getState().setActivity('meditate', undefined, 'scheduler-test');

  const scheduler = new SimulationScheduler({ autoStartHost: false });
  scheduler.register({
    name: 'cultivation-authoritative',
    intervalMs: 250,
    run: ({ elapsedMs }) => useGameStore.getState().tick(elapsedMs),
  });
  scheduler.start();
  scheduler.drain(0, 'test');
  scheduler.drain(250, 'test');

  assert.equal(useGameStore.getState().lastTickTime > 0, true);
  assert.equal(useGameStore.getState().lastActiveTime > 0, true);
});
