import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

void test('outskirts resolves to dedicated scenic screen-owned host without shell context/close chrome', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'outskirts',
    cityName: 'Spirit Cavern',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'outskirts-exact');
  assert.equal(surface.shellFamily, 'outskirts-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false);
});

void test('ruins resolves to dedicated scenic screen-owned host without shell context/close chrome', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'ruins',
    cityName: 'Spirit Cavern',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'ruins-exact');
  assert.equal(surface.shellFamily, 'ruins-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false);
});

void test('gateTrial resolves to dedicated exact scenic screen-owned host', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Spirit Cavern',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'gate-trial-exact');
  assert.equal(surface.shellFamily, 'gate-trial-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false, 'gateTrial owns close behavior inside the exact surface');
});


void test('legacy-intent modules that use context-strip mode still expose shell context/close semantics', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'manualPavilion',
    cityName: 'Spirit Cavern',
    intent: { manualPavilionExactMode: 'legacy' },
    isStoreMode: true,
  });

  assert.equal(surface.shellMode, 'context-strip');
  assert.equal(surface.showContextStrip, true);
  assert.equal(surface.showShellClose, true);
});
