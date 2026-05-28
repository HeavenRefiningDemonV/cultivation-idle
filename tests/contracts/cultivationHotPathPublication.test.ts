import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { VERSE_COMPREHENSION_THRESHOLD } from '../../src/content/tuning/cultivationTuning.js';

type SubscribableStore<TState> = {
  subscribe: (listener: (state: TState, previousState: TState) => void) => () => void;
};

function countNotifications<TState>(store: SubscribableStore<TState>, action: () => void): number {
  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });
  action();
  unsubscribe();
  return notifications;
}

function withMockedNow<T>(now: number, action: () => T): T {
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    return action();
  } finally {
    Date.now = originalNow;
  }
}

describe('cultivation hot-path publication guards', () => {
  it('batches comprehension gain and chapter advancement into one publication', () => {
    useCultivationStore.setState({
      selectedHeartLawId: 'heart_law_alpha',
      chapter: 1,
      comprehension: VERSE_COMPREHENSION_THRESHOLD - 5,
      heartLawVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      useCultivationStore.getState().addComprehension(10, 'meditation');
    });

    const state = useCultivationStore.getState();
    assert.equal(notifications, 1);
    assert.equal(state.chapter, 2);
    assert.equal(state.comprehension, 5);
    assert.equal(state.heartLawVersion, 1);
  });

  it('handles final chapter comprehension through the same single semantic update', () => {
    useCultivationStore.setState({
      selectedHeartLawId: 'heart_law_alpha',
      chapter: 5,
      comprehension: 4,
      heartLawVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      useCultivationStore.getState().addComprehension(6, 'meditation');
    });

    const state = useCultivationStore.getState();
    assert.equal(notifications, 1);
    assert.equal(state.chapter, 5);
    assert.equal(state.comprehension, 0);
    assert.equal(state.heartLawVersion, 1);
  });

  it('keeps sub-bucket insight progress out of Zustand publication but preserves exact opening', () => {
    useCultivationStore.setState({
      selectedHeartLawId: 'heart_law_alpha',
      insight: null,
      insightProgressMs: 0,
      insightTargetMs: 10_000,
      nextInsightAt: 10_000,
      insightDisplayVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      const opened = useCultivationStore.getState().advanceInsightTimer(50, 50, 1);
      assert.equal(opened, false);
    });

    assert.equal(notifications, 0);
    assert.equal(useCultivationStore.getState().insightDisplayVersion, 0);

    const opened = useCultivationStore.getState().advanceInsightTimer(9_950, 10_000, 1);
    assert.equal(opened, true);
    assert.notEqual(useCultivationStore.getState().insight, null);
  });

  it('returns a stable default modifier object when no cultivation consumables are active', () => {
    useCultivationStore.setState({
      activeCultivationConsumables: [],
      consumableVersion: 0,
    });

    const first = useCultivationStore.getState().getCultivationConsumableModifiers(1_000);
    const second = useCultivationStore.getState().getCultivationConsumableModifiers(2_000);

    assert.equal(first, second);
  });

  it('does not publish active non-expired cultivation consumable cleanup before expiry', () => {
    useCultivationStore.setState({
      selectedHeartLawId: 'heart_law_alpha',
      activeCultivationConsumables: [
        {
          itemId: 'test_cultivation_tea',
          family: 'doctrine',
          activatedAt: 0,
          expiresAt: 10_000,
          consumedOnMajorBreakthrough: false,
          modifiers: {
            qiRateMult: 1,
            comprehensionGainMult: 1,
            stabilityGainMult: 1,
            insightFrequencyMult: 1,
            majorBreakthroughQiCostMult: 1,
            majorBreakthroughStabilityBonus: 0,
          },
        },
      ],
      insightProgressMs: 0,
      insightTargetMs: 10_000,
      nextInsightAt: 10_000,
      consumableVersion: 0,
      insightDisplayVersion: 0,
    });

    const notifications = countNotifications(useCultivationStore, () => {
      useCultivationStore.getState().clearExpiredCultivationConsumables(500);
    });

    assert.equal(notifications, 0);
  });

  it('does not publish game store state for a sub-display Qi tick with no HP or buff changes', () => {
    withMockedNow(1_000, () => {
      useGameStore.getState().hardResetGameState();
      useGameStore.setState({
        qi: '0',
        qiPerSecond: '0.1',
        stats: {
          hp: '100',
          maxHp: '100',
          atk: '1',
          def: '1',
          crit: 0,
          critDmg: 150,
          dodge: 0,
          regen: '0',
          speed: 1,
        },
        activeBuffs: [],
        absorptionShield: '0',
        absorptionExpiresAt: null,
        lastTickTime: 1_000,
        lastActiveTime: 1_000,
        qiDisplayVersion: 0,
      });

      const notifications = countNotifications(useGameStore, () => {
        useGameStore.getState().tick(250);
      });

      assert.equal(notifications, 0);
      assert.equal(useGameStore.getState().qiDisplayVersion, 0);
    });
  });
});
