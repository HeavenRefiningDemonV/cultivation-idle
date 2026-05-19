import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveWorldModalEntrySurface,
} from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';
import { getWorldBuildingIntentKey } from '../../src/stores/uiStore.js';

test('bounties world modal defaults to screen-owned exact and preserves explicit legacy fallback', () => {
  const live = resolveWorldModalEntrySurface({
    buildingKey: 'bounties',
    cityName: 'Pinewind Hamlet',
    intent: null,
    isStoreMode: true,
  });
  assert.equal(live.backgroundVariant, 'bounties-exact');
  assert.equal(live.shellFamily, 'bounties-scenic');
  assert.equal(live.shellMode, 'screen-owned');
  assert.equal(live.showShellClose, false);
  assert.equal(live.showContextStrip, false);

  const legacy = resolveWorldModalEntrySurface({
    buildingKey: 'bounties',
    cityName: 'Pinewind Hamlet',
    intent: { bountiesExactMode: 'legacy' },
    isStoreMode: true,
  });
  assert.equal(legacy.backgroundVariant, 'bounty-board');
  assert.equal(legacy.shellFamily, 'support-board');
  assert.equal(legacy.shellMode, 'context-strip');
  assert.equal(legacy.showContextStrip, true);

  const fixture = resolveWorldModalEntrySurface({
    buildingKey: 'bounties',
    cityName: 'Pinewind Hamlet',
    intent: { bountiesExactMode: 'fixture' },
    isStoreMode: true,
  });
  assert.equal(fixture.backgroundVariant, 'bounties-exact');
  assert.equal(fixture.shellMode, 'screen-owned');
});

test('expeditions world modal defaults to screen-owned exact and preserves explicit legacy fallback', () => {
  const live = resolveWorldModalEntrySurface({
    buildingKey: 'expeditions',
    cityName: 'Pinewind Hamlet',
    intent: null,
    isStoreMode: true,
  });
  assert.equal(live.backgroundVariant, 'expeditions-exact');
  assert.equal(live.shellFamily, 'expeditions-scenic');
  assert.equal(live.shellMode, 'screen-owned');
  assert.equal(live.showShellClose, false);
  assert.equal(live.showContextStrip, false);

  const legacy = resolveWorldModalEntrySurface({
    buildingKey: 'expeditions',
    cityName: 'Pinewind Hamlet',
    intent: { expeditionsExactMode: 'legacy' },
    isStoreMode: true,
  });
  assert.equal(legacy.backgroundVariant, 'bounty-board');
  assert.equal(legacy.shellFamily, 'support-board');
  assert.equal(legacy.shellMode, 'context-strip');
  assert.equal(legacy.showContextStrip, true);

  const fixture = resolveWorldModalEntrySurface({
    buildingKey: 'expeditions',
    cityName: 'Pinewind Hamlet',
    intent: { expeditionsExactMode: 'fixture' },
    isStoreMode: true,
  });
  assert.equal(fixture.backgroundVariant, 'expeditions-exact');
  assert.equal(fixture.shellMode, 'screen-owned');
});

test('world building modal intent key distinguishes bounties and expeditions exact modes', () => {
  assert.notEqual(getWorldBuildingIntentKey(null), getWorldBuildingIntentKey({ bountiesExactMode: 'legacy' }));
  assert.notEqual(
    getWorldBuildingIntentKey({ bountiesExactMode: 'live' }),
    getWorldBuildingIntentKey({ bountiesExactMode: 'fixture' }),
  );
  assert.notEqual(getWorldBuildingIntentKey(null), getWorldBuildingIntentKey({ expeditionsExactMode: 'legacy' }));
  assert.notEqual(
    getWorldBuildingIntentKey({ expeditionsExactMode: 'live' }),
    getWorldBuildingIntentKey({ expeditionsExactMode: 'fixture' }),
  );
});
