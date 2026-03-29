import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dustEmitter,
  firefliesEmitter,
  glintsEmitter,
  mistEmitter,
  resolveEmitterSpec,
  sparksEmitter,
} from '../../src/ui/fx/pixi/emitters/index.js';

const all = [mistEmitter, dustEmitter, sparksEmitter, glintsEmitter, firefliesEmitter] as const;

void test('fx emitter resolver: renderMode off disables all families', () => {
  all.forEach((descriptor) => {
    const resolved = resolveEmitterSpec({
      descriptor,
      resolvedQuality: 'high',
      renderMode: 'off',
      reducedMotion: false,
      allowAtmosphere: true,
      allowHeroFx: true,
    });
    assert.equal(resolved.enabled, false);
    assert.equal(resolved.count, 0);
    assert.match(resolved.reasons.join('|'), /render-off/);
  });
});

void test('fx emitter resolver: quality ladders are locked', () => {
  const low = resolveEmitterSpec({ descriptor: dustEmitter, resolvedQuality: 'low', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true });
  const medium = resolveEmitterSpec({ descriptor: dustEmitter, resolvedQuality: 'medium', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true });
  const high = resolveEmitterSpec({ descriptor: dustEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true });

  assert.equal(low.count, 6);
  assert.equal(medium.count, 14);
  assert.equal(high.count, 22);
});

void test('fx emitter resolver: reduced motion disables mist/sparks/fireflies but can keep glints', () => {
  const mist = resolveEmitterSpec({ descriptor: mistEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: true, allowAtmosphere: true, allowHeroFx: true });
  const sparks = resolveEmitterSpec({ descriptor: sparksEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: true, allowAtmosphere: true, allowHeroFx: true });
  const fireflies = resolveEmitterSpec({ descriptor: firefliesEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: true, allowAtmosphere: true, allowHeroFx: true });
  const glints = resolveEmitterSpec({ descriptor: glintsEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: true, allowAtmosphere: true, allowHeroFx: true });

  assert.equal(mist.enabled, false);
  assert.equal(sparks.enabled, false);
  assert.equal(fireflies.enabled, false);
  assert.equal(glints.enabled, true);
});

void test('fx emitter resolver: atmosphere/hero flags gate the right families', () => {
  const mist = resolveEmitterSpec({ descriptor: mistEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: false, allowHeroFx: true });
  const dust = resolveEmitterSpec({ descriptor: dustEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: false, allowHeroFx: true });
  const fireflies = resolveEmitterSpec({ descriptor: firefliesEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: false, allowHeroFx: true });
  const sparks = resolveEmitterSpec({ descriptor: sparksEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: false });
  const glints = resolveEmitterSpec({ descriptor: glintsEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: false });

  assert.equal(mist.enabled, false);
  assert.equal(dust.enabled, false);
  assert.equal(fireflies.enabled, false);
  assert.equal(sparks.enabled, false);
  assert.equal(glints.enabled, false);

  assert.match(mist.reasons.join('|'), /atmosphere-disabled/);
  assert.match(sparks.reasons.join('|'), /hero-disabled/);
});

void test('fx emitter resolver: static mode disables continuous families and countScale clamps', () => {
  const mistStatic = resolveEmitterSpec({ descriptor: mistEmitter, resolvedQuality: 'high', renderMode: 'static', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true });
  const glintsStatic = resolveEmitterSpec({ descriptor: glintsEmitter, resolvedQuality: 'high', renderMode: 'static', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true });
  const glintsScaled = resolveEmitterSpec({ descriptor: glintsEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true, countScale: 1.5 });
  const glintsNegative = resolveEmitterSpec({ descriptor: glintsEmitter, resolvedQuality: 'high', renderMode: 'full', reducedMotion: false, allowAtmosphere: true, allowHeroFx: true, countScale: -5 });

  assert.equal(mistStatic.enabled, false);
  assert.match(mistStatic.reasons.join('|'), /static-mode/);
  assert.equal(glintsStatic.enabled, true);

  assert.equal(glintsScaled.count, 12);
  assert.equal(glintsNegative.count, 0);
});
