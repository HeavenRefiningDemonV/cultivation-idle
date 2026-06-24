import assert from 'node:assert/strict';
import test from 'node:test';

import { GEAR_LEGENDARIES } from '../../src/content/gearLegendaries.js';
import { ALL_GEAR_DEFS, findGearItemDef } from '../../src/content/gearItems.js';

/**
 * D17 M.III.1 — the foundational legendary catalog (D8 §G). Catalog-completeness in the gate: the named apex
 * items resolve, every legendary carries its named signature mechanic (shape; magnitudes HELD → D15), and a
 * weapon legendary is bond-eligible. Mirrors gearCatalog.contract.test.ts (the rolled-pool integrity).
 */

test('M.III.1 legendary catalog: non-empty, unique ids, legendary rarity + rarityTier', () => {
  assert.ok(GEAR_LEGENDARIES.length > 0, 'the foundational legendary catalog has at least one apex');
  const ids = GEAR_LEGENDARIES.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate legendary ids');
  for (const d of GEAR_LEGENDARIES) {
    assert.equal(d.rarity, 'legendary', `${d.id}: rarity legendary`);
    assert.equal(d.rarityTier, 'legendary', `${d.id}: rarityTier legendary`);
  }
});

test('M.III.1 legendary catalog: every apex carries a named signature mechanic (name + body)', () => {
  for (const d of GEAR_LEGENDARIES) {
    assert.ok(d.signature, `${d.id}: signature present`);
    assert.ok((d.signature?.name ?? '').length > 0, `${d.id}: signature name`);
    assert.ok((d.signature?.body ?? '').length > 0, `${d.id}: signature body`);
  }
});

test('M.III.1 legendary catalog: each has a gearSlot + affixPool; a weapon apex is weapon-bond eligible', () => {
  for (const d of GEAR_LEGENDARIES) {
    assert.ok(d.gearSlot, `${d.id}: gearSlot`);
    assert.ok(Array.isArray(d.affixPool) && d.affixPool.length > 0, `${d.id}: affixPool present`);
    if (d.gearSlot === 'weapon') assert.equal(d.weaponBondable, true, `${d.id}: a weapon legendary is bondable (Martial bond)`);
  }
});

test('M.III.1 legendary catalog: every id resolves via findGearItemDef + is in ALL_GEAR_DEFS', () => {
  for (const d of GEAR_LEGENDARIES) {
    assert.equal(findGearItemDef(d.id)?.id, d.id, `${d.id} resolves via findGearItemDef`);
    assert.ok(ALL_GEAR_DEFS.some((x) => x.id === d.id), `${d.id} is in ALL_GEAR_DEFS`);
  }
});
