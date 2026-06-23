import assert from 'node:assert/strict';
import test from 'node:test';

import { AFFIX_TABLE, AFFIX_LEGAL_CHANNELS, RARITY_BANDS, HELD } from '../../src/content/gearAffixes.js';
import { GEAR_ITEM_DEFS } from '../../src/content/gearItems.js';
import type { GearSlot, GearAffix } from '../../src/systems/equipment/gearModel.js';
import type { EquipmentSlot } from '../../src/stores/equipmentStore.js';
import type { GearTemperAffix } from '../../src/systems/equipment/equipmentGearResolver.js';

void test('D8 schema — NO authored balance: every affix rollRange + rarity band is the HELD sentinel', () => {
  for (const a of AFFIX_TABLE) assert.equal(a.rollRange, HELD, `${a.affixId}: rollRange must be the HELD sentinel`);
  const bands = Object.values(RARITY_BANDS);
  assert.ok(bands.length > 0);
  for (const r of bands) {
    assert.equal(r?.affixCount, HELD, 'affix-count band held (DR-08 numbers are F-BAL’s)');
    assert.equal(r?.powerMult, 1, 'powerMult held at the identity 1 (×1.00…×1.45 ladder is F-BAL’s)');
  }
});

void test('D8 schema — affix channels are legal: the live channels minus suppression (20)', () => {
  assert.equal(AFFIX_LEGAL_CHANNELS.length, 20, '21 derived channels minus suppression');
  assert.equal(AFFIX_LEGAL_CHANNELS.includes('suppression' as never), false, 'suppression excluded (§K.2)');
  for (const a of AFFIX_TABLE) assert.ok(AFFIX_LEGAL_CHANNELS.includes(a.channel), `${a.channel} must be affix-legal`);
});

void test('D8 schema — builds ON the live vocabulary (compile-time supersets, no parallel model)', () => {
  // GearSlot ⊇ EquipmentSlot (legacy values widen cleanly)
  const legacy: EquipmentSlot = 'weapon';
  const gear: GearSlot = legacy;
  assert.equal(gear, 'weapon');
  // a rolled GearAffix's valuePct is the composition currency that bridges to the live GearTemperAffix
  const affix: GearAffix = { affixId: 'phys_attack_pct', channel: 'physAttack', valuePct: 0 };
  const bridged: GearTemperAffix = { stat: 'atkPct', valuePct: affix.valuePct };
  assert.equal(bridged.valuePct, 0);
});

void test('D8 schema — the armor 3-slot set: head/chest/legs share a setId', () => {
  const set = GEAR_ITEM_DEFS.filter((d) => d.setId === 'stoneforged');
  assert.deepEqual(set.map((d) => d.gearSlot).sort(), ['chest', 'head', 'legs']);
});

void test('D8 schema — per-path placeholders are honest; no authored base power', () => {
  const weapon = GEAR_ITEM_DEFS.find((d) => d.gearSlot === 'weapon');
  assert.equal(weapon?.weaponBondable, true, 'Martial weapon is bondable (placeholder flag)');
  for (const d of GEAR_ITEM_DEFS) assert.equal(d.baseChannels, undefined, 'no authored base-power magnitudes');
});
