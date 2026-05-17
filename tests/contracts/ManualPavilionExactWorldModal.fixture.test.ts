import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  resolveWorldModalEntrySurface,
} from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';
import { getWorldBuildingIntentKey } from '../../src/stores/uiStore.js';

test('manual pavilion world modal defaults to screen-owned exact and preserves explicit legacy fallback', () => {
  const live = resolveWorldModalEntrySurface({
    buildingKey: 'manualPavilion',
    cityName: 'Pinewind Hamlet',
    intent: null,
    isStoreMode: true,
  });
  assert.equal(live.backgroundVariant, 'manual-pavilion-exact');
  assert.equal(live.shellFamily, 'manual-pavilion-scenic');
  assert.equal(live.shellMode, 'screen-owned');
  assert.equal(live.showShellClose, false);
  assert.equal(live.showContextStrip, false);

  const fixture = resolveWorldModalEntrySurface({
    buildingKey: 'manualPavilion',
    cityName: 'Pinewind Hamlet',
    intent: { manualPavilionExactMode: 'fixture' },
    isStoreMode: true,
  });
  assert.equal(fixture.backgroundVariant, 'manual-pavilion-exact');
  assert.equal(fixture.shellFamily, 'manual-pavilion-scenic');
  assert.equal(fixture.shellMode, 'screen-owned');
  assert.equal(fixture.showShellClose, false);
  assert.equal(fixture.showContextStrip, false);

  const legacy = resolveWorldModalEntrySurface({
    buildingKey: 'manualPavilion',
    cityName: 'Pinewind Hamlet',
    intent: { manualPavilionExactMode: 'legacy' },
    isStoreMode: true,
  });
  assert.equal(legacy.backgroundVariant, 'manual-pavilion');
  assert.equal(legacy.shellFamily, 'prep-room');
  assert.equal(legacy.shellMode, 'context-strip');
  assert.equal(legacy.showShellClose, true);
  assert.equal(legacy.showContextStrip, true);
});

test('world building modal intent key distinguishes manual pavilion exact modes', () => {
  assert.notEqual(getWorldBuildingIntentKey(null), getWorldBuildingIntentKey({ manualPavilionExactMode: 'legacy' }));
  assert.notEqual(
    getWorldBuildingIntentKey({ manualPavilionExactMode: 'live' }),
    getWorldBuildingIntentKey({ manualPavilionExactMode: 'fixture' }),
  );
});

test('manual pavilion modal route owns exact and legacy render branches', () => {
  const modalPath = path.resolve('src/components/modals/WorldBuildingModal.tsx');
  const source = fs.readFileSync(modalPath, 'utf8');

  assert.match(source, /ManualPavilionScreenOwner/);
  assert.match(source, /manualPavilionExactMode === 'legacy'/);
  assert.match(source, /manualPavilionExactMode === 'fixture'/);
  assert.match(source, /<ManualPavilionPanel pavilionId=\{moduleRefId \?\? null\}/);
});
