import assert from 'node:assert/strict';
import test from 'node:test';

import type { DerivedStatInput } from '../../src/systems/meridians/derivedStats.js';
import {
  FOCUS_EMPHASIS_PRIMARY,
  FOCUS_AXIS_SOURCE_MAP,
  focusEmphasisSources,
  scaleEmphasisSources,
  applyFocusEmphasis,
} from '../../src/systems/meridians/focusEmphasis.js';

function baseInput(): DerivedStatInput {
  return {
    foundation: { physique: 100, vitality: 100, agility: 100, perception: 100, willpower: 100 },
    axes: { cultivationBase: 100, qiPool: 100, qiPurity: 100, meridianOpenness: 100, spiritualSense: 100, soulStrength: 100, daoComprehension: 100 },
    meridianRatings: {},
    realmIndex1to7: 1,
  };
}

void test('B-STATS Focus — each of the 7 Seat spokes maps to its real derived source (D2 §2.3)', () => {
  assert.deepEqual(focusEmphasisSources('qiPool'), ['qiPool']);
  assert.deepEqual(focusEmphasisSources('qiPurity'), ['qiPurity']);
  assert.deepEqual(focusEmphasisSources('spiritualSense'), ['spiritualSense']);
  assert.deepEqual(focusEmphasisSources('soulStrength'), ['soulStrength']);
  assert.deepEqual(focusEmphasisSources('meridian'), ['meridianOpenness'], 'Seat "meridian" → Tier-1 meridianOpenness');
  assert.deepEqual(focusEmphasisSources('dao'), ['daoComprehension'], 'Seat "dao" → Tier-1 daoComprehension');
  assert.deepEqual(focusEmphasisSources('body'), ['physique', 'vitality'], 'Body is Tier-0 Foundation, not an axis');
  // null / unknown / Balanced ⇒ no bias
  assert.deepEqual(focusEmphasisSources(null), []);
  assert.deepEqual(focusEmphasisSources('balanced'), []);
  assert.deepEqual(focusEmphasisSources('nonsense'), []);
  // every mapped target is a real foundation/axis key on the input
  const b = baseInput();
  for (const sources of Object.values(FOCUS_AXIS_SOURCE_MAP)) {
    for (const k of sources) assert.ok(k in b.axes || k in b.foundation, `${k} is a real derived source`);
  }
});

void test('B-STATS Focus — the coefficient is HELD inert (parity-safe), so applyFocusEmphasis is the identity', () => {
  assert.equal(FOCUS_EMPHASIS_PRIMARY, 0, 'coefficient held for D15/F-BAL — no balance authored here');
  const b = baseInput();
  for (const axis of [null, 'qiPurity', 'body', 'meridian', 'dao', 'balanced']) {
    assert.deepEqual(applyFocusEmphasis(b, axis), b, `inert ⇒ identity for ${axis} (derived parity stays exact)`);
  }
});

void test('B-STATS Focus — the scaling MECHANISM works when activated (axis spoke biases its axis only)', () => {
  const b = baseInput();
  const out = scaleEmphasisSources(b, focusEmphasisSources('qiPurity'), 2);
  assert.equal(out.axes.qiPurity, 200, 'the emphasised axis is scaled');
  assert.equal(out.axes.qiPool, 100, 'a non-emphasised axis is untouched');
  assert.equal(out.foundation.physique, 100, 'foundation untouched for an axis spoke');
  // input is not mutated (pure copy)
  assert.equal(b.axes.qiPurity, 100);
});

void test('B-STATS Focus — Body biases the Tier-0 foundation (physique + vitality), not an axis', () => {
  const b = baseInput();
  const out = scaleEmphasisSources(b, focusEmphasisSources('body'), 1.5);
  assert.equal(out.foundation.physique, 150);
  assert.equal(out.foundation.vitality, 150);
  assert.equal(out.foundation.agility, 100, 'other foundation untouched');
  assert.equal(out.axes.qiPool, 100, 'no axis touched by Body');
});
