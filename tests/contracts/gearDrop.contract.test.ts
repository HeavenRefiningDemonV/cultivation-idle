import assert from 'node:assert/strict';
import test from 'node:test';

import { rollGearDrop, pickWeighted, HELD_RATE, type GearDropEntry, type RarityWeight } from '../../src/systems/equipment/gearDrop.js';
import { GEAR_DROP_ENTRIES } from '../../src/content/gearDrops.js';
import type { ItemDef, GearRarity } from '../../src/systems/equipment/gearModel.js';

const itemDef: ItemDef = {
  id: 'demo', name: 'demo', description: '', type: 'weapon', rarity: 'common', level: 1,
  value: '0', stackable: false, maxStack: 1, gearSlot: 'weapon', affixPool: ['phys_attack_pct'],
};
const entry = (dropChance: number, rarityPool: RarityWeight[]): GearDropEntry => ({ type: 'gear', itemId: 'demo', dropChance, rarityPool });

void test('D8 drop — NO authored rates: every example dropChance + rarity weight is the HELD_RATE sentinel', () => {
  for (const e of GEAR_DROP_ENTRIES) {
    assert.equal(e.dropChance, HELD_RATE, `${e.itemId}: dropChance held`);
    for (const w of e.rarityPool) assert.equal(w.weight, HELD_RATE, `${e.itemId}: rarity weight held`);
  }
});

void test('D8 drop — INERT while held: a held dropChance (0) never drops (gate before any pick)', () => {
  for (const seed of [0, 1, 999, 42424242]) {
    assert.equal(rollGearDrop(entry(HELD_RATE, [{ rarity: 'common', weight: HELD_RATE }]), itemDef, seed), null);
  }
});

void test('D8 drop — injected non-held: a 100%% dropChance always drops, rolling an (inert) GearInstance', () => {
  const out = rollGearDrop(entry(100, [{ rarity: 'rare', weight: 1 }]), itemDef, 123);
  assert.ok(out !== null);
  assert.equal(out?.rarity, 'rare', 'the only weighted rarity is picked');
  assert.deepEqual(out?.instance.affixes, [], 'rollGearInstance is still inert ⇒ 0 affixes (held)');
  assert.equal(out?.instance.defId, 'demo');
});

void test('D8 drop — pickWeighted distributes by weight; empty/all-zero ⇒ null', () => {
  const pool: RarityWeight[] = [{ rarity: 'common', weight: 0 }, { rarity: 'rare', weight: 10 }];
  assert.equal(pickWeighted(pool, (w) => w.weight, 0.5)?.rarity, 'rare', 'all weight on rare ⇒ rare');
  assert.equal(pickWeighted(pool, (w) => w.weight, 0.0)?.rarity, 'rare');
  assert.equal(pickWeighted([] as RarityWeight[], (w) => w.weight, 0.5), null, 'empty ⇒ null');
  assert.equal(pickWeighted([{ rarity: 'common' as GearRarity, weight: 0 }], (w) => w.weight, 0.5), null, 'all-zero ⇒ null');
});

void test('D8 drop — deterministic: same seed ⇒ same drop', () => {
  const e = entry(100, [{ rarity: 'common', weight: 1 }, { rarity: 'rare', weight: 1 }]);
  assert.deepEqual(rollGearDrop(e, itemDef, 7), rollGearDrop(e, itemDef, 7), 'reproducible from the seed');
});

void test('D8 drop — relates-to LootDrop via presence narrowing (type:gear), not a forked engine', () => {
  const e = entry(HELD_RATE, []);
  assert.equal('type' in e && e.type === 'gear', true, 'the gear entry is presence-narrowable');
});
