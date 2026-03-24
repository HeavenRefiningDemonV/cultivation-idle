import assert from 'node:assert/strict';
import test from 'node:test';

import { getProblemChipFamily } from '../../src/systems/economy/problemDestinationPolicy.js';

test('problem chip family maps build correction and forge floor issues to build_fix', () => {
  assert.equal(getProblemChipFamily('buildCorrectionGap'), 'build_fix');
  assert.equal(getProblemChipFamily('belowMinimumForgeFloor'), 'build_fix');
  assert.equal(getProblemChipFamily('belowRecommendedForgeFloor'), 'build_fix');
});

test('problem chip family maps prep and reserve shortages to stock_low', () => {
  assert.equal(getProblemChipFamily('belowHealingFloor'), 'stock_low');
  assert.equal(getProblemChipFamily('belowSpiritStoneMinimum'), 'stock_low');
  assert.equal(getProblemChipFamily('missingGatePrepPackage'), 'stock_low');
});
