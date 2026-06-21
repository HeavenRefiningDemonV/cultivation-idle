import assert from 'node:assert/strict';
import test from 'node:test';
import {
  REALM_SCALAR_RATIO,
  computeDerivedStats,
  derivedRealmScalar,
  type AxisKey,
  type DerivedStatInput,
  type FoundationKey,
} from '../../src/systems/meridians/derivedStats.js';
import { calibrateGeoBase, deriveLegacyCombatStats } from '../../src/systems/meridians/combatStatBridge.js';

/**
 * F1 / SA-A2 — unit-level parity proof (the fast-floor complement to the e2e parity gate).
 * Proves the realm scalar is geometric at the legacy ×5 ratio AND that the calibrated derived
 * GEO base reproduces the RAW REALMS curve for the reference cultivator (all shared ratings =
 * 100). Since both engines then run the identical multiplier stack, equal raw bases ⇒ equal
 * `state.stats` ⇒ the per-realm parity the harness confirms end-to-end.
 */

const REF_FOUNDATION: Record<FoundationKey, number> = {
  physique: 100,
  vitality: 100,
  agility: 100,
  perception: 100,
  willpower: 100,
};
const REF_AXES: Record<AxisKey, number> = {
  cultivationBase: 100,
  qiPool: 100,
  qiPurity: 100,
  meridianOpenness: 100,
  spiritualSense: 100,
  soulStrength: 100,
  daoComprehension: 100,
};

function refInput(realmIndex1to7: number): DerivedStatInput {
  return { foundation: { ...REF_FOUNDATION }, axes: { ...REF_AXES }, meridianRatings: {}, realmIndex1to7 };
}

// The RAW REALMS GEO base per live realm (src/constants/index.ts) — the parity target.
const REALMS_GEO = [
  { hp: 100, atk: 10, def: 5, regen: 1 },
  { hp: 500, atk: 50, def: 25, regen: 5 },
  { hp: 2500, atk: 250, def: 125, regen: 25 },
  { hp: 12500, atk: 1250, def: 625, regen: 125 },
  { hp: 62500, atk: 6250, def: 3125, regen: 625 },
  { hp: 312500, atk: 31250, def: 15625, regen: 3125 },
];

test('SA-A2 realm scalar is geometric at the legacy ×5 ratio, anchored at 1.0', () => {
  assert.equal(REALM_SCALAR_RATIO, 5);
  assert.equal(derivedRealmScalar(1), 1); // the pinned anchor (preserved)
  assert.equal(derivedRealmScalar(2), 5);
  assert.equal(derivedRealmScalar(6), 5 ** 5);
  assert.ok(derivedRealmScalar(7) > derivedRealmScalar(1));
});

test('SA-A2 calibrated derived GEO base reproduces the raw REALMS curve for the reference cultivator', () => {
  for (let idx = 0; idx < REALMS_GEO.length; idx += 1) {
    const calibrated = calibrateGeoBase(deriveLegacyCombatStats(computeDerivedStats(refInput(idx + 1), {})));
    const target = REALMS_GEO[idx];
    const approx = (got: number, want: number, label: string) =>
      assert.ok(Math.abs(got - want) / want < 1e-6, `realm ${idx + 1} ${label}: got ${got}, want ${want}`);
    approx(Number(calibrated.hp), target.hp, 'hp');
    approx(Number(calibrated.atk), target.atk, 'atk');
    approx(Number(calibrated.def), target.def, 'def');
    approx(Number(calibrated.regen), target.regen, 'regen');
  }
});
