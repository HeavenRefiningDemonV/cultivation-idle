import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEnemyControlSkip } from '../../src/systems/elements/elementControlGate.js';
import { DEFAULT_ELEMENT_TUNING } from '../../src/systems/elements/elementTuning.js';
import type { EnemyElementStates } from '../../src/systems/elements/elementCombatReactions.js';
import type { ElementStateInstance, ElementStateId, StateCategory } from '../../src/systems/elements/elementTypes.js';

const inst = (state: ElementStateId, category: StateCategory, remainingMs = 4000): ElementStateInstance =>
  ({ state, category, remainingMs, intensity: 1 } as ElementStateInstance);
const states = (...active: ElementStateInstance[]): EnemyElementStates => ({ active });
const tuning = (controlSkipChance: number) => ({ ...DEFAULT_ELEMENT_TUNING, controlSkipChance });
const fixed = (v: number) => () => v;
// an RNG that fails the test if it is ever drawn — proves the lazy short-circuits.
const neverRng = (): number => { throw new Error('rng drawn when no skip could fire'); };

const frozen = states(inst('frozen', 'control'));

void test('D11 3b-iii — shipped default (controlSkipChance 0) NEVER skips and NEVER draws RNG (INERT)', () => {
  const out = resolveEnemyControlSkip({ states: frozen, engineActive: true, tuning: DEFAULT_ELEMENT_TUNING, rng: neverRng });
  assert.equal(out.skip, false, 'held 0 ⇒ no skip (flag-on byte-identical until D15)');
  assert.equal(out.reason, null);
});

void test('D11 3b-iii — preserve-first: flag OFF never skips and never draws', () => {
  const out = resolveEnemyControlSkip({ states: frozen, engineActive: false, tuning: tuning(1), rng: neverRng });
  assert.equal(out.skip, false);
});

void test('D11 3b-iii — no hard-control present ⇒ no skip, no draw (lazy)', () => {
  // a DoT (burning) is active, not a hard lock — even at chance 1 the RNG is never drawn.
  const out = resolveEnemyControlSkip({ states: states(inst('burning', 'dot')), engineActive: true, tuning: tuning(1), rng: neverRng });
  assert.equal(out.skip, false);
});

void test('D11 3b-iii — injected value proves the mechanism: frozen + chance 1 + low roll ⇒ skip', () => {
  const out = resolveEnemyControlSkip({ states: frozen, engineActive: true, tuning: tuning(1), rng: fixed(0) });
  assert.equal(out.skip, true);
  assert.equal(out.reason, 'frozen', 'the locking state is reported for the log');
});

void test('D11 3b-iii — hard-CC subset only: soft-CC (slowed) does NOT skip even at chance 1', () => {
  const soft = states(inst('slowed', 'control'));
  const out = resolveEnemyControlSkip({ states: soft, engineActive: true, tuning: tuning(1), rng: fixed(0) });
  assert.equal(out.skip, false, 'soft-CC is deferred to a later slice; only frozen/petrified hard-lock');
  // petrified IS in the hard subset
  const petrified = states(inst('petrified', 'control'));
  assert.equal(resolveEnemyControlSkip({ states: petrified, engineActive: true, tuning: tuning(1), rng: fixed(0) }).skip, true);
});

void test('D11 3b-iii — an expired control (remainingMs ≤ 0) does not skip', () => {
  const out = resolveEnemyControlSkip({ states: states(inst('frozen', 'control', 0)), engineActive: true, tuning: tuning(1), rng: fixed(0) });
  assert.equal(out.skip, false, 'the remainingMs > 0 filter ends the lock at expiry');
});

void test('D11 3b-iii — the roll is a deterministic threshold (rng < chance)', () => {
  assert.equal(resolveEnemyControlSkip({ states: frozen, engineActive: true, tuning: tuning(0.5), rng: fixed(0.49) }).skip, true);
  assert.equal(resolveEnemyControlSkip({ states: frozen, engineActive: true, tuning: tuning(0.5), rng: fixed(0.5) }).skip, false, 'rng == chance ⇒ no skip (strict <)');
});

void test('D11 3b-iii — pure: the input states are never mutated', () => {
  const s = frozen;
  resolveEnemyControlSkip({ states: s, engineActive: true, tuning: tuning(1), rng: fixed(0) });
  assert.equal(s.active.length, 1);
  assert.equal(s.active[0]?.remainingMs, 4000);
});
