import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveLegacyCombatStats,
  mapAxisViewsToRecord,
  mapFoundationViewsToRecord,
  normalizeDerivedSpeed,
} from '../../src/systems/meridians/combatStatBridge.js';
import { DERIVED_STAT_KEYS, type DerivedStatKey } from '../../src/systems/meridians/derivedStats.js';

function derived(overrides: Partial<Record<DerivedStatKey, number>> = {}): Record<DerivedStatKey, number> {
  const base = Object.fromEntries(DERIVED_STAT_KEYS.map((k) => [k, 0])) as Record<DerivedStatKey, number>;
  return {
    ...base,
    maxHp: 1000,
    physAttack: 200,
    physDefense: 80,
    hpRegen: 12,
    critChance: 17,
    critDamage: 165,
    evasion: 9,
    speed: 250,
    ...overrides,
  };
}

test('deriveLegacyCombatStats maps the eight legacy channels (GEO direct as strings, GENTLE sourced)', () => {
  const m = deriveLegacyCombatStats(derived());
  // GEO — direct, emitted as Decimal strings to match the REALMS baseStats shape.
  assert.equal(m.hp, '1000'); // maxHp
  assert.equal(m.atk, '200'); // physAttack
  assert.equal(m.def, '80'); // physDefense
  assert.equal(m.regen, '12'); // hpRegen
  // GENTLE — sourced from the derived channels (numbers).
  assert.equal(m.crit, 17); // critChance
  assert.equal(m.critDmg, 165); // critDamage
  assert.equal(m.dodge, 9); // evasion
  // speed normalized into the legacy 1.0–1.5 band (the one non-pass-through channel).
  assert.ok(m.speed >= 1.0 && m.speed <= 1.5, `speed ${m.speed} must be in [1.0, 1.5]`);
});

test('speed normalization stays in the 1.0–1.5 band, anchored at 1.0, monotonic, saturating', () => {
  assert.equal(normalizeDerivedSpeed(0), 1.0);
  assert.ok(normalizeDerivedSpeed(100) > 1.0);
  assert.ok(normalizeDerivedSpeed(200) >= normalizeDerivedSpeed(100));
  assert.ok(normalizeDerivedSpeed(1e9) <= 1.5);
  assert.ok(normalizeDerivedSpeed(-50) >= 1.0); // clamps negatives
});

test('foundation/axis view→record rename maps Court snake ids to derived camel keys', () => {
  const foundation = mapFoundationViewsToRecord([
    { id: 'physique', zi: '', name: '', value: 5 },
    { id: 'vitality', zi: '', name: '', value: 7 },
    { id: 'agility', zi: '', name: '', value: 3 },
    { id: 'perception', zi: '', name: '', value: 9 },
    { id: 'willpower', zi: '', name: '', value: 2 },
    { id: 'luck', zi: '', name: '', value: 99 }, // not a derived foundation key → dropped
  ]);
  assert.equal(foundation.physique, 5);
  assert.equal(foundation.vitality, 7);
  assert.equal(foundation.agility, 3);
  assert.equal(foundation.perception, 9);
  assert.equal(foundation.willpower, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(foundation, 'luck'), false);

  const axes = mapAxisViewsToRecord([
    { id: 'cultivation_base', zi: '', name: '', value: 11 },
    { id: 'qi_pool', zi: '', name: '', value: 3 },
    { id: 'qi_purity', zi: '', name: '', value: 4 },
    { id: 'meridian_openness', zi: '', name: '', value: 6 },
    { id: 'spiritual_sense', zi: '', name: '', value: 8 },
    { id: 'soul_strength', zi: '', name: '', value: 1 },
    { id: 'dao_comprehension', zi: '', name: '', value: 10 },
  ]);
  assert.equal(axes.cultivationBase, 11);
  assert.equal(axes.qiPool, 3);
  assert.equal(axes.qiPurity, 4);
  assert.equal(axes.meridianOpenness, 6);
  assert.equal(axes.spiritualSense, 8);
  assert.equal(axes.soulStrength, 1);
  assert.equal(axes.daoComprehension, 10);
});
