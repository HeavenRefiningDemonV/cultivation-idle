import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import {
  clearDaoImpressions,
  initDaoImpressionEventBridge,
  resetDaoImpressionEventBridgeForTests,
  useDaoImpressionStore,
} from '../../src/systems/daoImpressions/index.js';

function resetBridgeState() {
  resetDaoImpressionEventBridgeForTests();
  clearDaoImpressions();
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath',
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: ['heart_quiet_breath'],
  });
}

test.beforeEach(resetBridgeState);
test.afterEach(resetBridgeState);

test('first outskirts boss awards exactly once per route per life and ordinary mobs do not award', () => {
  initDaoImpressionEventBridge();
  initDaoImpressionEventBridge();

  GameEvents.emit({
    type: 'combat/resolved',
    payload: {
      timestamp: 100,
      enemyId: 'mob_wolf',
      outcome: 'victory',
      source: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
      isBoss: false,
    },
  });
  assert.equal(useDaoImpressionStore.getState().awards.length, 0);

  const bossPayload = {
    timestamp: 110,
    enemyId: 'enemy_pinewind_boss',
    outcome: 'victory' as const,
    source: 'outskirts',
    cityId: 'city_pinewind_hamlet',
    sourceId: 'outskirts_pinewind',
    isBoss: true,
  };
  GameEvents.emit({ type: 'combat/resolved', payload: bossPayload });
  GameEvents.emit({ type: 'combat/resolved', payload: { ...bossPayload, timestamp: 120 } });
  GameEvents.emit({
    type: 'combat/resolved',
    payload: { ...bossPayload, timestamp: 130, enemyId: 'enemy_pinewind_boss_variant' },
  });

  const awards = useDaoImpressionStore.getState().awards;
  assert.equal(awards.length, 1);
  assert.equal(awards[0].sourceKind, 'outskirts_first_boss');
  assert.equal(useCultivationStore.getState().comprehension, 10);
});

test('gate clear impression is awarded once per gate and clears on new life', () => {
  initDaoImpressionEventBridge();

  const payload = {
    timestamp: 200,
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    attemptId: 'trial_novices_clearing:attempt-1',
    outcome: 'cleared' as const,
    durationSec: 25,
    countsTowardFailSafe: true,
  };
  GameEvents.emit({ type: 'trials/attempt_resolved', payload });
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: { ...payload, timestamp: 201, attemptId: 'trial_novices_clearing:attempt-2' } });

  assert.equal(useDaoImpressionStore.getState().awards.length, 1);
  assert.equal(useDaoImpressionStore.getState().awards[0].sourceKind, 'gate_clear');
  assert.equal(useCultivationStore.getState().comprehension, 15);

  GameEvents.emit({
    type: 'progression/life_started',
    payload: {
      timestamp: 250,
      runStartTime: 250,
      elapsedMsSinceLifeStart: 0,
      lifeOrdinal: 2,
      sessionKind: 'reclaim',
      trigger: 'prestige_reset',
    },
  });

  assert.equal(useDaoImpressionStore.getState().awards.length, 0);
});

test('close gate defeat respects close-call policy and cooldown', () => {
  initDaoImpressionEventBridge();

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: 300,
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      attemptId: 'far-defeat',
      outcome: 'defeated',
      durationSec: 12,
      bossHpPctRemaining: 0.6,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 1,
    },
  });
  assert.equal(useDaoImpressionStore.getState().awards.length, 0);

  const closePayload = {
    timestamp: 320,
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    attemptId: 'close-defeat-1',
    outcome: 'defeated' as const,
    durationSec: 28,
    bossHpPctRemaining: 0.2,
    countsTowardFailSafe: true,
    eligibleFailCountAfterAttempt: 2,
  };
  GameEvents.emit({ type: 'trials/attempt_resolved', payload: closePayload });
  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: { ...closePayload, timestamp: 321, attemptId: 'close-defeat-2' },
  });

  const awards = useDaoImpressionStore.getState().awards;
  assert.equal(awards.length, 1);
  assert.equal(awards[0].sourceKind, 'gate_close_defeat');
  assert.equal(useCultivationStore.getState().comprehension, 6);
});

test('technique rank events are not treated as deferred manual mastery impressions', () => {
  initDaoImpressionEventBridge();

  GameEvents.emit({
    type: 'techniques/rank_upgrade_success',
    payload: {
      techniqueId: 'tech_basic_slash',
      nextRank: 5,
    },
  });

  assert.equal(useDaoImpressionStore.getState().awards.length, 0);
  assert.equal(useCultivationStore.getState().comprehension, 0);
});

test('malformed dao impression source events are ignored without reward grants', () => {
  initDaoImpressionEventBridge();

  assert.doesNotThrow(() => {
    GameEvents.emit({ type: 'combat/resolved', payload: {} } as never);
    GameEvents.emit({ type: 'trials/attempt_resolved', payload: {} } as never);
    GameEvents.emit({ type: 'progression/breakthrough_completed', payload: {} } as never);
    GameEvents.emit({ type: 'techniques/rank_upgrade_success', payload: {} } as never);
  });

  assert.equal(useDaoImpressionStore.getState().awards.length, 0);
  assert.equal(useCultivationStore.getState().comprehension, 0);
});
