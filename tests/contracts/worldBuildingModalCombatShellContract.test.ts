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

void test('gateTrial remains on existing combat-path host contract', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Spirit Cavern',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'inside-dungeon');
  assert.equal(surface.shellFamily, 'combat-path');
  assert.equal(surface.shellMode, 'close-only');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false, 'gateTrial should keep close ownership in panel chrome');
});


void test('non-outskirts modules that use context-strip mode still expose shell context/close semantics', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'apothecary',
    cityName: 'Spirit Cavern',
    intent: { apothecarySurface: 'buy' },
    isStoreMode: true,
  });

  assert.equal(surface.shellMode, 'context-strip');
  assert.equal(surface.showContextStrip, true);
  assert.equal(surface.showShellClose, true);
});
