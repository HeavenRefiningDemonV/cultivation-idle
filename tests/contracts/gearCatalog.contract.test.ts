import assert from 'node:assert/strict';
import test from 'node:test';

import { GEAR_ITEM_DEFS } from '../../src/content/gearItems.js';
import type { GearSlot } from '../../src/systems/equipment/gearModel.js';

/**
 * M.III.1 EQ-MECH / S6 — gear-catalog integrity in the gate. The D8 gear catalog (gearItems.ts) is an
 * UNCONSUMED TypeScript demo module, NOT runtime JSON content — so scripts/validateContent.ts (which
 * validates the content-bible JSON via RUNTIME_CONTENT_FILE_BY_KEY) is the wrong layer for it; its shape
 * is already typecheck-validated against ItemDef. This contract puts the catalog's content IDS under gate
 * validation in the RIGHT layer: unique ids, the 5-slot taxonomy, and the per-path structural invariants.
 * When D15 authors real gear into the bible JSON, that file gets its validateContent entry then.
 */

const ALL_SLOTS: ReadonlySet<GearSlot> = new Set(['weapon', 'head', 'chest', 'legs', 'accessory']);
const ARMOR_SLOTS: ReadonlySet<GearSlot> = new Set(['head', 'chest', 'legs']);

test('S6 catalog: every gear def has a unique id', () => {
  const ids = GEAR_ITEM_DEFS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate gear ids');
});

test('S6 catalog: every def carries a valid 5-slot gearSlot + the ItemDefinition base fields', () => {
  for (const def of GEAR_ITEM_DEFS) {
    assert.ok(def.gearSlot && ALL_SLOTS.has(def.gearSlot), `${def.id}: gearSlot ∈ the 5-slot taxonomy`);
    assert.ok(typeof def.name === 'string' && def.name.length > 0, `${def.id}: name`);
    assert.ok(typeof def.rarity === 'string', `${def.id}: rarity`);
    assert.ok(typeof def.type === 'string', `${def.id}: type`);
  }
});

test('S6 catalog: weaponBondable is weapon-only (bond is a Martial-weapon mechanic)', () => {
  for (const def of GEAR_ITEM_DEFS) {
    if (def.weaponBondable) assert.equal(def.gearSlot, 'weapon', `${def.id}: only a weapon may be bondable`);
  }
});

test('S6 catalog: setId lives on armor slots (Earth armor sets), and a set has >1 member', () => {
  const bySet = new Map<string, string[]>();
  for (const def of GEAR_ITEM_DEFS) {
    if (!def.setId) continue;
    assert.ok(def.gearSlot && ARMOR_SLOTS.has(def.gearSlot), `${def.id}: a set piece must be armor`);
    bySet.set(def.setId, [...(bySet.get(def.setId) ?? []), def.id]);
  }
  for (const [setId, members] of bySet) {
    assert.ok(members.length > 1, `set ${setId} should have >1 member, has ${members.length}`);
  }
});

test('S6 catalog: every def declares an affixPool (the roll-time source, even while bands are HELD)', () => {
  for (const def of GEAR_ITEM_DEFS) {
    assert.ok(Array.isArray(def.affixPool) && def.affixPool.length > 0, `${def.id}: affixPool present`);
  }
});
