import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  createGameLoop,
  registerSimulationSchedulerJobs,
  type GameLoopDependencies,
} from '../../src/systems/gameLoop.js';
import { SimulationScheduler } from '../../src/services/time/SimulationScheduler.js';

function createRafHost() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();
  return {
    requestAnimationFrame(callback: () => void) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) {
      callbacks.delete(id);
    },
    runOneFrame() {
      const [id, callback] = callbacks.entries().next().value ?? [];
      if (id === undefined || !callback) return false;
      callbacks.delete(id);
      callback();
      return true;
    },
    activeFrameCount() {
      return callbacks.size;
    },
  };
}

function createLoopDeps(): {
  deps: GameLoopDependencies;
  scheduler: SimulationScheduler;
  calls: Record<'game' | 'cultivation' | 'combat' | 'queues' | 'diagnostics' | 'autosave', number>;
  rafHost: ReturnType<typeof createRafHost>;
} {
  const rafHost = createRafHost();
  const scheduler = new SimulationScheduler({ autoStartHost: false });
  const calls = {
    game: 0,
    cultivation: 0,
    combat: 0,
    queues: 0,
    diagnostics: 0,
    autosave: 0,
  };
  const deps: GameLoopDependencies = {
    scheduler,
    requestAnimationFrame: rafHost.requestAnimationFrame,
    cancelAnimationFrame: rafHost.cancelAnimationFrame,
    gameTick: () => { calls.game += 1; },
    cultivationTick: () => { calls.cultivation += 1; },
    combatTick: () => { calls.combat += 1; },
    queueTick: () => { calls.queues += 1; },
    progressionDiagnosticsTick: () => { calls.diagnostics += 1; },
    autosaveTick: () => { calls.autosave += 1; return true; },
    nowWall: () => 1_000_000,
    isCombatActivityActive: () => true,
  };
  return { deps, scheduler, calls, rafHost };
}

test('GameLoop starts and stops the SimulationScheduler idempotently', () => {
  const { deps, scheduler, rafHost } = createLoopDeps();
  const loop = createGameLoop(deps);

  loop.start();
  assert.equal(loop.isActive(), true);
  assert.equal(scheduler.isActive(), true);
  assert.equal(rafHost.activeFrameCount(), 1);

  loop.start();
  assert.equal(rafHost.activeFrameCount(), 1);
  assert.equal(Object.keys(scheduler.getDiagnostics()).length, 5);

  loop.stop();
  assert.equal(loop.isActive(), false);
  assert.equal(scheduler.isActive(), false);
  assert.equal(rafHost.activeFrameCount(), 0);

  loop.stop();
  assert.equal(scheduler.isActive(), false);
});

test('GameLoop visual rAF does not call authoritative gameplay ticks', () => {
  const { deps, calls, rafHost } = createLoopDeps();
  const loop = createGameLoop(deps);

  loop.start();
  assert.equal(rafHost.runOneFrame(), true);

  assert.deepEqual(calls, {
    game: 0,
    cultivation: 0,
    combat: 0,
    queues: 0,
    diagnostics: 0,
    autosave: 0,
  });
});

test('GameLoop authoritative work is reachable through scheduler drains', () => {
  const { deps, scheduler, calls } = createLoopDeps();
  const loop = createGameLoop(deps);

  loop.start();
  scheduler.drain(0, 'test');
  for (let now = 100; now <= 1_000; now += 100) {
    scheduler.drain(now, 'test');
  }

  assert.equal(calls.game, 4);
  assert.equal(calls.cultivation, 4);
  assert.equal(calls.combat, 10);
  assert.equal(calls.queues, 1);
  assert.equal(calls.diagnostics, 1);
  assert.equal(calls.autosave, 0);

  scheduler.drain(60_000, 'test');
  assert.equal(calls.autosave, 1);
});

test('reset-style start stop start does not duplicate scheduler jobs', () => {
  const { deps, scheduler } = createLoopDeps();
  const loop = createGameLoop(deps);

  loop.start();
  loop.stop();
  loop.start();

  assert.deepEqual(Object.keys(scheduler.getDiagnostics()).sort(), [
    'autosave',
    'combat-fixed-step',
    'cultivation-authoritative',
    'progression-diagnostics',
    'queues-and-expeditions',
  ]);
});

test('registerSimulationSchedulerJobs wires expected cadences and combat gate', () => {
  const scheduler = new SimulationScheduler({ autoStartHost: false });
  let combatEnabled = false;
  const calls = { game: 0, cultivation: 0, combat: 0, queues: 0, diagnostics: 0, autosave: 0 };

  registerSimulationSchedulerJobs(scheduler, {
    gameTick: () => { calls.game += 1; },
    cultivationTick: () => { calls.cultivation += 1; },
    combatTick: () => { calls.combat += 1; },
    queueTick: () => { calls.queues += 1; },
    progressionDiagnosticsTick: () => { calls.diagnostics += 1; },
    autosaveTick: () => { calls.autosave += 1; return true; },
    nowWall: () => 1_000_000,
    isCombatActivityActive: () => combatEnabled,
  });

  scheduler.start();
  scheduler.drain(0, 'test');
  scheduler.drain(100, 'test');
  assert.equal(calls.combat, 0);

  combatEnabled = true;
  scheduler.drain(200, 'test');
  scheduler.drain(250, 'test');
  scheduler.drain(1_000, 'test');

  assert.equal(calls.game, 4);
  assert.equal(calls.cultivation, 4);
  assert.equal(calls.combat, 3);
  assert.equal(calls.queues, 1);
  assert.equal(calls.diagnostics, 1);
});

test('GameLoop source keeps rAF visual-only and moves authoritative calls to scheduler registration', () => {
  const source = readFileSync('src/systems/gameLoop.ts', 'utf8');
  const rafStart = source.indexOf('private startRafLoop');
  const schedulerRegistrationStart = source.indexOf('registerSimulationSchedulerJobs');
  const rafSource = source.slice(rafStart, schedulerRegistrationStart > rafStart ? schedulerRegistrationStart : undefined);

  assert.match(rafSource, /requestAnimationFrame/);
  assert.equal(rafSource.includes('gameTick('), false);
  assert.equal(rafSource.includes('cultivationTick('), false);
  assert.equal(rafSource.includes('combatTick('), false);
  assert.equal(rafSource.includes('useGameStore.getState().tick'), false);
  assert.equal(rafSource.includes('cultivationService.tick'), false);
  assert.equal(rafSource.includes('useCombatStore.getState().tick'), false);
});
