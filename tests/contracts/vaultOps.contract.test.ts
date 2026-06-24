import assert from 'node:assert/strict';
import test from 'node:test';

import { GEAR_ITEM_DEFS } from '../../src/content/gearItems.js';
import type { GearInstance, ItemDef } from '../../src/systems/equipment/gearModel.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import {
  arrangeVaultInstances,
  buildVaultExactSurface,
  filterVaultInstances,
  sortVaultInstances,
} from '../../src/systems/ui/equipment/index.js';

/**
 * M.III.1 EQ-MECH / S4 — Vault ops: the pure sort/filter resolvers, the confirm-gated dismantle (HELD
 * yield), and the §F idle-parity invariant (gear that arrives via the idle/offline path is a first-class
 * citizen — readable, sortable, dismantlable, and equippable on return, identical to a live-acquired drop).
 */

const getDef = (defId: string): ItemDef | undefined => GEAR_ITEM_DEFS.find((d) => d.id === defId);
const gi = (instanceId: string, defId: string, rarity: GearInstance['rarity']): GearInstance =>
  ({ instanceId, defId, rarity, affixes: [] });

const SABRE = getDef('demo_cinnabar_sabre')!;

const reset = () => {
  useEquipmentStore.getState().hardResetEquipment();
  useInventoryStore.getState().hardResetInventory();
};

const SAMPLE: GearInstance[] = [
  gi('w-common', 'demo_cinnabar_sabre', 'common'),
  gi('w-legendary', 'demo_cinnabar_sabre', 'legendary'),
  gi('head-epic', 'demo_stoneforged_helm', 'epic'),
  gi('acc-rare', 'demo_foresight_pendant', 'rare'),
];

test('S4 filter: slot family + grade narrow the held set (pure, input order preserved)', () => {
  const weapons = filterVaultInstances(SAMPLE, getDef, { slot: 'weapon', grade: 'all' });
  assert.deepEqual(weapons.map((i) => i.instanceId), ['w-common', 'w-legendary']);
  const armor = filterVaultInstances(SAMPLE, getDef, { slot: 'armor', grade: 'all' });
  assert.deepEqual(armor.map((i) => i.instanceId), ['head-epic']);
  const epics = filterVaultInstances(SAMPLE, getDef, { slot: 'all', grade: 'epic' });
  assert.deepEqual(epics.map((i) => i.instanceId), ['head-epic']);
});

test('S4 sort: rarity desc puts legendary first; recent asc is insertion order; both stable', () => {
  const byRarity = sortVaultInstances(SAMPLE, getDef, { by: 'rarity', dir: 'desc' });
  assert.equal(byRarity[0].instanceId, 'w-legendary');
  assert.equal(byRarity[byRarity.length - 1].instanceId, 'w-common');
  const recent = sortVaultInstances(SAMPLE, getDef, { by: 'recent', dir: 'asc' });
  assert.deepEqual(recent.map((i) => i.instanceId), SAMPLE.map((i) => i.instanceId));
});

test('S4 arrange: filter then sort composes (weapons, rarity desc)', () => {
  const arranged = arrangeVaultInstances(SAMPLE, getDef, { slot: 'weapon', grade: 'all' }, { by: 'rarity', dir: 'desc' });
  assert.deepEqual(arranged.map((i) => i.instanceId), ['w-legendary', 'w-common']);
});

test('S4 dismantle: removes the held instance and returns a HELD-empty yield event (shape, not a number)', () => {
  reset();
  useInventoryStore.getState().addGearInstance(gi('to-scrap', 'demo_cinnabar_sabre', 'common'));
  const result = useInventoryStore.getState().dismantleGearInstance('to-scrap');
  assert.equal(result.ok, true);
  assert.equal(result.instanceId, 'to-scrap');
  assert.ok(Array.isArray(result.yield), 'yield is the event shape (a list)');
  assert.deepEqual(result.yield, [], 'yield magnitude HELD ⇒ empty while D15 owns it');
  assert.equal(useInventoryStore.getState().getGearInstance('to-scrap'), undefined, 'the instance is gone from the Vault');
  // dismantling an absent id is a clean no-op
  const missing = useInventoryStore.getState().dismantleGearInstance('to-scrap');
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.yield, []);
});

test('S4 §F idle-parity: an idle-credited drop is readable, sortable, dismantlable, and equippable on return', () => {
  reset();
  // simulate the offline/idle path crediting a drop directly into the Vault
  const idleDrop = gi('idle-drop', 'demo_cinnabar_sabre', 'epic');
  useInventoryStore.getState().addGearInstance(idleDrop);

  // readable
  assert.equal(useInventoryStore.getState().getGearInstance('idle-drop')?.instanceId, 'idle-drop');
  const vault = buildVaultExactSurface({
    gearInstances: useInventoryStore.getState().gearInstances,
    getDef,
    loadout: useEquipmentStore.getState().loadout,
    filter: { slot: 'all', grade: 'all' },
    sort: { by: 'rarity', dir: 'desc' },
  });
  assert.ok(vault.slips.some((s) => s.instanceId === 'idle-drop'), 'idle drop appears in the Vault surface');

  // sortable/filterable like any instance
  const weapons = arrangeVaultInstances(
    Object.values(useInventoryStore.getState().gearInstances), getDef, { slot: 'weapon', grade: 'all' }, { by: 'rarity', dir: 'desc' },
  );
  assert.ok(weapons.some((i) => i.instanceId === 'idle-drop'));

  // equippable on return — the same equip path as a live drop
  const equip = useEquipmentStore.getState().equipInstance(idleDrop, SABRE, 'weapon', 2);
  assert.equal(equip.ok, true);
  assert.equal(useEquipmentStore.getState().loadout.weapon?.instanceId, 'idle-drop');
});
