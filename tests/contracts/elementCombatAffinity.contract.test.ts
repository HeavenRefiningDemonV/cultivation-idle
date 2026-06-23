import assert from 'node:assert/strict';
import test from 'node:test';

import { ELEMENT_ROSTER, OPPOSITION_EDGES } from '../../src/systems/elements/elementCatalog.js';
import {
  INERT_AFFINITY,
  ZERO_ELEMENT_WEIGHTS,
  buildPlayerElementWeights,
  resolvePlayerElementAffinity,
  elementAffinityDamageMultiplier,
  resolvePlayerElementResist,
  elementResistDamageMultiplier,
} from '../../src/systems/elements/elementCombatAffinity.js';

const ROOT = ELEMENT_ROSTER[0].id; // a real element id from the live 14-roster
const EDGE = OPPOSITION_EDGES[0]; // a real directed counter: EDGE.from counters EDGE.to

void test('B-ELEM — the player element-weight vector is full-weight-on-root, zero elsewhere (first slice)', () => {
  const w = buildPlayerElementWeights(ROOT);
  assert.equal(w[ROOT], 1);
  let nonRoot = 0;
  for (const e of ELEMENT_ROSTER) if (e.id !== ROOT) nonRoot += w[e.id];
  assert.equal(nonRoot, 0, 'only the root element carries weight in slice 1');
  // every one of the 14 elements is present (a complete vector, not a sparse map)
  assert.equal(Object.keys(w).length, ELEMENT_ROSTER.length);
  // no root ⇒ the zero vector
  assert.deepEqual(buildPlayerElementWeights(null), ZERO_ELEMENT_WEIGHTS);
});

void test('B-ELEM — affinity is INERT when the derived engine is off (preserve-first, byte-identical)', () => {
  const off = resolvePlayerElementAffinity({ rootElement: ROOT, realm: 5, engineActive: false });
  assert.deepEqual(off, INERT_AFFINITY);
  assert.equal(off.effective, 0, 'effective 0 ⇒ combat × (1 + 0) ⇒ unchanged');
  // no root element ⇒ inert even with the engine on
  assert.deepEqual(resolvePlayerElementAffinity({ rootElement: null, realm: 5, engineActive: true }), INERT_AFFINITY);
});

void test('B-ELEM — under the engine, the seam returns the F3 resolver\'s real soft-capped affinity', () => {
  const on = resolvePlayerElementAffinity({ rootElement: ROOT, realm: 3, engineActive: true });
  assert.equal(on.element, ROOT);
  assert.ok(on.effective > 0, 'a root-element build has positive offensive affinity');
  // root-only build ⇒ no co-expressed allies ⇒ no resonance bonus; no target ⇒ no counter delta
  assert.equal(on.resonanceBonus, 0);
  assert.equal(on.counterDelta, 0);
});

void test('D11 slice 2 — counter matchup presses a favourable affinity and blunts an unfavourable one', () => {
  const ctx = { realm: 3, engineActive: true } as const;
  const noTarget = resolvePlayerElementAffinity({ rootElement: EDGE.from, ...ctx });
  // root counters the target ⇒ positive counter delta (favourable)
  const favourable = resolvePlayerElementAffinity({ rootElement: EDGE.from, ...ctx, targetElement: EDGE.to });
  assert.ok(favourable.counterDelta > 0, 'attacking what you counter presses affinity');
  assert.ok(favourable.effective >= noTarget.effective, 'favourable matchup ≥ no-matchup');
  // target counters the root ⇒ negative counter delta (blunted, never nullified)
  const unfavourable = resolvePlayerElementAffinity({ rootElement: EDGE.to, ...ctx, targetElement: EDGE.from });
  assert.ok(unfavourable.counterDelta < 0, 'attacking what counters you is blunted');
  // off / no target ⇒ no counter delta
  assert.equal(resolvePlayerElementAffinity({ rootElement: EDGE.from, realm: 3, engineActive: false, targetElement: EDGE.to }).counterDelta, 0);
});

void test('D11 slice 2 — element resist reduces incoming of your own element; 0 off / no enemy element', () => {
  // a cultivator resists attacks of their OWN element (root-only build weights that element)
  const own = resolvePlayerElementResist({ rootElement: ROOT, incomingElement: ROOT, realm: 3, engineActive: true });
  assert.ok(own > 0 && own < 1, 'own-element resist is positive and below the no-immunity cap');
  // a different incoming element ⇒ no resist (root-only build)
  const other = ELEMENT_ROSTER.find((e) => e.id !== ROOT)!.id;
  assert.equal(resolvePlayerElementResist({ rootElement: ROOT, incomingElement: other, realm: 3, engineActive: true }), 0);
  // engine off, or no enemy element ⇒ 0 (byte-identical incoming)
  assert.equal(resolvePlayerElementResist({ rootElement: ROOT, incomingElement: ROOT, realm: 3, engineActive: false }), 0);
  assert.equal(resolvePlayerElementResist({ rootElement: ROOT, incomingElement: null, realm: 3, engineActive: true }), 0);
  // the resist multiplier: 0 fraction ⇒ ×1 (unchanged); a real fraction reduces, never to 0
  assert.equal(elementResistDamageMultiplier(0), 1);
  assert.ok(elementResistDamageMultiplier(own) < 1 && elementResistDamageMultiplier(own) > 0);
  assert.equal(elementResistDamageMultiplier(5), 1 - 0.99, 'an over-cap fraction is floored at the no-immunity cap');
});

void test('D11 — the affinity damage multiplier is ×1 when inert (byte-identical) and ×(1+effective) when real', () => {
  assert.equal(elementAffinityDamageMultiplier(INERT_AFFINITY), 1, 'engine off ⇒ ×1 ⇒ combat unchanged');
  const on = resolvePlayerElementAffinity({ rootElement: ROOT, realm: 3, engineActive: true });
  assert.equal(elementAffinityDamageMultiplier(on), 1 + on.effective, 'engine on ⇒ × (1 + effective)');
  assert.ok(elementAffinityDamageMultiplier(on) > 1, 'a real root affinity raises outgoing damage');
  // negative effective can never reduce below the base hit
  assert.equal(elementAffinityDamageMultiplier({ element: ROOT, effective: -5, resonanceBonus: 0, counterDelta: 0 }), 1);
});
