import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FX_LAYER_RESERVED_GLOBAL_CEILING,
  FX_LAYER_TIERS,
  FX_PORTAL_ROOT_ID,
  getFxLayerOrder,
  isValidFxLayerTier,
} from '../../src/ui/fx/fxLayerContract.js';

void test('ui fx layer contract: stable portal id and ordered semantic tiers', () => {
  assert.equal(typeof FX_PORTAL_ROOT_ID, 'string');
  assert.equal(FX_PORTAL_ROOT_ID.length > 0, true);

  assert.deepEqual(FX_LAYER_TIERS, ['backdrop', 'ambient', 'heroUnderlay', 'heroOverlay']);

  const orderedSlots = FX_LAYER_TIERS.map((tier) => getFxLayerOrder(tier));
  orderedSlots.forEach((value, index) => {
    if (index === 0) return;
    assert.equal(value > orderedSlots[index - 1], true);
  });

  assert.equal(FX_LAYER_RESERVED_GLOBAL_CEILING < 90, true);
});

void test('ui fx layer contract: tier validator rejects invalid inputs', () => {
  assert.equal(isValidFxLayerTier('ambient'), true);
  assert.equal(isValidFxLayerTier('invalid-tier'), false);
  assert.equal(isValidFxLayerTier(20), false);
  assert.equal(isValidFxLayerTier(null), false);
});
