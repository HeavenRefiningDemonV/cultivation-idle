import assert from 'node:assert/strict';
import test from 'node:test';

import { isFxStageId } from '../../src/ui/fx/constants.js';
import { resolveFxEffectiveQuality } from '../../src/ui/fx/runtime.js';

test('reduced motion always overrides requested quality', () => {
  assert.equal(resolveFxEffectiveQuality('auto', true), 'reducedMotion');
  assert.equal(resolveFxEffectiveQuality('high', true), 'reducedMotion');
  assert.equal(resolveFxEffectiveQuality('medium', true), 'reducedMotion');
  assert.equal(resolveFxEffectiveQuality('low', true), 'reducedMotion');
});

test('quality resolution maps requested tiers when reduced motion is off', () => {
  assert.equal(resolveFxEffectiveQuality('auto', false), 'medium');
  assert.equal(resolveFxEffectiveQuality('high', false), 'high');
  assert.equal(resolveFxEffectiveQuality('medium', false), 'medium');
  assert.equal(resolveFxEffectiveQuality('low', false), 'low');
});

test('canonical stage-id guard accepts only FX_STAGE_IDS values', () => {
  assert.equal(isFxStageId('cultivation'), true);
  assert.equal(isFxStageId('status'), true);
  assert.equal(isFxStageId('world'), true);
  assert.equal(isFxStageId('forge'), true);
  assert.equal(isFxStageId('selection'), true);
  assert.equal(isFxStageId('unknown-stage'), false);
});
