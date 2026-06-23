import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateEquip, accessorySlotCount, bondEligible, resolveSetBonus, HELD_COUNT, EMPTY_LOADOUT, type Loadout,
} from '../../src/systems/equipment/gearLoadout.js';
import type { ItemDef, GearSlot, GearInstance } from '../../src/systems/equipment/gearModel.js';

const def = (gearSlot: GearSlot, extra?: Partial<ItemDef>): ItemDef => ({
  id: 'demo', name: 'demo', description: '', type: 'weapon', rarity: 'common', level: 1,
  value: '0', stackable: false, maxStack: 1, gearSlot, ...extra,
});
const inst = (defId: string): GearInstance => ({ instanceId: defId, defId, rarity: 'common', affixes: [] });

void test('D8 equip — NO authored gate numbers: counts/thresholds use the HELD_COUNT sentinel', () => {
  assert.equal(HELD_COUNT, -1);
  // the accessory count floors at 1 while held (never-zero-gate), regardless of realm
  assert.equal(accessorySlotCount(1), 1);
  assert.equal(accessorySlotCount(7), 1);
});

void test('D8 equip — slot match: the item DEF slot must equal the target slot', () => {
  assert.equal(validateEquip({ loadout: EMPTY_LOADOUT, itemDef: def('weapon'), targetSlot: 'weapon', realm: 3 }).ok, true);
  const bad = validateEquip({ loadout: EMPTY_LOADOUT, itemDef: def('weapon'), targetSlot: 'head', realm: 3 });
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'slot-mismatch');
});

void test('D8 equip — never-zero-gate: a held accessory count still admits the first accessory', () => {
  assert.equal(validateEquip({ loadout: EMPTY_LOADOUT, itemDef: def('accessory'), targetSlot: 'accessory', realm: 1 }).ok, true);
  // at the held floor of 1, a SECOND accessory is rejected
  const full: Loadout = { ...EMPTY_LOADOUT, accessories: [inst('a1')] };
  const r = validateEquip({ loadout: full, itemDef: def('accessory'), targetSlot: 'accessory', realm: 1 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'accessory-limit');
});

void test('D8 equip — bond is Martial-only (structural eligibility, NOT an equip block)', () => {
  const sabre = def('weapon', { weaponBondable: true });
  assert.equal(bondEligible(sabre, 'martial'), true);
  assert.equal(bondEligible(sabre, 'heaven'), false);
  assert.equal(bondEligible(def('weapon'), 'martial'), false, 'non-bondable ⇒ not eligible');
  // a non-Martial can still EQUIP a bondable weapon (bond ≠ equip)
  assert.equal(validateEquip({ loadout: EMPTY_LOADOUT, itemDef: sabre, targetSlot: 'weapon', realm: 3 }).ok, true);
});

void test('D8 equip — set bonus counts worn pieces but stays INACTIVE while thresholds held', () => {
  const worn = [def('head', { setId: 's' }), def('chest', { setId: 's' }), def('legs', { setId: 's' })];
  const bonus = resolveSetBonus(worn);
  assert.equal(bonus.length, 1);
  assert.equal(bonus[0]?.setId, 's');
  assert.equal(bonus[0]?.count, 3);
  assert.equal(bonus[0]?.activeTier, null, 'held thresholds ⇒ never active (preserve-first)');
  // a piece with no setId contributes nothing
  assert.equal(resolveSetBonus([def('weapon')]).length, 0);
});
