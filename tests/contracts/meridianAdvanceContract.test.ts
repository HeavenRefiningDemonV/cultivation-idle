import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPREHENSION_FLOOR,
  advanceMeridian,
  createMeridianProgress,
  effectiveMeridianCap,
  type MeridianTrainingState,
} from '../../src/systems/meridians/index.js';

/**
 * W3 — the single advanceMeridian path (Court + combat). One-meridian advance,
 * unlock gating, cap clamp, overflow→mastery, comprehension warm-up, no resource cost.
 */

function stateWith(): MeridianTrainingState {
  return {
    activeMeridianId: 'earth_body_temper',
    rootByMeridianId: { earth_body_temper: 'true', earth_bone_forging: 'true' },
    progressByMeridianId: {
      earth_body_temper: createMeridianProgress(false),
      earth_bone_forging: createMeridianProgress(false),
    },
  };
}

test('N1: a Court tick advances only the active meridian; siblings are untouched', () => {
  const state = stateWith();
  const sibling = state.progressByMeridianId.earth_bone_forging;
  const result = advanceMeridian({
    state,
    meridianId: 'earth_body_temper',
    amount: 50,
    source: 'court',
    realmIndex1to7: 2,
    unlockRealm: 1,
  });
  assert.ok(result.ratingGained > 0, 'active meridian should advance');
  // Sibling object identity is preserved (no mutation, immutable update).
  assert.equal(result.state.progressByMeridianId.earth_bone_forging, sibling);
  assert.notEqual(result.state, state);
});

test('N2: a sealed meridian (unlockRealm > realm) is rejected with no change', () => {
  const state = stateWith();
  const result = advanceMeridian({
    state,
    meridianId: 'earth_bone_forging',
    amount: 1000,
    source: 'court',
    realmIndex1to7: 1, // bone_forging unlocks at realm 2 → sealed at realm 1
    unlockRealm: 2,
  });
  assert.equal(result.rejected, 'sealed');
  assert.equal(result.ratingGained, 0);
  assert.equal(result.state, state); // unchanged reference
});

test('N5: rating never exceeds the effective realm cap', () => {
  const state = stateWith();
  const cap = effectiveMeridianCap(1, 'true'); // round(40 * 1.3) = 52
  const result = advanceMeridian({
    state,
    meridianId: 'earth_body_temper',
    amount: 1_000_000,
    source: 'court',
    realmIndex1to7: 1,
    unlockRealm: 1,
  });
  assert.equal(result.cap, cap);
  assert.equal(result.state.progressByMeridianId.earth_body_temper.rating, cap);
  assert.equal(result.capState, 'capped');
});

test('N6: at the cap, further advance overflows into mastery (not rating)', () => {
  let state = stateWith();
  // First, drive to the cap.
  state = advanceMeridian({
    state,
    meridianId: 'earth_body_temper',
    amount: 1_000_000,
    source: 'court',
    realmIndex1to7: 1,
    unlockRealm: 1,
  }).state;
  const masteryBefore = state.progressByMeridianId.earth_body_temper.masteryXp;
  const ratingBefore = state.progressByMeridianId.earth_body_temper.rating;

  const result = advanceMeridian({
    state,
    meridianId: 'earth_body_temper',
    amount: 500,
    source: 'court',
    realmIndex1to7: 1,
    unlockRealm: 1,
  });
  assert.equal(result.ratingGained, 0, 'no rating gain past the cap');
  assert.equal(result.state.progressByMeridianId.earth_body_temper.rating, ratingBefore);
  assert.ok(result.overflowToMastery > 0, 'overflow should route to mastery');
  assert.ok(result.state.progressByMeridianId.earth_body_temper.masteryXp > masteryBefore);
});

test('N7: a freshly-unlocked exercise starts at the comprehension floor and ramps with Perception', () => {
  const state: MeridianTrainingState = {
    activeMeridianId: 'heaven_dao_heart',
    rootByMeridianId: { heaven_dao_heart: 'heavenly' },
    progressByMeridianId: { heaven_dao_heart: createMeridianProgress(true) },
  };
  assert.equal(state.progressByMeridianId.heaven_dao_heart.comprehension, COMPREHENSION_FLOOR);

  const lowPerception = advanceMeridian({
    state, meridianId: 'heaven_dao_heart', amount: 100, source: 'court', realmIndex1to7: 4, unlockRealm: 4, perception: 10,
  });
  const highPerception = advanceMeridian({
    state, meridianId: 'heaven_dao_heart', amount: 100, source: 'court', realmIndex1to7: 4, unlockRealm: 4, perception: 60,
  });
  assert.ok(lowPerception.comprehensionGained > 0, 'comprehension ramps while < 1');
  assert.ok(highPerception.comprehensionGained > lowPerception.comprehensionGained, 'Perception speeds comprehension');
  assert.ok(highPerception.state.progressByMeridianId.heaven_dao_heart.comprehension <= 1, 'comprehension never exceeds 1');
});

test('N10 hook / N16: combat source uses the same path and training costs no resources', () => {
  const state = stateWith();
  const court = advanceMeridian({ state, meridianId: 'earth_body_temper', amount: 40, source: 'court', realmIndex1to7: 2, unlockRealm: 1 });
  const combat = advanceMeridian({ state, meridianId: 'earth_body_temper', amount: 40, source: 'combat', realmIndex1to7: 2, unlockRealm: 1 });
  assert.equal(court.ratingGained, combat.ratingGained, 'combat advances via the same engine');
  assert.equal(court.resourceCost, 0);
  assert.equal(combat.resourceCost, 0);
});
