import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSetBonusGrant } from '../../src/systems/equipment/gearSetBonus.js';
import { SET_BONUS_DEFS, HELD_MULT } from '../../src/content/gearSetBonuses.js';

void test('D8 set-bonus — NO authored multiplier: every grant value is the held identity 1', () => {
  assert.equal(HELD_MULT, 1);
  for (const def of SET_BONUS_DEFS) {
    for (const v of [...Object.values(def.partial), ...Object.values(def.full)]) {
      assert.equal(v, HELD_MULT, `${def.setId}: every grant value held at the identity 1 (×1 ⇒ no effect)`);
    }
  }
});

void test('D8 set-bonus — INACTIVE tier ⇒ {} (no grant)', () => {
  assert.deepEqual(resolveSetBonusGrant('stoneforged', null), {});
  assert.deepEqual(resolveSetBonusGrant('unknown-set', 'full'), {}, 'no def ⇒ {}');
});

void test('D8 set-bonus — partial vs full: the grant grows with the worn-count tier', () => {
  const partial = resolveSetBonusGrant('stoneforged', 'partial');
  const full = resolveSetBonusGrant('stoneforged', 'full');
  assert.deepEqual(Object.keys(partial).sort(), ['maxHp', 'physDefense']);
  assert.deepEqual(Object.keys(full).sort(), ['flatDamageReduction', 'maxHp', 'physDefense']);
  assert.ok(Object.keys(full).length > Object.keys(partial).length, 'the 3-piece grant is a superset shape');
  // the grant is a composeGear-style channel→multiplier map (currency), all identity while held
  for (const v of Object.values(full)) assert.equal(v, HELD_MULT);
});
