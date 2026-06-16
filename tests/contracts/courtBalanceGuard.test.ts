import assert from 'node:assert/strict';
import test from 'node:test';

import { COURT_BALANCE, MERIDIAN_DERIVED_MAP } from '../../src/systems/meridians/index.js';

/**
 * W12 — balance guard. Two jobs, no playtest needed:
 *  1) Snapshot every ‹tune W12› starting coefficient in ONE place (COURT_BALANCE), so a
 *     balance change is an intentional, reviewable diff — not silent drift.
 *  2) Lock the Appendix-B derived SOURCE STRUCTURE: each canonical meridian→derived-stat
 *     mapping (Tier-2 bold sources, incl. the 4 W12 reconciliation fixes) must be present.
 *     The k-numbers are tunable; the structure is the fixed contract.
 */

test('W12 COURT_BALANCE snapshot — the single tunable surface (intentional-diff guard)', () => {
  assert.deepEqual(COURT_BALANCE.rate.intensity, { quiet: 0.7, steady: 1.0, harsh: 1.35, limit: 1.75 });
  assert.equal(COURT_BALANCE.rate.clamp, 2.25);
  assert.equal(COURT_BALANCE.rate.tuning.perceptionPivot, 20);
  assert.equal(COURT_BALANCE.rate.tuning.perceptionSlope, 0.006);
  assert.equal(COURT_BALANCE.rate.tuning.masterySlope, 0.012);
  assert.equal(COURT_BALANCE.rate.tuning.pathAffinity, 1.2);

  assert.equal(COURT_BALANCE.training.masteryTimeShare, 0.33);
  assert.equal(COURT_BALANCE.training.comprehensionFloor, 0.5);
  assert.equal(COURT_BALANCE.training.comprehensionRamp, 0.0015);

  assert.equal(COURT_BALANCE.passive.rate, 0.15);
  assert.equal(COURT_BALANCE.passive.perFightCap, 12);

  assert.deepEqual(COURT_BALANCE.derived.weight, { up: 0.6, upup: 1.2 });
  assert.equal(COURT_BALANCE.derived.base.maxHp, 50);

  assert.equal(COURT_BALANCE.formMemory.exponent, 0.6);
  assert.equal(COURT_BALANCE.formMemory.mult, 0.5);
  const weightSum = Object.values(COURT_BALANCE.formMemory.rootRollWeights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(weightSum - 1) < 1e-9, 'root-roll weights sum to 1');
});

test('W12 derived source structure matches Appendix B (Tier-2 bold sources, incl. W12 fixes)', () => {
  // Canonical (meridian id → derived channel) pairs from Appendix B. The k-weights are
  // ‹tune W12›; only PRESENCE is asserted here.
  const APPENDIX_B: Array<[string, string]> = [
    ['earth_body_temper', 'maxHp'],
    ['earth_marrow_essence', 'maxHp'], // W12 fix
    ['earth_marrow_essence', 'hpRegen'],
    ['martial_weapon_intent', 'physAttack'],
    ['earth_body_temper', 'physAttack'], // W12 fix
    ['earth_bone_forging', 'physDefense'],
    ['earth_iron_skin', 'physDefense'], // W12 fix
    ['earth_iron_skin', 'flatDamageReduction'],
    ['earth_mountain_stance', 'flatDamageReduction'],
    ['earth_marrow_essence', 'qiPool'],
    ['martial_flowing_step', 'speed'],
    ['martial_battle_rhythm', 'attackSpeed'],
    ['heaven_spirit_sense', 'accuracy'],
    ['heaven_mind_eye', 'evasion'],
    ['martial_flowing_step', 'evasion'],
    ['martial_killing_intent', 'critChance'],
    ['heaven_mind_eye', 'critChance'],
    ['martial_sword_heart', 'critDamage'],
    ['martial_sword_heart', 'armorPen'],
    ['heaven_void_gaze', 'armorPen'],
    ['heaven_void_gaze', 'soulAttack'],
    ['heaven_soul_clarity', 'soulDefense'],
    ['heaven_dao_heart', 'tribulationResist'],
    ['heaven_heavenly_mandate', 'controlPower'],
    ['martial_killing_intent', 'suppression'],
    ['heaven_heavenly_mandate', 'suppression'],
    ['earth_root_depth', 'staggerResist'],
    ['earth_mountain_stance', 'staggerResist'], // W12 fix
    ['martial_unbroken_momentum', 'staggerResist'],
  ];

  for (const [meridianId, channel] of APPENDIX_B) {
    const targets = MERIDIAN_DERIVED_MAP[meridianId];
    assert.ok(targets, `${meridianId} must exist in the derived map`);
    assert.ok(
      targets.some((t) => t.channel === channel),
      `${meridianId} must feed ${channel} (Appendix B)`,
    );
  }
});
