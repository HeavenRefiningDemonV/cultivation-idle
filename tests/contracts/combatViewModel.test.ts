import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCombatViewModel } from '../../src/systems/combat/combatViewModel.js';

type CombatViewSnapshot = Parameters<typeof buildCombatViewModel>[0];

function makeCombatSnapshot(overrides: Partial<CombatViewSnapshot> = {}): CombatViewSnapshot {
  return {
    inCombat: true,
    currentEnemy: {
      id: 'enemy_alpha',
      name: 'Enemy Alpha',
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
    playerHP: '75',
    playerMaxHP: '100',
    enemyHP: '25',
    enemyMaxHP: '100',
    combatLog: [],
    combatShield: null,
    combatResources: { qi: 50, maxQi: 100, intent: 75, maxIntent: 100 },
    techniqueLog: [],
    events: [],
    isBoss: false,
    activeAura: null,
    combatResolved: false,
    combatSessionVersion: 1,
    combatViewVersion: 2,
    combatResultVersion: 3,
    ...overrides,
  };
}

describe('compact combat view model', () => {
  it('contains bounded display fields and log tails only', () => {
    const combat = makeCombatSnapshot({
      combatLog: Array.from({ length: 8 }, (_, index) => ({
        type: 'system' as const,
        text: `log-${index}`,
        timestamp: index,
        color: '#fff',
      })),
      techniqueLog: Array.from({ length: 6 }, (_, index) => ({
        at: index,
        kind: 'cast' as const,
        message: `tech-${index}`,
      })),
      events: Array.from({ length: 12 }, (_, index) => ({
        id: `event-${index}`,
        at: index,
        type: 'HIT' as const,
        source: 'player' as const,
        target: 'enemy' as const,
        amount: String(index),
        isCrit: false,
      })),
    });

    const view = buildCombatViewModel(combat, 'outskirts', { logCount: 3, techniqueLogCount: 2, eventCount: 4 });

    assert.equal(view.player.hpPct, 75);
    assert.equal(view.enemy.hpPct, 25);
    assert.equal(view.resources.qiPct, 50);
    assert.deepEqual(view.recentLogs.map((entry) => entry.text), ['log-5', 'log-6', 'log-7']);
    assert.deepEqual(view.recentTechniqueLogs.map((entry) => entry.message), ['tech-4', 'tech-5']);
    assert.deepEqual(view.recentEvents.map((entry) => entry.id), ['event-8', 'event-9', 'event-10', 'event-11']);
  });

  it('is stable for unrelated snapshot object changes when semantic combat versions are unchanged', () => {
    const first = buildCombatViewModel(makeCombatSnapshot(), 'outskirts');
    const second = buildCombatViewModel(makeCombatSnapshot({
      combatSessionVersion: first.combatSessionVersion,
      combatViewVersion: first.combatViewVersion,
      combatResultVersion: first.combatResultVersion,
    }), 'outskirts');

    assert.equal(second.combatSessionVersion, first.combatSessionVersion);
    assert.equal(second.combatViewVersion, first.combatViewVersion);
    assert.equal(second.combatResultVersion, first.combatResultVersion);
    assert.deepEqual(second.recentLogs, first.recentLogs);
  });
});
