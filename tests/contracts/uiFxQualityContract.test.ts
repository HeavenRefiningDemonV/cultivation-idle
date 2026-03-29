import assert from 'node:assert/strict';
import test from 'node:test';
import { FX_QUALITY_DPR_CAP, resolveFxQualityContract } from '../../src/ui/fx/fxQualityContract.js';

void test('ui fx quality contract: auto resolves conservatively to medium', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'auto' });
  assert.equal(result.resolvedQuality, 'medium');
  assert.equal(result.renderMode, 'full');
  assert.equal(result.reasons.includes('auto-default-medium'), true);
  assert.equal(result.devicePixelRatioCap, FX_QUALITY_DPR_CAP.auto);
});

void test('ui fx quality contract: reduced motion clamps high quality to static/non-continuous behavior', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'high', reducedMotion: true });
  assert.equal(result.reducedMotion, true);
  assert.equal(result.resolvedQuality, 'low');
  assert.equal(result.renderMode, 'static');
  assert.equal(result.allowContinuousAtmosphere, false);
  assert.equal(result.allowAnimatedHeroFx, false);
  assert.equal(result.reasons.includes('reduced-motion'), true);
});

void test('ui fx quality contract: low quality yields static mode and low-quality reason', () => {
  const result = resolveFxQualityContract({ requestedQuality: 'low' });
  assert.equal(result.renderMode, 'static');
  assert.equal(result.allowContinuousAtmosphere, false);
  assert.equal(result.reasons.includes('low-quality-static'), true);
  assert.equal(result.devicePixelRatioCap, FX_QUALITY_DPR_CAP.low);
});

void test('ui fx quality contract: both channels disabled forces off mode with reasons', () => {
  const result = resolveFxQualityContract({ enabled: true, allowAtmosphere: false, allowHeroFx: false });
  assert.equal(result.renderMode, 'off');
  assert.equal(result.resolvedQuality, 'off');
  assert.equal(result.reasons.includes('atmosphere-disabled'), true);
  assert.equal(result.reasons.includes('hero-disabled'), true);
});

void test('ui fx quality contract: disabled setting forces off mode and disabled reason', () => {
  const result = resolveFxQualityContract({ enabled: false, requestedQuality: 'high' });
  assert.equal(result.renderMode, 'off');
  assert.equal(result.resolvedQuality, 'off');
  assert.equal(result.allowAnimatedHeroFx, false);
  assert.equal(result.reasons.includes('disabled'), true);
});

void test('ui fx quality contract: dpr caps follow quality tiers', () => {
  const high = resolveFxQualityContract({ requestedQuality: 'high' });
  const medium = resolveFxQualityContract({ requestedQuality: 'medium' });
  const low = resolveFxQualityContract({ requestedQuality: 'low' });

  assert.equal(high.devicePixelRatioCap, FX_QUALITY_DPR_CAP.high);
  assert.equal(medium.devicePixelRatioCap, FX_QUALITY_DPR_CAP.medium);
  assert.equal(low.devicePixelRatioCap, FX_QUALITY_DPR_CAP.low);
});

void test('ui fx quality contract: debug reduced-motion overrides system for qa usage', () => {
  const forcedOn = resolveFxQualityContract({ requestedQuality: 'high', reducedMotion: false, debugReducedMotionOverride: 'force-on' });
  const forcedOff = resolveFxQualityContract({ requestedQuality: 'high', reducedMotion: true, debugReducedMotionOverride: 'force-off' });

  assert.equal(forcedOn.reducedMotion, true);
  assert.equal(forcedOn.renderMode, 'static');
  assert.equal(forcedOff.reducedMotion, false);
  assert.equal(forcedOff.renderMode, 'full');
});
