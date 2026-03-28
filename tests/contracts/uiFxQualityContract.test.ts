import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveFxQualityContract } from '../../src/ui/fx/fxQualityContract.js';

void test('ui fx quality contract: disabled fx resolves fully off', () => {
  const result = resolveFxQualityContract({ enabled: false, requestedQuality: 'high' });
  assert.equal(result.renderMode, 'off');
  assert.equal(result.resolvedQuality, 'off');
  assert.equal(result.allowAnimatedHeroFx, false);
});

void test('ui fx quality contract: reduced motion overrides high quality', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'high', reducedMotion: true });
  assert.equal(result.resolvedQuality, 'low');
  assert.equal(result.renderMode, 'static');
  assert.equal(result.allowContinuousAtmosphere, false);
});

void test('ui fx quality contract: auto resolves conservatively to medium', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'auto' });
  assert.equal(result.resolvedQuality, 'medium');
  assert.equal(result.renderMode, 'full');
});

void test('ui fx quality contract: low quality disables continuous atmosphere', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'low' });
  assert.equal(result.renderMode, 'static');
  assert.equal(result.allowContinuousAtmosphere, false);
});

void test('ui fx quality contract: hero animation disabled when render mode is off', () => {
  const result = resolveFxQualityContract({ enabled: false, allowHeroFx: true, allowAtmosphere: true });
  assert.equal(result.renderMode, 'off');
  assert.equal(result.allowAnimatedHeroFx, false);
});

void test('ui fx quality contract: all channels disabled forces off mode', () => {
  const result = resolveFxQualityContract({ enabled: true, allowAtmosphere: false, allowHeroFx: false });
  assert.equal(result.renderMode, 'off');
  assert.equal(result.resolvedQuality, 'off');
});
