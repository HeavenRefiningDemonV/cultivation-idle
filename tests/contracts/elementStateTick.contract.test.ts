import assert from 'node:assert/strict';
import test from 'node:test';

import { expireEnemyElementStates } from '../../src/systems/elements/elementStateTick.js';
import type { EnemyElementStates } from '../../src/systems/elements/elementCombatReactions.js';
import type { ElementStateInstance } from '../../src/systems/elements/elementTypes.js';

const inst = (remainingMs: number, intensity = 1): ElementStateInstance =>
  ({ state: 'burning', category: 'dot', remainingMs, intensity } as ElementStateInstance);

const states = (...active: ElementStateInstance[]): EnemyElementStates => ({ active });

void test('D11 3b-0 — preserve-first: engine OFF returns the input states unchanged (same ref)', () => {
  const s = states(inst(4000));
  const out = expireEnemyElementStates({ states: s, elapsedMs: 1000, engineActive: false });
  assert.equal(out, s, 'flag-off ⇒ identical reference, no aging');
  assert.equal(out.active[0]?.remainingMs, 4000);
});

void test('D11 3b-0 — engine ON, no afflictions: fast-path returns the same ref (no churn)', () => {
  const empty = states();
  const out = expireEnemyElementStates({ states: empty, elapsedMs: 1000, engineActive: true });
  assert.equal(out, empty, 'no states ⇒ same ref ⇒ the store performs no set');
});

void test('D11 3b-0 — decrement: a surviving state loses exactly elapsedMs', () => {
  const out = expireEnemyElementStates({ states: states(inst(4000)), elapsedMs: 1500, engineActive: true });
  assert.equal(out.active.length, 1);
  assert.equal(out.active[0]?.remainingMs, 2500, '4000 − 1500');
  assert.equal(out.active[0]?.intensity, 1, 'intensity is carried, not changed');
});

void test('D11 3b-0 — expiry: remainingMs ≤ elapsedMs is dropped; more survives', () => {
  const out = expireEnemyElementStates({
    states: states(inst(1000), inst(900), inst(2000)),
    elapsedMs: 1000,
    engineActive: true,
  });
  // 1000−1000=0 ⇒ dropped; 900−1000=−100 ⇒ dropped; 2000−1000=1000 ⇒ survives
  assert.equal(out.active.length, 1, 'only the >0 survivor remains');
  assert.equal(out.active[0]?.remainingMs, 1000);
});

void test('D11 3b-0 — purity: the input states/instances are never mutated', () => {
  const original = inst(3000, 2);
  const s = states(original);
  const out = expireEnemyElementStates({ states: s, elapsedMs: 1000, engineActive: true });
  assert.equal(original.remainingMs, 3000, 'source instance untouched');
  assert.equal(s.active.length, 1, 'source array untouched');
  assert.notEqual(out, s, 'returns a fresh object when aging happens');
  assert.notEqual(out.active[0], original, 'returns fresh instances');
  assert.equal(out.active[0]?.remainingMs, 2000);
});
