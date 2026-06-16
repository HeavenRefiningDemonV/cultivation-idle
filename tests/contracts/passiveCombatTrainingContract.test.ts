import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PASSIVE_RATE,
  applyCombatPassive,
  createMeridianProgress,
  meridianForTriggerKind,
  type MeridianTrainingState,
} from '../../src/systems/meridians/index.js';

/**
 * W5 — passive combat training (§2.9, N10). Combat triggers feed the matching meridian
 * a fraction of the Court rate via the shared advanceMeridian('combat') path, online-only
 * and per-fight capped, so deliberate Court training always dominates.
 */

function martialState(): MeridianTrainingState {
  return {
    activeMeridianId: 'martial_weapon_intent',
    rootByMeridianId: { martial_weapon_intent: 'true', martial_flowing_step: 'true' },
    progressByMeridianId: {
      martial_weapon_intent: createMeridianProgress(false),
      martial_flowing_step: createMeridianProgress(false),
    },
  };
}

test('N10: a weapon-skill hit hones Weapon Intent by 0.15× the Court rate via the combat path', () => {
  const result = applyCombatPassive({
    state: martialState(),
    triggerKind: 'weapon_skill_damage',
    courtRateAmount: 100,
    realmIndex1to7: 2,
    unlockRealm: 1,
    perFightAccrued: 0,
    perFightCap: 1000, // generous cap so this case isolates the 0.15× rate, not the cap
  });
  assert.equal(result.meridianId, 'martial_weapon_intent');
  assert.equal(result.granted, 100 * PASSIVE_RATE);
  assert.ok(result.ratingGained > 0);
  assert.ok(result.state.progressByMeridianId.martial_weapon_intent.rating > 0);
  // Court (full amount) always dominates passive (a fraction of it).
  assert.ok(result.granted < 100);
});

test('passive is online-only and respects the per-fight cap', () => {
  const offline = applyCombatPassive({
    state: martialState(),
    triggerKind: 'weapon_skill_damage',
    courtRateAmount: 100,
    realmIndex1to7: 2,
    unlockRealm: 1,
    perFightAccrued: 0,
    online: false,
  });
  assert.equal(offline.skipped, 'offline');
  assert.equal(offline.granted, 0);

  const capped = applyCombatPassive({
    state: martialState(),
    triggerKind: 'weapon_skill_damage',
    courtRateAmount: 100,
    realmIndex1to7: 2,
    unlockRealm: 1,
    perFightAccrued: 11.5,
    perFightCap: 12,
  });
  assert.equal(capped.granted, 0.5, 'grant is clamped to the remaining per-fight budget');
  assert.equal(capped.perFightAccrued, 12);

  const exhausted = applyCombatPassive({
    state: martialState(),
    triggerKind: 'weapon_skill_damage',
    courtRateAmount: 100,
    realmIndex1to7: 2,
    unlockRealm: 1,
    perFightAccrued: 12,
    perFightCap: 12,
  });
  assert.equal(exhausted.skipped, 'cap-reached');
});

test('passive skips sealed meridians and triggers for another path', () => {
  const sealed = applyCombatPassive({
    state: martialState(),
    triggerKind: 'dodge_reposition', // martial_flowing_step, unlockRealm 2
    courtRateAmount: 100,
    realmIndex1to7: 1, // flowing step sealed at realm 1
    unlockRealm: 2,
    perFightAccrued: 0,
  });
  assert.equal(sealed.skipped, 'sealed');
  assert.equal(sealed.granted, 0);

  // An Earth-path cultivator never advances a Martial meridian from a weapon trigger.
  const wrongPath = applyCombatPassive({
    state: { activeMeridianId: 'earth_body_temper', rootByMeridianId: { earth_body_temper: 'true' }, progressByMeridianId: { earth_body_temper: createMeridianProgress(false) } },
    triggerKind: 'weapon_skill_damage',
    courtRateAmount: 100,
    realmIndex1to7: 4,
    unlockRealm: 1,
    perFightAccrued: 0,
  });
  assert.equal(wrongPath.skipped, 'not-active-path');
});

test('every trigger kind resolves to exactly one meridian (1:1)', () => {
  const kinds = [
    'weapon_skill_damage', 'dodge_reposition', 'consecutive_hits', 'opening_execute',
    'counter_parry', 'sustained_offense', 'high_realm_kill', 'take_deal_physical',
    'block_being_hit', 'endure_dot', 'hold_ground', 'absorb_hits', 'tank_taunt',
    'survive_lethal', 'precise_ranged_hit', 'dodge_perceive', 'resist_soul_mental',
    'composure', 'soul_curse_effect', 'control_suppress', 'high_realm_soul_kill',
  ] as const;
  const meridians = new Set(kinds.map((kind) => meridianForTriggerKind(kind)));
  assert.equal(meridians.size, 21, 'each of the 21 triggers maps to a distinct meridian');
  assert.ok(![...meridians].includes(null), 'no trigger is unmapped');
});
