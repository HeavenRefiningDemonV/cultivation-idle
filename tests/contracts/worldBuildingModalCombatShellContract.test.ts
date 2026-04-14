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
