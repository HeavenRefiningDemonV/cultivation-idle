import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { GameEvents, type RewardsGrantedEvent } from '../../src/services/events/GameEvents.js';
import {
  clearFailureReflections,
  initFailureReflectionEventBridge,
  resetFailureReflectionEventBridgeForTests,
  useFailureReflectionStore,
} from '../../src/systems/failureReflection/index.js';

function resetBridgeState() {
  resetFailureReflectionEventBridgeForTests();
  clearFailureReflections();
}

test.beforeEach(resetBridgeState);
test.afterEach(resetBridgeState);

test('combat store trial defeat event maps live failure diagnosis fields for the bridge', () => {
  const combatStoreSource = readFileSync('src/stores/combatStore.ts', 'utf8');

  assert.match(combatStoreSource, /buildSection5ReadinessSurface\(context\.trialId\)/);
  assert.match(combatStoreSource, /diagnosisCode:\s*failureDiagnosis\.primary/);
  assert.match(combatStoreSource, /topFixDestination:\s*failureTopFix\.destination/);
  assert.match(combatStoreSource, /topFixReason:\s*failureTopFix\.reason/);
});

test('event bridge creates reflection after repeated same diagnosis and ignores non-gate deaths', () => {
  initFailureReflectionEventBridge();

  GameEvents.emit({
    type: 'combat/resolved',
    payload: {
      timestamp: 90,
      source: 'outskirts',
      outcome: 'defeat',
      enemyId: 'mob',
    },
  });
  assert.equal(useFailureReflectionStore.getState().reflections.length, 0);

  const basePayload = {
    timestamp: 100,
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    attemptId: 'a1',
    outcome: 'defeated' as const,
    durationSec: 20,
    countsTowardFailSafe: true,
    eligibleFailCountAfterAttempt: 1,
    diagnosisCode: 'underprepared',
    topFixDestination: 'apothecary',
    topFixReason: 'Stock Healing Floor before returning.',
  };
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: basePayload });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { ...basePayload, timestamp: 120, attemptId: 'a2', eligibleFailCountAfterAttempt: 2 } });

  const active = useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing');
  assert.ok(active);
  assert.equal(active.patternKind, 'underprepared_loop');
  assert.equal(active.correctiveRoute.target, 'apothecary');
});

test('gate clear and safety net bypass resolve active reflection honestly', () => {
  initFailureReflectionEventBridge();

  const defeat = {
    timestamp: 200,
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    attemptId: 'a1',
    outcome: 'defeated' as const,
    durationSec: 20,
    countsTowardFailSafe: true,
    eligibleFailCountAfterAttempt: 1,
    diagnosisCode: 'underforged',
    topFixDestination: 'forge',
    topFixReason: 'Raise weapon floor.',
  };
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: defeat });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { ...defeat, timestamp: 210, attemptId: 'a2', eligibleFailCountAfterAttempt: 2 } });
  assert.ok(useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing'));

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: 220,
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      attemptId: 'bypass',
      outcome: 'bypassed',
      durationSec: 0,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 2,
    },
  });

  const resolved = useFailureReflectionStore.getState().reflections[0];
  assert.equal(resolved.resolved, true);
  assert.equal(resolved.resolvedBy, 'safety_net_bypassed');
});

test('diagnosis change resolves stale reflection before counting the new pattern', () => {
  initFailureReflectionEventBridge();

  const underprepared = {
    timestamp: 240,
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    attemptId: 'p1',
    outcome: 'defeated' as const,
    durationSec: 20,
    countsTowardFailSafe: true,
    eligibleFailCountAfterAttempt: 1,
    diagnosisCode: 'underprepared',
    topFixDestination: 'apothecary',
    topFixReason: 'Stock Healing Floor before returning.',
  };
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: underprepared });
  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: { ...underprepared, timestamp: 250, attemptId: 'p2', eligibleFailCountAfterAttempt: 2 },
  });
  assert.ok(useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing', 1));

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      ...underprepared,
      timestamp: 260,
      attemptId: 'f1',
      eligibleFailCountAfterAttempt: 3,
      diagnosisCode: 'underforged',
      topFixDestination: 'forge',
      topFixReason: 'Raise weapon floor.',
    },
  });

  const reflections = useFailureReflectionStore.getState().reflections;
  assert.equal(reflections.length, 1);
  assert.equal(reflections[0].resolved, true);
  assert.equal(reflections[0].resolvedBy, 'diagnosis_changed');
  assert.equal(useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing', 1), null);
});

test('malformed failure reflection events are ignored without throwing', () => {
  initFailureReflectionEventBridge();

  assert.doesNotThrow(() => {
    GameEvents.emit({ type: 'trials/attempt_resolved', payload: {} } as never);
    GameEvents.emit({ type: 'trials/attempt_resolved', payload: { outcome: 'defeated' } } as never);
    GameEvents.emit({ type: 'combat/resolved', payload: {} } as never);
  });

  assert.equal(useFailureReflectionStore.getState().reflections.length, 0);
});

test('reflection bridge clears current life state and does not grant rewards by default', () => {
  const rewards: RewardsGrantedEvent['payload'][] = [];
  const rewardHandler = (event: RewardsGrantedEvent) => rewards.push(event.payload);
  GameEvents.on('rewards/granted', rewardHandler);
  initFailureReflectionEventBridge();

  try {
    const defeat = {
      timestamp: 300,
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      attemptId: 'a1',
      outcome: 'defeated' as const,
      durationSec: 20,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 1,
      diagnosisCode: 'close',
      topFixDestination: 'trial',
      topFixReason: 'Retry with one cleaner exchange.',
    };
    GameEvents.emit({ type: 'trials/attempt_resolved', payload: defeat });
    GameEvents.emit({ type: 'trials/attempt_resolved', payload: { ...defeat, timestamp: 310, attemptId: 'a2', eligibleFailCountAfterAttempt: 2 } });
    assert.equal(rewards.length, 0);
    assert.equal(useFailureReflectionStore.getState().reflections.length, 1);

    GameEvents.emit({
      type: 'progression/life_started',
      payload: {
        timestamp: 320,
        runStartTime: 320,
        elapsedMsSinceLifeStart: 0,
        lifeOrdinal: 2,
        sessionKind: 'reclaim',
        trigger: 'prestige_reset',
      },
    });
  } finally {
    GameEvents.off('rewards/granted', rewardHandler);
  }

  assert.equal(useFailureReflectionStore.getState().reflections.length, 0);
});
