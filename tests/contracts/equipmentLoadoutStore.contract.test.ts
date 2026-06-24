import assert from 'node:assert/strict';
import test from 'node:test';

import { GEAR_ITEM_DEFS } from '../../src/content/gearItems.js';
import { selectWornDefs, selectWornInstances } from '../../src/stores/equipmentLoadoutSelectors.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import type { GearInstance, ItemDef } from '../../src/systems/equipment/gearModel.js';

const getDef = (defId: string): ItemDef | undefined => GEAR_ITEM_DEFS.find((d) => d.id === defId);
const SABRE = getDef('demo_cinnabar_sabre')!; // gearSlot 'weapon'
const PENDANT = getDef('demo_foresight_pendant')!; // gearSlot 'accessory'

const instance = (instanceId: string, defId: string): GearInstance => ({ instanceId, defId, rarity: 'common', affixes: [] });

const reset = () => {
  useEquipmentStore.getState().hardResetEquipment();
  useInventoryStore.getState().hardResetInventory();
};

test('S1: equipping an instance into a matching slot populates loadout[slot]', () => {
  reset();
  const gi = instance('gi-weapon-1', 'demo_cinnabar_sabre');
  const result = useEquipmentStore.getState().equipInstance(gi, SABRE, 'weapon', 0);
  assert.equal(result.ok, true);
  assert.equal(useEquipmentStore.getState().loadout.weapon?.instanceId, 'gi-weapon-1');
});

test('S1: a slot-mismatch is rejected via validateEquip and leaves the loadout untouched', () => {
  reset();
  const gi = instance('gi-weapon-1', 'demo_cinnabar_sabre');
  // the sabre's def slot is 'weapon'; target 'head' must reject
  const result = useEquipmentStore.getState().equipInstance(gi, SABRE, 'head', 0);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'slot-mismatch');
  assert.equal(useEquipmentStore.getState().loadout.head, null);
});

test('S1: the accessory limit holds (HELD floor 1) — a second accessory is rejected', () => {
  reset();
  const first = useEquipmentStore.getState().equipInstance(instance('gi-acc-1', 'demo_foresight_pendant'), PENDANT, 'accessory', 0);
  assert.equal(first.ok, true);
  assert.equal(useEquipmentStore.getState().loadout.accessories.length, 1);
  const second = useEquipmentStore.getState().equipInstance(instance('gi-acc-2', 'demo_foresight_pendant'), PENDANT, 'accessory', 0);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'accessory-limit');
  assert.equal(useEquipmentStore.getState().loadout.accessories.length, 1, 'the held floor-of-1 was not exceeded');
});

test('S1: unequipSlot clears the slot and bumps the loadout version', () => {
  reset();
  const before = useEquipmentStore.getState().gearLoadoutVersion;
  useEquipmentStore.getState().equipInstance(instance('gi-weapon-1', 'demo_cinnabar_sabre'), SABRE, 'weapon', 0);
  useEquipmentStore.getState().unequipSlot('weapon');
  assert.equal(useEquipmentStore.getState().loadout.weapon, null);
  assert.equal(useEquipmentStore.getState().gearLoadoutVersion > before, true);
});

test('S1: a new-model equip does NOT touch the legacy weapon/accessory fields (additive, no cross-contamination)', () => {
  reset();
  useEquipmentStore.getState().equipInstance(instance('gi-weapon-1', 'demo_cinnabar_sabre'), SABRE, 'weapon', 0);
  const s = useEquipmentStore.getState();
  assert.equal(s.equippedWeaponId, null, 'legacy equippedWeaponId untouched');
  assert.equal(s.equippedAccessoryId, null, 'legacy equippedAccessoryId untouched');
  assert.deepEqual(s.refineLevelBySlot, { weapon: 0, accessory: 0 }, 'legacy refine levels untouched');
});

test('S1: hardResetEquipment clears the loadout back to empty', () => {
  reset();
  useEquipmentStore.getState().equipInstance(instance('gi-weapon-1', 'demo_cinnabar_sabre'), SABRE, 'weapon', 0);
  useEquipmentStore.getState().equipInstance(instance('gi-acc-1', 'demo_foresight_pendant'), PENDANT, 'accessory', 0);
  useEquipmentStore.getState().hardResetEquipment();
  const loadout = useEquipmentStore.getState().loadout;
  assert.equal(loadout.weapon, null);
  assert.equal(loadout.accessories.length, 0);
});

test('S1: the Vault holds, reads, and removes GearInstances; reset clears it', () => {
  reset();
  const gi = instance('gi-weapon-1', 'demo_cinnabar_sabre');
  useInventoryStore.getState().addGearInstance(gi);
  assert.equal(useInventoryStore.getState().getGearInstance('gi-weapon-1')?.instanceId, 'gi-weapon-1');
  assert.equal(Object.keys(useInventoryStore.getState().gearInstances).length, 1);

  useInventoryStore.getState().removeGearInstance('gi-weapon-1');
  assert.equal(useInventoryStore.getState().getGearInstance('gi-weapon-1'), undefined);

  // the stackable items path is untouched by gear-instance ops
  useInventoryStore.getState().addItem('herb_basic', 3);
  useInventoryStore.getState().addGearInstance(instance('gi-2', 'demo_foresight_pendant'));
  assert.equal(useInventoryStore.getState().getQty('herb_basic'), 3, 'stackable items untouched by the Vault');

  useInventoryStore.getState().hardResetInventory();
  assert.equal(Object.keys(useInventoryStore.getState().gearInstances).length, 0);
});

test('S1: selectors read the loadout purely (worn instances + resolved defs)', () => {
  reset();
  useEquipmentStore.getState().equipInstance(instance('gi-weapon-1', 'demo_cinnabar_sabre'), SABRE, 'weapon', 0);
  useEquipmentStore.getState().equipInstance(instance('gi-acc-1', 'demo_foresight_pendant'), PENDANT, 'accessory', 0);
  const loadout = useEquipmentStore.getState().loadout;
  assert.equal(selectWornInstances(loadout).length, 2);
  const defs = selectWornDefs(loadout, getDef);
  assert.deepEqual(defs.map((d) => d.id).sort(), ['demo_cinnabar_sabre', 'demo_foresight_pendant']);
});
