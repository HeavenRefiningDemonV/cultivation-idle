import assert from 'node:assert/strict';
import test from 'node:test';

import { rollAffixes, resolveAffixPool, rollGearInstance } from '../../src/systems/equipment/gearRoll.js';
import type { ItemDef, AffixDef, GearRarity } from '../../src/systems/equipment/gearModel.js';

const def = (gearSlot: 'weapon' | 'accessory', affixPool: string[]): ItemDef => ({
  id: 'demo', name: 'demo', description: '', type: 'weapon', rarity: 'common', level: 1,
  value: '0', stackable: false, maxStack: 1, gearSlot, affixPool,
});
const affixDef = (affixId: string, rollRange: { min: number; max: number }, rarityFloor: GearRarity = 'common'): AffixDef =>
  ({ affixId, label: affixId, channel: 'physAttack', rollRange, rarityFloor, affixClass: 'flat' });

void test('D8 roll — INERT while held: a held ItemDef rolls ZERO affixes (count band {0,0} ⇒ 0)', () => {
  const inst = rollGearInstance(def('weapon', ['phys_attack_pct', 'crit_chance_pct']), 'common', 12345);
  assert.deepEqual(inst.affixes, [], 'held affix-count band ⇒ no affixes (preserve-first inert)');
  assert.equal(inst.elementPayload, null, 'element payload is the honest null placeholder');
  assert.equal(inst.defId, 'demo');
});

void test('D8 roll — the pure core is provable with INJECTED non-held count + range', () => {
  // inject count 2 + a non-held range {min:1,max:1} ⇒ 2 affixes, each valuePct 1
  const pool = [affixDef('a', { min: 1, max: 1 }), affixDef('b', { min: 1, max: 1 })];
  const out = rollAffixes({ affixDefs: pool, count: 2, seed: 999 });
  assert.equal(out.affixes.length, 2);
  for (const a of out.affixes) assert.equal(a.valuePct, 1);
});

void test('D8 roll — deterministic: same seed ⇒ same affixes', () => {
  const pool = [affixDef('a', { min: 0, max: 10 }), affixDef('b', { min: 0, max: 10 })];
  const a = rollAffixes({ affixDefs: pool, count: 3, seed: 42 });
  const b = rollAffixes({ affixDefs: pool, count: 3, seed: 42 });
  assert.deepEqual(a, b, 'reproducible from the seed');
  const c = rollAffixes({ affixDefs: pool, count: 3, seed: 43 });
  assert.notDeepEqual(a.affixes, c.affixes, 'a different seed rolls differently');
});

void test('D8 roll — empty-pool guard: count > 0 with no pool ⇒ [] (no NaN/throw)', () => {
  assert.deepEqual(rollAffixes({ affixDefs: [], count: 2, seed: 1 }).affixes, []);
});

void test('D8 roll — rarityFloor admissibility (structural rank, not the UI order)', () => {
  // status_resist floors at uncommon ⇒ excluded from a common roll, included at uncommon+
  const item = def('accessory', ['phys_attack_pct', 'status_resist']);
  const common = resolveAffixPool(item, 'common').map((d) => d.affixId);
  assert.equal(common.includes('status_resist'), false, 'uncommon-floor affix excluded from a common roll');
  assert.equal(common.includes('phys_attack_pct'), true);
  const uncommon = resolveAffixPool(item, 'uncommon').map((d) => d.affixId);
  assert.equal(uncommon.includes('status_resist'), true, 'admitted once the rarity floor is met');
});
