import assert from 'node:assert/strict';
import test from 'node:test';

import { ELEMENT_ROSTER } from '../../src/systems/elements/elementCatalog.js';
import { DEFAULT_ELEMENT_TUNING } from '../../src/systems/elements/elementTuning.js';
import {
  EMPTY_ENEMY_ELEMENT_STATES,
  stepEnemyElementOnHit,
} from '../../src/systems/elements/elementCombatReactions.js';
import type { ElementStateInstance } from '../../src/systems/elements/elementTypes.js';

const EL = ELEMENT_ROSTER[0].id;

// Freeze (control) fires when Ice hits a Soaked target; it has an ICD.
const soaked: ElementStateInstance = { state: 'soaked', category: 'amplifier', remainingMs: 4000, intensity: 1 };

void test('D11 slice 3 — INERT when the engine is off or there is no applied element (byte-identical)', () => {
  const off = stepEnemyElementOnHit({ appliedElement: EL, states: EMPTY_ENEMY_ELEMENT_STATES, realm: 3, engineActive: false });
  assert.equal(off.bonusDamage, 0);
  assert.equal(off.reactionLabel, null);
  assert.equal(off.states, EMPTY_ENEMY_ELEMENT_STATES, 'states untouched when off');
  const noEl = stepEnemyElementOnHit({ appliedElement: null, states: EMPTY_ENEMY_ELEMENT_STATES, realm: 3, engineActive: true });
  assert.equal(noEl.bonusDamage, 0);
  assert.deepEqual(noEl.states.active, []);
});

void test('D11 slice 3 — a player hit applies its element signature state to the enemy', () => {
  const hit = stepEnemyElementOnHit({ appliedElement: EL, states: EMPTY_ENEMY_ELEMENT_STATES, realm: 3, engineActive: true });
  assert.equal(hit.states.active.length, 1, 'the element writes its signature affliction');
  assert.ok(hit.states.active[0].intensity >= 1);
  assert.ok(hit.bonusDamage >= 0, 'instant reaction damage is non-negative (0 unless a burst/sever fires)');
});

void test('D11 slice 3 — refresh-not-stack: re-applying the same element never duplicates; intensity is bounded', () => {
  let states = EMPTY_ENEMY_ELEMENT_STATES;
  for (let i = 0; i < 12; i++) {
    states = stepEnemyElementOnHit({ appliedElement: EL, states, realm: 4, engineActive: true }).states;
  }
  const ids = new Set(states.active.map((s) => s.state));
  assert.equal(states.active.length, ids.size, 'one instance per state id (refresh-not-stack, escalation swaps the id)');
  for (const s of states.active) {
    assert.ok(s.intensity <= DEFAULT_ELEMENT_TUNING.stateMaxIntensity, 'intensity is capped by the held tuning');
  }
  // the input is never mutated (pure)
  assert.deepEqual(EMPTY_ENEMY_ELEMENT_STATES.active, []);
});

void test('D11 3b-ii — a fired reaction arms its ICD with the family window', () => {
  const fired = stepEnemyElementOnHit({ appliedElement: 'ice', states: { active: [soaked] }, realm: 3, engineActive: true });
  assert.equal(fired.reactionLabel, '冰封', 'Ice on a Soaked target fires Freeze');
  assert.equal(fired.states.icdByPathway?.freeze, DEFAULT_ELEMENT_TUNING.icdMsByFamily.control, 'ICD armed with the control-family window');
});

void test('D11 3b-ii — the ICD gate blocks a reaction from re-firing while on cooldown', () => {
  const blocked = stepEnemyElementOnHit({
    appliedElement: 'ice',
    states: { active: [soaked], icdByPathway: { freeze: 1500 } },
    realm: 3,
    engineActive: true,
  });
  assert.notEqual(blocked.reactionLabel, '冰封', 'Freeze on cooldown does not re-fire');
  assert.equal(blocked.states.icdByPathway?.freeze, 1500, 'the live ICD is carried (decay is the tick’s job, not the hit’s)');
});

void test('D11 3b-ii — preserve-first: flag-off carries no ICD and writes nothing', () => {
  const off = stepEnemyElementOnHit({ appliedElement: 'ice', states: { active: [soaked], icdByPathway: { freeze: 1500 } }, realm: 3, engineActive: false });
  assert.equal(off.states.icdByPathway?.freeze, 1500, 'flag-off returns the input states unchanged');
});

// Shadow on a Cursed target: Hex (dot, priority 7) out-prioritizes Siphon (drain, priority 8).
const cursed: ElementStateInstance = { state: 'cursed', category: 'amplifier', remainingMs: 4000, intensity: 1 };

void test('D11 3b — drain (Siphon) returns self-heal when it fires (Hex on ICD ⇒ the drain surfaces)', () => {
  const out = stepEnemyElementOnHit({
    appliedElement: 'shadow',
    states: { active: [cursed], icdByPathway: { hex: 1500 } },
    realm: 3,
    engineActive: true,
  });
  assert.equal(out.reactionLabel, '噬生', 'with Hex on cooldown, the lower-priority Siphon (drain) wins');
  assert.ok(out.drainHeal > 0, 'drain yields a self-heal (reuses the held reaction amount)');
});

void test('D11 3b — a non-drain reaction yields no self-heal', () => {
  const hex = stepEnemyElementOnHit({ appliedElement: 'shadow', states: { active: [cursed] }, realm: 3, engineActive: true });
  assert.equal(hex.reactionLabel, '诅咒', 'Hex (dot) wins by priority when off cooldown');
  assert.equal(hex.drainHeal, 0, 'a dot reaction is not a drain ⇒ no heal');
});

void test('D11 3b — drain is INERT when the engine is off (preserve-first)', () => {
  const off = stepEnemyElementOnHit({ appliedElement: 'shadow', states: { active: [cursed], icdByPathway: { hex: 1500 } }, realm: 3, engineActive: false });
  assert.equal(off.drainHeal, 0);
});
