import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { useCombatStore } from '../../src/stores/combatStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

const source = readFileSync('src/stores/combatStore.ts', 'utf8');

function sourceBetween(start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `Missing start marker ${start}`);
  assert.notEqual(endIndex, -1, `Missing end marker ${end}`);
  return source.slice(startIndex, endIndex);
}

describe('medicine pouch event triggers', () => {
  it('keeps fight-start medicine out of the combat tick loop', () => {
    const tickSource = sourceBetween('tick: (deltaTime: number) => {', 'canCastTechnique:');

    assert.doesNotMatch(tickSource, /tryAutoUseMedicinePouch\(now,\s*'fightStart'\)/);
    assert.match(source, /triggerAutoMedicineEvent\(now,\s*\{\s*type:\s*'fightStart'/);
  });

  it('uses previous-to-next HP threshold crossing data for automatic medicine', () => {
    assert.match(source, /previousHpPct/);
    assert.match(source, /nextHpPct/);
    assert.match(source, /hpThresholdCrossed/);
  });

  it('fires fight-start medicine once when a new fight starts', () => {
    const itemId = 'cons_healing_pellet_t1';
    useInventoryStore.getState().hardResetInventory();
    useInventoryStore.getState().addItem(itemId, 2);
    useMedicinePouchStore.getState().hardReset();
    useMedicinePouchStore.getState().equip('healing', itemId);
    useMedicinePouchStore.getState().setSlotConfig('healing', {
      enabled: true,
      trigger: 'fightStart',
      cooldownSec: 0,
      bossOnly: false,
    });
    useUIStore.setState({ settings: { ...useUIStore.getState().settings, useConsumablesInCombat: true } });
    useGameStore.setState({
      stats: {
        hp: '50',
        maxHp: '100',
        atk: '1',
        def: '1',
        crit: 0,
        critDmg: 150,
        dodge: 0,
        regen: '0',
        speed: 1,
      },
    });
    useCombatStore.getState().hardResetCombat();

    useCombatStore.getState().enterCombat('test_zone', {
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
    });

    const lastUsed = useMedicinePouchStore.getState().slots.healing.lastUsedAt;
    assert.equal(typeof lastUsed, 'number');
    assert.equal(useInventoryStore.getState().getQty(itemId), 1);

    useCombatStore.getState().tick(100);
    assert.equal(useMedicinePouchStore.getState().slots.healing.lastUsedAt, lastUsed);
    assert.equal(useInventoryStore.getState().getQty(itemId), 1);
  });

  it('treats entering a fight below an HP threshold as one threshold event', () => {
    const itemId = 'cons_healing_pellet_t1';
    useInventoryStore.getState().hardResetInventory();
    useInventoryStore.getState().addItem(itemId, 2);
    useMedicinePouchStore.getState().hardReset();
    useMedicinePouchStore.getState().equip('healing', itemId);
    useMedicinePouchStore.getState().setSlotConfig('healing', {
      enabled: true,
      trigger: 'hpBelowPct',
      thresholdPct: 50,
      cooldownSec: 0,
      bossOnly: false,
    });
    useUIStore.setState({ settings: { ...useUIStore.getState().settings, useConsumablesInCombat: true } });
    useGameStore.setState({
      stats: {
        hp: '40',
        maxHp: '100',
        atk: '1',
        def: '1',
        crit: 0,
        critDmg: 150,
        dodge: 0,
        regen: '0',
        speed: 1,
      },
    });
    useCombatStore.getState().hardResetCombat();

    useCombatStore.getState().enterCombat('test_zone', {
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
    });

    const lastUsed = useMedicinePouchStore.getState().slots.healing.lastUsedAt;
    assert.equal(typeof lastUsed, 'number');
    assert.equal(useInventoryStore.getState().getQty(itemId), 1);

    useCombatStore.getState().tick(100);
    assert.equal(useMedicinePouchStore.getState().slots.healing.lastUsedAt, lastUsed);
    assert.equal(useInventoryStore.getState().getQty(itemId), 1);
  });
});
