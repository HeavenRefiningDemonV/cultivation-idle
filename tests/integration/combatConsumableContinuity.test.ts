import assert from 'node:assert/strict';
import test from 'node:test';

import { getConsumableSpec, isCombatUsableConsumable } from '../../src/systems/consumables/consumableCatalog.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { setInventoryStoreGetter, useGameStore } from '../../src/stores/gameStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';

const resetStores = () => {
  useCombatStore.getState().hardResetCombat();
  useGameStore.getState().hardResetGameState();
  useInventoryStore.getState().hardResetInventory();
  setInventoryStoreGetter(() => useInventoryStore.getState());
};

test.beforeEach(() => {
  resetStores();
});

test('combat consumable specs preserve the locked live values and medicine pouch eligibility stays combat-only', () => {
  const healing = getConsumableSpec('cons_healing_pellet_t1');
  const focus = getConsumableSpec('cons_focus_tonic_t1');
  const antiVenom = getConsumableSpec('cons_anti_venom_pellet_t1');

  assert.equal(healing?.domain, 'combat');
  assert.deepEqual(healing?.effect, { kind: 'healPct', pct: 0.3 });
  assert.equal(focus?.domain, 'combat');
  assert.deepEqual(focus?.effect, { kind: 'combatBuff', stat: 'crit', mode: 'flat', value: 0.05, durationSec: 25 });
  assert.equal(antiVenom?.domain, 'combat');
  assert.equal(antiVenom?.effect.kind, 'cleanseOrFallbackCombatBuff');

  assert.equal(isCombatUsableConsumable('cons_qi_elixir_t1'), false);
  assert.equal(isCombatUsableConsumable('cons_quiet_breath_tea_t1'), false);
});

test('combat use path still consumes healing pellets through CombatStore', () => {
  useInventoryStore.getState().addItem('cons_healing_pellet_t1', 1);
  const enemy = {
    id: 'enemy_test',
    name: 'Training Beast',
    level: 1,
    zone: 'test',
    hp: '100',
    atk: '5',
    def: '1',
    crit: 0,
    critDmg: 150,
    dodge: 0,
    speed: 1,
    goldReward: '0',
    expReward: '0',
    isBoss: false,
  };

  useCombatStore.getState().enterCombat('test_zone', enemy);
  useCombatStore.setState((state) => ({
    ...state,
    playerHP: '40',
    playerMaxHP: '100',
  }));

  const result = useCombatStore.getState().consumeCombatConsumable('cons_healing_pellet_t1', 'manual', 10_000);
  assert.equal(result.ok, true);
  assert.equal(useCombatStore.getState().playerHP, '70');
  assert.equal(useInventoryStore.getState().getQty('cons_healing_pellet_t1'), 0);
});
