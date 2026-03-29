import assert from 'node:assert/strict';
import test from 'node:test';
import { dustEmitter, firefliesEmitter, glintsEmitter, mistEmitter, sparksEmitter } from '../../src/ui/fx/pixi/emitters/index.js';

const emitters = [mistEmitter, dustEmitter, sparksEmitter, glintsEmitter, firefliesEmitter] as const;

void test('fx emitter vocabulary: all five descriptors export stable ids and family identity', () => {
  emitters.forEach((descriptor) => {
    assert.equal(typeof descriptor.id, 'string');
    assert.equal(descriptor.id.length > 0, true);
    assert.equal(descriptor.id.startsWith(`uiFx.${descriptor.family}.`), true);
    assert.equal(typeof descriptor.countByQuality.low, 'number');
    assert.equal(typeof descriptor.countByQuality.medium, 'number');
    assert.equal(typeof descriptor.countByQuality.high, 'number');
    assert.equal(Array.isArray(descriptor.notes), true);
    assert.equal(descriptor.notes.length > 0, true);
  });
});

void test('fx emitter vocabulary: intended layers and reduced-motion/continuous flags are locked', () => {
  assert.equal(mistEmitter.intendedLayer, 'underlay');
  assert.equal(dustEmitter.intendedLayer, 'underlay');
  assert.equal(firefliesEmitter.intendedLayer, 'underlay');
  assert.equal(sparksEmitter.intendedLayer, 'hero');
  assert.equal(glintsEmitter.intendedLayer, 'hero');

  assert.equal(mistEmitter.continuous, true);
  assert.equal(dustEmitter.continuous, true);
  assert.equal(firefliesEmitter.continuous, true);
  assert.equal(sparksEmitter.continuous, false);
  assert.equal(glintsEmitter.continuous, false);

  assert.equal(mistEmitter.suitableForReducedMotion, false);
  assert.equal(dustEmitter.suitableForReducedMotion, true);
  assert.equal(sparksEmitter.suitableForReducedMotion, false);
  assert.equal(glintsEmitter.suitableForReducedMotion, true);
  assert.equal(firefliesEmitter.suitableForReducedMotion, false);
});

void test('fx emitter vocabulary: ranges are valid', () => {
  emitters.forEach((descriptor) => {
    assert.equal(descriptor.lifetimeMs.min <= descriptor.lifetimeMs.max, true);
    assert.equal(descriptor.speedPxPerSec.min <= descriptor.speedPxPerSec.max, true);
    assert.equal(descriptor.sizePx.min <= descriptor.sizePx.max, true);
    assert.equal(descriptor.alpha.start >= 0, true);
    assert.equal(descriptor.alpha.end >= 0, true);
    assert.equal(descriptor.alpha.start <= 1, true);
    assert.equal(descriptor.alpha.end <= 1, true);
  });
});
