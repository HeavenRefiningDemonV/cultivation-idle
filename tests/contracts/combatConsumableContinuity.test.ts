import assert from 'node:assert/strict';
import test from 'node:test';

import { getConsumableSpec, isCombatUsableConsumable } from '../../src/systems/consumables/consumableCatalog.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';

const combatExpectations: Record<string, { cooldownSec: number; kind: string }> = {
  cons_healing_pellet_t1: { cooldownSec: 10, kind: 'healPct' },
  cons_ironblood_pellet_t1: { cooldownSec: 60, kind: 'combatBuff' },
  cons_ironblood_pellet_t2: { cooldownSec: 60, kind: 'combatBuff' },
  cons_windstep_powder_t1: { cooldownSec: 60, kind: 'combatBuff' },
  cons_windstep_powder_t2: { cooldownSec: 60, kind: 'combatBuff' },
  cons_ward_salt_t1: { cooldownSec: 45, kind: 'shieldPct' },
  cons_ward_salt_t2: { cooldownSec: 45, kind: 'shieldPct' },
  cons_anti_venom_pellet_t1: { cooldownSec: 75, kind: 'cleanseOrFallbackBuff' },
  cons_focus_tonic_t1: { cooldownSec: 90, kind: 'combatBuff' },
  cons_mastery_tonic_t1: { cooldownSec: 90, kind: 'combatBuff' },
};

test.beforeEach(() => {
  useMedicinePouchStore.getState().hardReset();
  useInventoryStore.getState().hardResetInventory();
});

test('combat consumables keep their locked effect kinds and cultivation items stay pouch-ineligible', () => {
  Object.entries(combatExpectations).forEach(([itemId, expected]) => {
    const spec = getConsumableSpec(itemId);
    assert.ok(spec);
    assert.equal(spec?.domain, 'combat');
    assert.equal(spec?.cooldownSec, expected.cooldownSec);
    assert.equal(spec?.effect.kind, expected.kind);
    assert.equal(isCombatUsableConsumable(itemId), true);
  });

  assert.equal(isCombatUsableConsumable('cons_qi_elixir_t1'), false);
  useInventoryStore.getState().addItem('cons_qi_elixir_t1', 2);
  useMedicinePouchStore.getState().equip('utility', 'cons_qi_elixir_t1');
  assert.equal(useMedicinePouchStore.getState().slots.utility.equippedItemId, null);
  const combatEligible = Object.keys(useInventoryStore.getState().items).filter((itemId) => isCombatUsableConsumable(itemId));
  assert.deepEqual(combatEligible, []);
});
