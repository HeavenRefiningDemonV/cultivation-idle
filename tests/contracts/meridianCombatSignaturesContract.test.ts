import assert from 'node:assert/strict';
import test from 'node:test';

import { meridianSignatureEffects } from '../../src/systems/meridians/derivedStats.js';
import {
  INERT_MERIDIAN_SIGNATURES,
  resolveMeridianSignaturesForCombat,
  combineArmorPenWithSignatures,
  isIronSkinNegated,
} from '../../src/systems/meridians/meridianCombatSignatures.js';

// Mirrors combatStore.DEFENSE_CONSTANT_K (a [live] invariant). Used only to demonstrate that the
// composed armor-pen lowers effective Defense and therefore raises ATK×(1−DEF/(DEF+K)) damage.
const K = 100;
const baseDamage = (atk: number, enemyDef: number, totalPenPct: number) => {
  const effDef = Math.max(0, enemyDef * (1 - totalPenPct / 100));
  return atk * (1 - effDef / (effDef + K));
};

void test('B-MERID Slice 0 — the combat read seam is INERT under the legacy (flag-off) engine', () => {
  // node:test has no `window`, so isDerivedStatEngineAuthoritative() is false → inert struct.
  assert.deepEqual(resolveMeridianSignaturesForCombat(), INERT_MERIDIAN_SIGNATURES);
  // the inert struct is all-zero / all-false (every combat consumer becomes a no-op)
  assert.equal(INERT_MERIDIAN_SIGNATURES.voidGazeWeaknessPenPct, 0);
  assert.equal(INERT_MERIDIAN_SIGNATURES.swordHeartDrIgnorePct, 0);
  assert.equal(INERT_MERIDIAN_SIGNATURES.rootDepthRooted, false);
  assert.equal(INERT_MERIDIAN_SIGNATURES.capstones.asura, false);
});

void test('B-MERID Slice 1 — INERT signatures reproduce the legacy armor-pen exactly (preserve-first)', () => {
  // legacy was `Math.min(armorPenPct, 90)`; with inert signatures the composer must equal it.
  for (const pen of [0, 12.5, 40, 89.9, 90, 120]) {
    assert.equal(
      combineArmorPenWithSignatures(pen, INERT_MERIDIAN_SIGNATURES, true),
      Math.min(pen, 90),
      `inert composer must equal legacy min(${pen}, 90)`,
    );
    assert.equal(combineArmorPenWithSignatures(pen, INERT_MERIDIAN_SIGNATURES, false), Math.min(pen, 90));
  }
});

void test('B-MERID Slice 1 — Void-Gaze (Heaven) always shreds DR; Sword-Heart (Martial) only on a crit', () => {
  const voidGaze = meridianSignatureEffects({ heaven_void_gaze: 100 }); // ×0.5 ⇒ 50% pen
  assert.equal(voidGaze.voidGazeWeaknessPenPct, 50);
  assert.equal(combineArmorPenWithSignatures(0, voidGaze, false), 50, 'Void-Gaze applies on a non-crit');
  assert.equal(combineArmorPenWithSignatures(0, voidGaze, true), 50, 'and on a crit');

  const swordHeart = meridianSignatureEffects({ martial_sword_heart: 100 }); // ×0.3 ⇒ 30% pen
  assert.equal(swordHeart.swordHeartDrIgnorePct, 30);
  assert.equal(combineArmorPenWithSignatures(0, swordHeart, false), 0, 'Sword-Heart does NOT apply off-crit');
  assert.equal(combineArmorPenWithSignatures(0, swordHeart, true), 30, 'Sword-Heart applies on a crit');
});

void test('B-MERID Slice 1 — composed pen stacks with spirit-root armorPen and clamps at 90%', () => {
  const voidGaze = meridianSignatureEffects({ heaven_void_gaze: 100 }); // 50%
  // stacks additively with an existing 50% root armorPen, then clamps to the live ≤90% ceiling
  assert.equal(combineArmorPenWithSignatures(50, voidGaze, false), 90);
  // a crit Sword-Heart + Void-Gaze + root pen also clamps, never exceeding 90 (DEF never goes negative)
  const both = meridianSignatureEffects({ heaven_void_gaze: 100, martial_sword_heart: 100 });
  assert.equal(combineArmorPenWithSignatures(20, both, true), 90);
});

void test('B-MERID Slice 2 — Iron-Skin (Earth) negates only hits below the threshold; inert ⇒ never (parity)', () => {
  // INERT threshold 0 ⇒ never negated, at any incoming value (legacy combat byte-identical).
  for (const dmg of [0, 1, 50, 999999]) {
    assert.equal(isIronSkinNegated(dmg, INERT_MERIDIAN_SIGNATURES.ironSkinThreshold), false);
  }
  const ironSkin = meridianSignatureEffects({ earth_iron_skin: 100 }); // ×0.5 ⇒ threshold 50
  assert.equal(ironSkin.ironSkinThreshold, 50);
  assert.equal(isIronSkinNegated(30, ironSkin.ironSkinThreshold), true, 'a 30 hit < 50 is negated');
  assert.equal(isIronSkinNegated(49.999, ironSkin.ironSkinThreshold), true);
  assert.equal(isIronSkinNegated(50, ironSkin.ironSkinThreshold), false, 'a hit AT the threshold lands');
  assert.equal(isIronSkinNegated(60, ironSkin.ironSkinThreshold), false, 'a 60 hit ≥ 50 lands in full');
});

void test('B-MERID Slice 1 — the signature DEMONSTRABLY raises damage through the frozen K=100 formula', () => {
  const voidGaze = meridianSignatureEffects({ heaven_void_gaze: 100 }); // 50% pen
  const legacyDmg = baseDamage(100, 200, combineArmorPenWithSignatures(0, INERT_MERIDIAN_SIGNATURES, false));
  const engineDmg = baseDamage(100, 200, combineArmorPenWithSignatures(0, voidGaze, false));
  assert.ok(engineDmg > legacyDmg, 'a Void-Gaze rating lowers effective enemy Defense ⇒ more damage');
  // sanity: legacy 200 DEF ⇒ 33.3; 50% pen ⇒ 100 DEF ⇒ 50.0
  assert.ok(Math.abs(legacyDmg - 33.333) < 0.01);
  assert.ok(Math.abs(engineDmg - 50) < 0.01);
});
