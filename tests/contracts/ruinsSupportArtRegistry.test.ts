import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RUINS_SUPPORT_ART_FILES,
  RUINS_SUPPORT_ART_ROLE_MAP,
  resolveRuinsSupportArt,
} from '../../src/assets/ui/chrome/ruins_support/index.js';

test('ruins support-art role map is bounded to justified roles', () => {
  assert.deepEqual(Object.keys(RUINS_SUPPORT_ART_ROLE_MAP).sort(), [
    'ruin_anchor_reward_plate',
    'ruin_location_plaque',
  ]);
  assert.deepEqual(Object.keys(RUINS_SUPPORT_ART_FILES).sort(), ['anchorRewardPlate', 'locationPlaque']);
});

test('ruins support-art resolver is fallback-safe when generated files are absent', () => {
  const locationPlaque = resolveRuinsSupportArt('locationPlaque');
  const anchorRewardPlate = resolveRuinsSupportArt('anchorRewardPlate');

  assert.equal(locationPlaque.assetUrl, null);
  assert.equal(anchorRewardPlate.assetUrl, null);
  assert.equal(locationPlaque.usesFallback, true);
  assert.equal(anchorRewardPlate.usesFallback, true);
  assert.match(locationPlaque.fileName, /ui_label_ruins_location_default_m\.png/);
  assert.match(anchorRewardPlate.fileName, /ui_plate_ruins_anchor_reward_default_s\.png/);
});
