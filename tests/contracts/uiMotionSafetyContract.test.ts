import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMotionSafetyContract } from '../../src/ui/fx/motion/motionSafetyContract.js';

void test('motion safety: reduced motion disables motion, scale, shared layout, and hover lift', () => {
  const resolved = resolveMotionSafetyContract({ reducedMotion: true, emphasis: 'hero' });

  assert.equal(resolved.allowMotion, false);
  assert.equal(resolved.allowScale, false);
  assert.equal(resolved.allowSharedLayout, false);
  assert.equal(resolved.hoverLiftPx, 0);
  assert.equal(resolved.selectionScale, 1);
  assert.equal(resolved.enterDurationMs, 0);
  assert.equal(resolved.exitDurationMs, 0);
});

void test('motion safety: subtle/standard/hero locked defaults and monotonic durations', () => {
  const subtle = resolveMotionSafetyContract({ reducedMotion: false, emphasis: 'subtle' });
  const standard = resolveMotionSafetyContract({ reducedMotion: false, emphasis: 'standard' });
  const hero = resolveMotionSafetyContract({ reducedMotion: false, emphasis: 'hero' });

  assert.equal(subtle.enterDurationMs, 140);
  assert.equal(subtle.selectionScale, 1.01);
  assert.equal(subtle.hoverLiftPx, 0.5);

  assert.equal(standard.enterDurationMs, 180);
  assert.equal(standard.selectionScale, 1.015);
  assert.equal(standard.hoverLiftPx, 1);

  assert.equal(hero.enterDurationMs, 220);
  assert.equal(hero.selectionScale, 1.02);
  assert.equal(hero.hoverLiftPx, 1.5);

  assert.equal(subtle.enterDurationMs < standard.enterDurationMs, true);
  assert.equal(standard.enterDurationMs < hero.enterDurationMs, true);
});

void test('motion safety: disableScale forces selection scale to 1', () => {
  const resolved = resolveMotionSafetyContract({ reducedMotion: false, emphasis: 'hero', disableScale: true });

  assert.equal(resolved.allowMotion, true);
  assert.equal(resolved.allowScale, false);
  assert.equal(resolved.selectionScale, 1);
});
