import assert from 'node:assert/strict';
import test from 'node:test';

import { buildForgeFloorReadModel, collectSocketedRuneIds } from '../../src/systems/forge/index.js';

test('packet 3.5B forge floor read-model computes refine, temper, and rune floor cleanly', () => {
  const readModel = buildForgeFloorReadModel({
    weaponRefineFloor: 5,
    accessoryRefineFloor: 3,
    temperSuccessesBySlot: { weapon: 2, accessory: 1 },
    inventoryRuneCounts: { rune_ember_t1: 1, rune_stone_t1: 2, rune_ward_t1: 0 },
    socketedRuneIds: ['rune_ember_t1', 'rune_stone_t1'],
    cityIndex: 2,
  });

  assert.equal(readModel.weaponRefineFloor, 5);
  assert.equal(readModel.accessoryRefineFloor, 3);
  assert.equal(readModel.temperSuccessTotal, 3);
  assert.deepEqual(readModel.temperSuccessesBySlot, { weapon: 2, accessory: 1 });
  assert.equal(readModel.runeInventoryCount, 3);
  assert.equal(readModel.runeSocketedCount, 2);
  assert.equal(readModel.runeTotalCount, 5);
  assert.equal(readModel.runeUniqueCount, 2);
  assert.equal(readModel.nextGateRecommendation?.gateIndex, 3);
  assert.equal(readModel.nextGateRecommendation?.weaponRefine, 7);
  assert.equal(readModel.nextGateRecommendation?.runeCountRecommended, 1);
});

test('packet 3.5B forge floor read-model stays stable across mixed socket state', () => {
  const socketed = collectSocketedRuneIds({
    tech_alpha: { runes: ['rune_ember_t1', null, 'rune_stone_t1'] },
    tech_beta: { runes: [null, 'rune_ember_t1'] },
  });

  assert.deepEqual(socketed, ['rune_ember_t1', 'rune_stone_t1', 'rune_ember_t1']);

  const readModel = buildForgeFloorReadModel({
    weaponRefineFloor: 0,
    accessoryRefineFloor: 1,
    temperSuccessesBySlot: { weapon: 0, accessory: 2 },
    inventoryRuneCounts: { rune_ember_t1: 0, rune_stone_t1: 1 },
    socketedRuneIds: socketed,
    cityIndex: 0,
  });

  assert.equal(readModel.temperSuccessTotal, 2);
  assert.equal(readModel.runeInventoryCount, 1);
  assert.equal(readModel.runeSocketedCount, 3);
  assert.equal(readModel.runeTotalCount, 4);
  assert.equal(readModel.runeUniqueCount, 2);
  assert.equal(readModel.nextGateRecommendation?.gateIndex, 1);
});
