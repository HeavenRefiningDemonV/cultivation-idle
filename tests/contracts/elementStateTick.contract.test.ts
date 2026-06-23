import assert from 'node:assert/strict';
import test from 'node:test';

import { expireEnemyElementStates, tickEnemyElementStates } from '../../src/systems/elements/elementStateTick.js';
import { DEFAULT_ELEMENT_TUNING } from '../../src/systems/elements/elementTuning.js';
import type { EnemyElementStates } from '../../src/systems/elements/elementCombatReactions.js';
import type { ElementStateInstance, StateCategory } from '../../src/systems/elements/elementTypes.js';

const inst = (remainingMs: number, intensity = 1, category: StateCategory = 'dot'): ElementStateInstance =>
  ({ state: 'burning', category, remainingMs, intensity } as ElementStateInstance);

const states = (...active: ElementStateInstance[]): EnemyElementStates => ({ active });

// a tuning with a NON-ZERO held coefficient, to exercise the DoT model (the shipped default is 0 = inert).
const dotTuning = (coeff: number, intervalMs = 1000) => ({ ...DEFAULT_ELEMENT_TUNING, dotTickCoeff: coeff, dotTickIntervalMs: intervalMs });

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

// ─── slice 3b-i: DoT damage (interval-accumulator) ───────────────────────────────────────────────

void test('D11 3b-i — shipped default (dotTickCoeff 0) is INERT: a burning state ages but deals zero damage', () => {
  const out = tickEnemyElementStates({ states: states(inst(4000)), elapsedMs: 1000, realm: 3, engineActive: true, tuning: DEFAULT_ELEMENT_TUNING });
  assert.equal(out.dotDamage, 0, 'held coeff 0 ⇒ no DoT damage (F-BAL deposits the real value)');
  assert.equal(out.dotEvents.length, 0);
  assert.equal(out.survivingStates.active[0]?.remainingMs, 3000, 'but the state still ages (3b-0)');
});

void test('D11 3b-i — preserve-first: flag OFF ⇒ same-ref survivors, zero damage', () => {
  const s = states(inst(4000));
  const out = tickEnemyElementStates({ states: s, elapsedMs: 1000, realm: 3, engineActive: false, tuning: dotTuning(5) });
  assert.equal(out.survivingStates, s);
  assert.equal(out.dotDamage, 0);
});

void test('D11 3b-i — one interval crossed ⇒ one tick: coeff × intensity × realmScalar', () => {
  // coeff 2, interval 1000, intensity 1, realm 1 ⇒ realmScalar 1; elapsed 1000 ⇒ exactly 1 tick ⇒ 2
  const out = tickEnemyElementStates({ states: states(inst(4000, 1)), elapsedMs: 1000, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(out.dotDamage, 2);
  assert.equal(out.dotEvents.length, 1);
  assert.equal(out.survivingStates.active[0]?.accMs, 0, 'accumulator drained by the whole tick');
});

void test('D11 3b-i — interval NOT crossed ⇒ no tick, accumulator carries the residual', () => {
  const out = tickEnemyElementStates({ states: states(inst(4000)), elapsedMs: 600, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(out.dotDamage, 0, 'only 600ms of a 1000ms interval ⇒ no tick yet');
  assert.equal(out.survivingStates.active[0]?.accMs, 600, 'residual carried to the next frame');
});

void test('D11 3b-i — accumulator across frames: two 600ms frames ⇒ exactly one tick (not frame-coupled)', () => {
  const f1 = tickEnemyElementStates({ states: states(inst(4000)), elapsedMs: 600, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(f1.dotDamage, 0);
  const f2 = tickEnemyElementStates({ states: f1.survivingStates, elapsedMs: 600, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(f2.dotDamage, 2, '600+600=1200ms ⇒ one whole tick fires');
  assert.equal(f2.survivingStates.active[0]?.accMs, 200, '1200 − 1000 = 200 residual');
});

void test('D11 3b-i — a large frame (tab-throttle) emits whole ticks only, no double-count', () => {
  const out = tickEnemyElementStates({ states: states(inst(9000)), elapsedMs: 2500, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(out.dotDamage, 4, '2500ms ⇒ floor(2.5) = 2 ticks × 2');
  assert.equal(out.survivingStates.active[0]?.accMs, 500, 'residual 500 carried');
});

void test('D11 3b-i — damage scales with intensity and realmScalar (not stack/array length)', () => {
  const byIntensity = tickEnemyElementStates({ states: states(inst(4000, 3)), elapsedMs: 1000, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(byIntensity.dotDamage, 6, '2 × intensity 3 × realmScalar 1');
  const byRealm = tickEnemyElementStates({ states: states(inst(4000, 1)), elapsedMs: 1000, realm: 5, engineActive: true, tuning: dotTuning(2) });
  assert.equal(byRealm.dotDamage, 10, '2 × intensity 1 × realmScalar 5');
});

void test('D11 3b-i — only DoT-category afflictions deal damage; a control state ages but never sears', () => {
  const out = tickEnemyElementStates({ states: states(inst(4000, 2, 'control')), elapsedMs: 1000, realm: 3, engineActive: true, tuning: dotTuning(5) });
  assert.equal(out.dotDamage, 0, 'control is not DoT ⇒ no per-tick damage (its CC application is a later slice)');
  assert.equal(out.survivingStates.active[0]?.remainingMs, 3000, 'but it still ages');
});

// ─── slice 3b-ii: reaction ICD decay ─────────────────────────────────────────────────────────────

void test('D11 3b-ii — ICD decays by elapsedMs and the elapsed entry drops', () => {
  const s: EnemyElementStates = { active: [], icdByPathway: { freeze: 3000 } };
  const out = expireEnemyElementStates({ states: s, elapsedMs: 1000, engineActive: true });
  assert.equal(out.icdByPathway?.freeze, 2000);
  const gone = expireEnemyElementStates({ states: s, elapsedMs: 3000, engineActive: true });
  assert.equal(gone.icdByPathway, undefined, 'fully-elapsed ICD drops (the reaction can re-fire)');
});

void test('D11 3b-ii — an ICD-only state still ages (not the same-ref fast path)', () => {
  const s: EnemyElementStates = { active: [], icdByPathway: { freeze: 500 } };
  const out = expireEnemyElementStates({ states: s, elapsedMs: 200, engineActive: true });
  assert.notEqual(out, s, 'ICD with no afflictions is still aged');
  assert.equal(out.icdByPathway?.freeze, 300);
});

void test('D11 3b-ii — flag-off leaves ICD untouched (preserve-first)', () => {
  const s: EnemyElementStates = { active: [], icdByPathway: { freeze: 3000 } };
  assert.equal(expireEnemyElementStates({ states: s, elapsedMs: 1000, engineActive: false }), s);
});

void test('D11 3b-ii — tick preserves the decayed ICD alongside DoT', () => {
  const s: EnemyElementStates = { active: [inst(4000)], icdByPathway: { freeze: 3000 } };
  const out = tickEnemyElementStates({ states: s, elapsedMs: 1000, realm: 1, engineActive: true, tuning: dotTuning(2) });
  assert.equal(out.survivingStates.icdByPathway?.freeze, 2000, 'ICD decayed and carried through the DoT pass');
  assert.equal(out.dotDamage, 2);
});
