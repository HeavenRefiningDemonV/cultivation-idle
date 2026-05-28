import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SimulationScheduler,
  type ScheduledJobRunContext,
} from '../../src/services/time/SimulationScheduler.js';
import { configurePerfForTests, exportPerfSnapshot, resetPerfSnapshot } from '../../src/services/performance/index.js';

function createFakeClock(startMono = 0, startWall = 1_000_000) {
  let mono = startMono;
  let wall = startWall;
  return {
    nowMono: () => mono,
    nowWall: () => wall,
    set(nextMono: number) {
      mono = nextMono;
      wall = startWall + nextMono;
    },
  };
}

test('SimulationScheduler start and stop are idempotent without host timers', () => {
  const clock = createFakeClock();
  const scheduler = new SimulationScheduler({ clock, autoStartHost: false });

  scheduler.start();
  scheduler.start();
  assert.equal(scheduler.isActive(), true);

  scheduler.stop();
  scheduler.stop();
  assert.equal(scheduler.isActive(), false);
});

test('SimulationScheduler runs registered jobs only when their interval is due', () => {
  const clock = createFakeClock();
  const scheduler = new SimulationScheduler({ clock, autoStartHost: false });
  const runs: ScheduledJobRunContext[] = [];

  scheduler.register({
    name: 'cultivation-authoritative',
    intervalMs: 250,
    run: (context) => runs.push(context),
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  scheduler.drain(100, 'test');
  assert.equal(runs.length, 0);

  scheduler.drain(250, 'test');
  assert.equal(runs.length, 1);
  assert.equal(runs[0]?.elapsedMs, 250);
  assert.equal(runs[0]?.stepMs, 250);
  assert.equal(runs[0]?.nowWall, 1_000_000);

  clock.set(500);
  scheduler.drain(undefined, 'test');
  assert.equal(runs.length, 2);
  assert.equal(runs[1]?.nowWall, 1_000_500);
});

test('SimulationScheduler skips disabled jobs and runs them after they become enabled', () => {
  const scheduler = new SimulationScheduler({ clock: createFakeClock(), autoStartHost: false });
  let enabled = false;
  let runs = 0;

  scheduler.register({
    name: 'combat-fixed-step',
    intervalMs: 100,
    enabled: () => enabled,
    run: () => { runs += 1; },
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  scheduler.drain(100, 'test');
  assert.equal(runs, 0);
  assert.equal(scheduler.getDiagnostics()['combat-fixed-step']?.skippedCount, 1);

  enabled = true;
  scheduler.drain(200, 'test');
  assert.equal(runs, 1);
});

test('SimulationScheduler clamps catch-up and maxStepsPerDrain prevents unbounded drains', () => {
  const scheduler = new SimulationScheduler({ clock: createFakeClock(), autoStartHost: false });
  const elapsedSeen: number[] = [];

  scheduler.register({
    name: 'combat-fixed-step',
    intervalMs: 100,
    maxCatchupMs: 250,
    maxStepsPerDrain: 2,
    run: ({ elapsedMs }) => elapsedSeen.push(elapsedMs),
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  scheduler.drain(10_000, 'resume');

  assert.equal(elapsedSeen.length, 2);
  assert.deepEqual(elapsedSeen, [100, 100]);
  const diagnostics = scheduler.getDiagnostics()['combat-fixed-step'];
  assert.equal(diagnostics?.catchupClampCount, 1);
  assert.equal(diagnostics?.runCount, 2);
});

test('SimulationScheduler records errors without killing later jobs', () => {
  const scheduler = new SimulationScheduler({ clock: createFakeClock(), autoStartHost: false });
  let stableRuns = 0;

  scheduler.register({
    name: 'broken-job',
    intervalMs: 100,
    run: () => { throw new Error('expected scheduler test error'); },
  });
  scheduler.register({
    name: 'stable-job',
    intervalMs: 100,
    run: () => { stableRuns += 1; },
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    assert.doesNotThrow(() => scheduler.drain(100, 'test'));
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(stableRuns, 1);
  assert.equal(scheduler.getDiagnostics()['broken-job']?.errorCount, 1);
  assert.equal(scheduler.getDiagnostics()['stable-job']?.runCount, 1);
});

test('SimulationScheduler unregister, clearJobs, replacement, resetDiagnostics, and hidden policy work', () => {
  configurePerfForTests({ enabled: true, source: 'test' });
  resetPerfSnapshot();

  const scheduler = new SimulationScheduler({ clock: createFakeClock(), autoStartHost: false });
  let runs = 0;

  scheduler.register({ name: 'replaceable', intervalMs: 100, run: () => { runs += 1; } });
  scheduler.register({ name: 'replaceable', intervalMs: 50, run: () => { runs += 10; } });
  scheduler.register({ name: 'hidden-off', intervalMs: 50, runWhenHidden: false, run: () => { runs += 100; } });
  scheduler.start();
  scheduler.setHidden(true);
  scheduler.drain(0, 'test');
  scheduler.drain(50, 'test');
  assert.equal(runs, 10);
  assert.equal(scheduler.getDiagnostics()['hidden-off']?.skippedCount, 1);

  scheduler.unregister('replaceable');
  scheduler.setHidden(false);
  scheduler.drain(100, 'test');
  assert.equal(runs, 110);

  scheduler.resetDiagnostics();
  assert.equal(scheduler.getDiagnostics()['hidden-off']?.runCount, 0);
  scheduler.clearJobs();
  scheduler.drain(200, 'test');
  assert.deepEqual(scheduler.getDiagnostics(), {});

  const snapshot = exportPerfSnapshot();
  assert.equal(snapshot.counters['ci:scheduler:visibility:hidden']?.count, 1);
  assert.equal(snapshot.counters['ci:scheduler:visibility:visible']?.count, 1);
});
