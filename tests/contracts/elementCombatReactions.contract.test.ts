import assert from 'node:assert/strict';
import test from 'node:test';

import { ELEMENT_ROSTER } from '../../src/systems/elements/elementCatalog.js';
import { DEFAULT_ELEMENT_TUNING } from '../../src/systems/elements/elementTuning.js';
import {
  EMPTY_ENEMY_ELEMENT_STATES,
  stepEnemyElementOnHit,
} from '../../src/systems/elements/elementCombatReactions.js';

const EL = ELEMENT_ROSTER[0].id;

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
