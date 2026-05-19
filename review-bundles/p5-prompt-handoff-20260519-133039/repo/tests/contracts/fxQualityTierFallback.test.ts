import assert from 'node:assert/strict';
import { buildFxSceneBudget, resolveFxEffectiveQuality } from '../../src/ui/fx/runtime.js';
import test from 'node:test';

test('quality resolution preserves explicit high/medium/low in non-reduced mode and falls back auto->medium', () => {
  assert.equal(resolveFxEffectiveQuality('auto', false, null), 'medium');
  assert.equal(resolveFxEffectiveQuality('high', false, null), 'high');
  assert.equal(resolveFxEffectiveQuality('medium', false, null), 'medium');
  assert.equal(resolveFxEffectiveQuality('low', false, null), 'low');
});

test('budget matrix keeps low/reduced-motion atmosphere conservative', () => {
  const lowBudget = buildFxSceneBudget('low');
  const reducedBudget = buildFxSceneBudget('reducedMotion');

  assert.equal(lowBudget.continuousAtmosphere, 'off');
  assert.equal(lowBudget.allowHeroPulse, false);
  assert.equal(reducedBudget.sceneMode, 'static');
  assert.equal(reducedBudget.tickScale, 0);
});
