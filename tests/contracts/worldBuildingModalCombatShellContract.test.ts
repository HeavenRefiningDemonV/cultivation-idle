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

void test('gateTrial/ruins remain on existing combat-path host contract', () => {
  (['gateTrial', 'ruins'] as const).forEach((buildingKey) => {
    const surface = resolveWorldModalEntrySurface({
      buildingKey,
      cityName: 'Spirit Cavern',
      intent: null,
      isStoreMode: true,
    });

    assert.equal(surface.backgroundVariant, 'inside-dungeon');
    assert.equal(surface.shellFamily, 'combat-path');
    assert.equal(surface.shellMode, 'close-only');
    assert.equal(surface.showContextStrip, false);
    assert.equal(surface.showShellClose, false, `${buildingKey} should keep close ownership in panel chrome`);
  });
});
