import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

void test('combat-path world building modal never owns close chrome for combat trio surfaces', () => {
  (['outskirts', 'gateTrial', 'ruins'] as const).forEach((buildingKey) => {
    const surface = resolveWorldModalEntrySurface({
      buildingKey,
      cityName: 'Spirit Cavern',
      intent: null,
      isStoreMode: true,
    });

    assert.equal(surface.shellFamily, 'combat-path');
    assert.equal(surface.shellMode, 'close-only');
    assert.equal(surface.showContextStrip, false);
    assert.equal(surface.showShellClose, false, `${buildingKey} should keep close ownership in panel top-lane chrome`);
  });
});

void test('outskirts exact-mockup prep shell variant is isolated and full-bleed-ready', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'outskirts',
    cityName: 'Spirit Cavern',
    intent: { outskirtsSurface: 'exact-mockup-prep' },
    isStoreMode: true,
  });

  assert.equal(surface.shellFamily, 'outskirts-exact');
  assert.equal(surface.backgroundVariant, 'outskirts-exact-prep');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, true);
  assert.equal(surface.contentPaddingMode, 'outskirts-exact');
  assert.equal(surface.closeButtonMode, 'overlay-corner');
});

void test('ruins and gate trial do not inherit outskirts exact prep shell mode', () => {
  (['ruins', 'gateTrial'] as const).forEach((buildingKey) => {
    const surface = resolveWorldModalEntrySurface({
      buildingKey,
      cityName: 'Spirit Cavern',
      intent: { outskirtsSurface: 'exact-mockup-prep' },
      isStoreMode: true,
    });

    assert.equal(surface.shellFamily, 'combat-path');
    assert.equal(surface.backgroundVariant, 'inside-dungeon');
    assert.equal(surface.contentPaddingMode, 'default');
    assert.equal(surface.closeButtonMode, 'default');
  });
});
