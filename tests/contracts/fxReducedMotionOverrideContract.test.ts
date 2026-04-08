import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveFxEffectiveQuality, resolveFxReducedMotionPreference } from '../../src/ui/fx/runtime.js';

test('reduced-motion override is tri-state and authoritative when present', () => {
  assert.equal(resolveFxReducedMotionPreference(false, null), false);
  assert.equal(resolveFxReducedMotionPreference(true, null), true);
  assert.equal(resolveFxReducedMotionPreference(true, false), false);
  assert.equal(resolveFxReducedMotionPreference(false, true), true);
});

test('effective quality resolves to reducedMotion when override forces reduced mode', () => {
  assert.equal(resolveFxEffectiveQuality('high', false, true), 'reducedMotion');
  assert.equal(resolveFxEffectiveQuality('medium', false, true), 'reducedMotion');
  assert.equal(resolveFxEffectiveQuality('low', false, true), 'reducedMotion');
});

test('effective quality supports forced non-reduced audits even on reduced-motion systems', () => {
  assert.equal(resolveFxEffectiveQuality('high', true, false), 'high');
  assert.equal(resolveFxEffectiveQuality('medium', true, false), 'medium');
  assert.equal(resolveFxEffectiveQuality('low', true, false), 'low');
});
