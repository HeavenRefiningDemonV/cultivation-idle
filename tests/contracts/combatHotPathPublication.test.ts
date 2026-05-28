import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';

const combatStoreSource = readFileSync('src/stores/combatStore.ts', 'utf8');

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

function seedForegroundCombat(now = 1_000) {
  useActivityStore.getState().hardResetActivity();
  useActivityStore.getState().setActivity('outskirts', { cityId: 'city_pinewind_hamlet' }, 'packet4-test');
  useCombatStore.getState().hardResetCombat();
  useCombatStore.setState({
    inCombat: true,
    currentEnemy: {
      id: 'test_enemy',
      name: 'Test Enemy',
      level: 1,
      zone: 'test',
      hp: '100',
      atk: '1',
      def: '1',
      crit: 0,
      critDmg: 150,
      dodge: 0,
      speed: 1,
      goldReward: '0',
      expReward: '0',
      isBoss: false,
    },
    combatContext: { type: 'outskirts', cityId: 'city_pinewind_hamlet' },
    playerHP: '100',
    playerMaxHP: '100',
    enemyHP: '100',
    enemyMaxHP: '100',
    lastAttackTime: now,
    lastEnemyAttackTime: now,
    autoAttack: false,
    autoCombatAI: false,
    combatBuffs: [],
    combatShield: null,
    combatResources: { qi: 100, maxQi: 100, intent: 100, maxIntent: 100 },
    techniqueCooldowns: {},
    nextAiDecisionAt: now + 10_000,
    activeAura: null,
    combatStartTime: now,
    isBoss: false,
  });
}

describe('combat hot-path publication guards', () => {
  it('does not publish maintenance state when buffs, shield, cooldowns, and capped resources are unchanged', () => {
    withMockedNow(1_000, () => {
      seedForegroundCombat(1_000);

      const notifications = countNotifications(useCombatStore, () => {
        useCombatStore.getState().tick(100);
      });

      assert.equal(notifications, 0);
    });
  });

  it('does not rebuild cooldown state before the next cooldown can expire', () => {
    withMockedNow(1_000, () => {
      seedForegroundCombat(1_000);
      useCombatStore.setState({
        techniqueCooldowns: { test_technique: 5_000 },
      });

      const notifications = countNotifications(useCombatStore, () => {
        useCombatStore.getState().tick(100);
      });

      assert.equal(notifications, 0);
      assert.deepEqual(useCombatStore.getState().techniqueCooldowns, { test_technique: 5_000 });
    });
  });

  it('does not publish non-expired combat buff cleanup before the next expiry', () => {
    withMockedNow(1_000, () => {
      seedForegroundCombat(1_000);
      useCombatStore.setState({
        combatBuffs: [{ id: 'test_buff', stat: 'atk', mode: 'pct', value: 0.1, endsAt: 5_000 }],
      });

      const notifications = countNotifications(useCombatStore, () => {
        useCombatStore.getState().tick(100);
      });

      assert.equal(notifications, 0);
      assert.equal(useCombatStore.getState().combatBuffs.length, 1);
    });
  });

  it('keeps combat AI interval-bound and caches stable technique metadata', () => {
    assert.match(combatStoreSource, /now >= state\.nextAiDecisionAt/);
    assert.match(combatStoreSource, /buildAiTechniqueMetadataCacheKey/);
    assert.match(combatStoreSource, /combatAiSnapshotBuild/);
    assert.match(combatStoreSource, /contentVersion/);
    assert.match(combatStoreSource, /loadoutVersion/);
    assert.match(combatStoreSource, /aiProfileVersion/);
    assert.match(combatStoreSource, /collectionVersion/);
    assert.match(combatStoreSource, /masteryVersion/);
  });
});
