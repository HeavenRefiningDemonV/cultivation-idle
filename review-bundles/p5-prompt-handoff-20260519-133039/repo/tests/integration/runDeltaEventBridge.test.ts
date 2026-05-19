import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { initRunDeltaEventBridge, resetRunDeltaEventBridgeForTests } from '../../src/systems/runDeltas/initRunDeltaEventBridge.js';
import { useRunDeltaStore } from '../../src/systems/runDeltas/runDeltaStore.js';

test.beforeEach(() => {
  resetRunDeltaEventBridgeForTests();
  useRunDeltaStore.getState().clearDeltas();
});

test.afterEach(() => {
  resetRunDeltaEventBridgeForTests();
  useRunDeltaStore.getState().clearDeltas();
});

test('run delta event bridge is idempotent and records one reward delta per reward event', () => {
  initRunDeltaEventBridge();
  initRunDeltaEventBridge();

  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'test:outskirts',
      bundle: { currencies: { gold: '300' } },
      summary: '+300 Gold',
      timestamp: 10,
      result: {
        appliedCurrencies: { gold: '300' },
        appliedItems: [],
        droppedItems: [],
        appliedTechniqueFragments: [],
        appliedManuals: [],
        appliedComprehension: null,
        skippedRewards: [],
      },
    },
  } as never);

  const deltas = useRunDeltaStore.getState().deltas;
  assert.equal(deltas.length, 1);
  assert.equal(deltas[0].source, 'rewards');
  assert.match(deltas[0].memoryLine, /300|Gold/i);
});

test('run delta event bridge ignores legacy malformed duplicate-manual fragment reward events', () => {
  initRunDeltaEventBridge();
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    GameEvents.emit({
      type: 'rewards/granted',
      payload: { type: 'techniqueFragments', techId: 'tech_heaven_starfire_bolt' },
    } as never);
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(warnings, []);
  assert.equal(useRunDeltaStore.getState().deltas.length, 0);
});

test('run delta event bridge records gate defeat and clears old per-life deltas on new life', () => {
  initRunDeltaEventBridge();

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: 20,
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      attemptId: 'trial_novices_clearing:20',
      outcome: 'defeat',
      durationSec: 24,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 3,
    },
  } as never);
  assert.equal(useRunDeltaStore.getState().deltas[0]?.source, 'trial');

  GameEvents.emit({
    type: 'progression/life_started',
    payload: {
      timestamp: 30,
      runStartTime: 30,
      elapsedMsSinceLifeStart: 0,
      trigger: 'prestige_reset',
      lifeOrdinal: 2,
      sessionKind: 'reclaim',
    },
  } as never);

  const deltas = useRunDeltaStore.getState().deltas;
  assert.equal(deltas.length, 1);
  assert.equal(deltas[0].source, 'life');
  assert.match(deltas[0].memoryLine, /life/i);
});
