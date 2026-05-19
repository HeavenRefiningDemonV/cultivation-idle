import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents, type RewardsGrantedEvent } from '../../src/services/events/GameEvents.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import {
  clearDaoImpressions,
  initDaoImpressionEventBridge,
  resetDaoImpressionEventBridgeForTests,
  useDaoImpressionStore,
} from '../../src/systems/daoImpressions/index.js';

function resetRewardBridgeState() {
  resetDaoImpressionEventBridgeForTests();
  clearDaoImpressions();
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath',
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: ['heart_quiet_breath'],
  });
}

test.beforeEach(resetRewardBridgeState);
test.afterEach(resetRewardBridgeState);

test('dao impression grants through RewardService and emits one structured reward event', () => {
  const rewardEvents: RewardsGrantedEvent['payload'][] = [];
  const handler = (event: RewardsGrantedEvent) => {
    rewardEvents.push(event.payload);
  };
  GameEvents.on('rewards/granted', handler);
  initDaoImpressionEventBridge();

  try {
    GameEvents.emit({
      type: 'trials/attempt_resolved',
      payload: {
        timestamp: 400,
        trialId: 'trial_novices_clearing',
        gateIndex: 1,
        attemptId: 'clear-once',
        outcome: 'cleared',
        durationSec: 18,
        countsTowardFailSafe: true,
      },
    });
  } finally {
    GameEvents.off('rewards/granted', handler);
  }

  assert.equal(rewardEvents.length, 1);
  assert.match(rewardEvents[0].reason, /^dao_impression:gate_clear:/);
  assert.equal(rewardEvents[0].result.appliedComprehension?.applied, true);
  assert.equal(rewardEvents[0].result.appliedComprehension?.targetHeartLawId, 'heart_quiet_breath');
  assert.equal(useCultivationStore.getState().comprehension, 15);
});

test('dao impression bridge ignores ordinary and own reward events to prevent recursion', () => {
  initDaoImpressionEventBridge();

  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'Gate Trial clear',
      bundle: { comprehension: 999 },
      result: {
        appliedCurrencies: {},
        appliedItems: [],
        droppedItems: [],
        appliedTechniqueFragments: [],
        appliedManuals: [],
        appliedComprehension: {
          amount: 999,
          applied: true,
          source: 'Gate Trial clear',
          targetHeartLawId: 'heart_quiet_breath',
        },
        skippedRewards: [],
      },
      summary: '+999 Comprehension',
      timestamp: 500,
    },
  });
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      reason: 'dao_impression:gate_clear:trial_novices_clearing',
      bundle: { comprehension: 15 },
      result: {
        appliedCurrencies: {},
        appliedItems: [],
        droppedItems: [],
        appliedTechniqueFragments: [],
        appliedManuals: [],
        appliedComprehension: {
          amount: 15,
          applied: true,
          source: 'dao_impression:gate_clear:trial_novices_clearing',
          targetHeartLawId: 'heart_quiet_breath',
        },
        skippedRewards: [],
      },
      summary: '+15 Comprehension',
      timestamp: 501,
    },
  });

  assert.equal(useDaoImpressionStore.getState().awards.length, 0);
});

