import assert from 'node:assert/strict';
import test from 'node:test';

import { composeGear, type EquipmentGearInput, type GearTemperAffix } from '../../src/systems/equipment/equipmentGearResolver.js';
import type { TemperAffix } from '../../src/stores/equipmentStore.js';

const empty = (): EquipmentGearInput => ({
  equippedWeaponId: null,
  equippedAccessoryId: null,
  refineLevelBySlot: { weapon: 0, accessory: 0 },
  temperBonusesBySlot: { weapon: [], accessory: [] },
});

const affix = (stat: GearTemperAffix['stat'], valuePct: number): GearTemperAffix => ({ stat, valuePct });

void test('D8 composeGear — the live equipmentStore TemperAffix is structurally assignable (slice 1b wiring is type-safe)', () => {
  const live: TemperAffix = { id: 'hp_pct', label: 'Sturdy frame', stat: 'hpPct', valuePct: 0.04 };
  const gear = composeGear({ ...empty(), equippedAccessoryId: 'a', temperBonusesBySlot: { weapon: [], accessory: [live] } });
  assert.ok((gear.maxHp ?? 0) > 1, 'the real forge affix composes through the gear hook');
});

void test('D8 composeGear — nothing equipped ⇒ {} (the parity-safe identity)', () => {
  assert.deepEqual(composeGear(empty()), {});
  // stale refine/temper on an UNEQUIPPED slot is ignored (no item ⇒ no contribution)
  const stale = empty();
  stale.refineLevelBySlot.weapon = 10;
  stale.temperBonusesBySlot.weapon = [affix('atkPct', 0.05)];
  assert.deepEqual(composeGear(stale), {}, 'no equipped weapon ⇒ no gear, even with stale forge state');
});

void test('D8 composeGear — the worked example: weapon refine 5 + atkPct 5% ⇒ physAttack ×1.155', () => {
  const g: EquipmentGearInput = {
    ...empty(),
    equippedWeaponId: 'w1',
    refineLevelBySlot: { weapon: 5, accessory: 0 },
    temperBonusesBySlot: { weapon: [affix('atkPct', 0.05)], accessory: [] },
  };
  const gear = composeGear(g);
  // refine 5 ⇒ 1 + 0.02×5 = 1.10; atkPct 5% ⇒ ×1.05; composed ⇒ 1.155
  assert.ok(Math.abs((gear.physAttack ?? 0) - 1.155) < 1e-9);
  // no other channel touched
  assert.equal(gear.maxHp, undefined);
  assert.equal(gear.critChance, undefined);
});

void test('D8 composeGear — the affix→channel mapping (LIVE vocabulary → Tier-3 channels)', () => {
  const withAffixes = (slot: 'weapon' | 'accessory', affixes: GearTemperAffix[]): EquipmentGearInput => ({
    ...empty(),
    equippedWeaponId: slot === 'weapon' ? 'w' : null,
    equippedAccessoryId: slot === 'accessory' ? 'a' : null,
    temperBonusesBySlot: { weapon: slot === 'weapon' ? affixes : [], accessory: slot === 'accessory' ? affixes : [] },
  });
  assert.ok((composeGear(withAffixes('weapon', [affix('atkPct', 0.05)])).physAttack ?? 0) > 1);
  const def = composeGear(withAffixes('accessory', [affix('defPct', 0.04)]));
  assert.ok((def.physDefense ?? 0) > 1 && (def.flatDamageReduction ?? 0) > 1, 'defPct → physDefense + flatDamageReduction');
  const hp = composeGear(withAffixes('accessory', [affix('hpPct', 0.04)]));
  assert.ok((hp.maxHp ?? 0) > 1 && (hp.hpRegen ?? 0) > 1, 'hpPct → maxHp + hpRegen');
  assert.ok((hp.hpRegen ?? 0) < (hp.maxHp ?? 0), 'regen gets the half-share');
  assert.ok((composeGear(withAffixes('weapon', [affix('critPct', 0.03)])).critChance ?? 0) > 1, 'critPct → critChance (not critDamage)');
  assert.equal(composeGear(withAffixes('weapon', [affix('critPct', 0.03)])).critDamage, undefined);
  assert.ok((composeGear(withAffixes('accessory', [affix('dodgePct', 0.02)])).evasion ?? 0) > 1, 'dodgePct → evasion');
});

void test('D8 composeGear — refine is capped at 1.25 (the live curve, mirrored not retuned)', () => {
  const g: EquipmentGearInput = { ...empty(), equippedWeaponId: 'w', refineLevelBySlot: { weapon: 100, accessory: 0 } };
  assert.ok(Math.abs((composeGear(g).physAttack ?? 0) - 1.25) < 1e-9, 'refine 100 ⇒ capped at 1.25');
});
