import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { buildEconomicRuntimeSnapshotFromState } from '../../src/systems/economy/economicSnapshot.js';
import { evaluateEconomicShortfalls } from '../../src/systems/economy/economicShortfallEvaluator.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function buildSnapshot(content: ValidatedContent, overrides: Partial<Parameters<typeof buildEconomicRuntimeSnapshotFromState>[0]> = {}) {
  return buildEconomicRuntimeSnapshotFromState({
    content,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    selectedModuleByCity: { city_stonecrag_town: 'outskirts' },
    selectedPath: 'earth',
    currentRealmIndex: 1,
    currencies: { gold: '0', merit: '0', spiritStones: '0' },
    itemCountsById: {
      cons_healing_pellet_t1: 5,
      cons_windstep_powder_t1: 0,
      cons_ward_salt_t1: 0,
      cons_meridian_warmth_draft_t1: 1,
      mat_spirit_leaf: 0,
    },
    purchasedTodayByStockId: {},
    forgeFloor: buildForgeFloorReadModel({
      weaponRefineFloor: 1,
      accessoryRefineFloor: 0,
      temperSuccessesBySlot: { weapon: 0, accessory: 0 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: 1,
    }),
    expeditionState: {
      slots: 1,
      activeRunCount: 0,
      availableSlotCount: 1,
      activeRunTypeIds: [],
      activeOriginCityIds: [],
    },
    currentTrialProgressById: {},
    ...overrides,
  });
}

test('economic shortfall evaluator computes floor, forge, reserve, and package gaps in locked spend-order priority', async () => {
  const validated = await getValidated();
  const snapshot = buildSnapshot(validated);
  const evaluation = evaluateEconomicShortfalls(snapshot);

  assert.deepEqual(
    evaluation.shortfalls.map((entry) => [entry.priorityBand, entry.problemKind]),
    [
      [1, 'belowHealingFloor'],
      [1, 'belowCultivationPrepFloor'],
      [2, 'belowMinimumForgeFloor'],
      [3, 'belowMeritReserve'],
      [4, 'belowSpiritStoneMinimum'],
      [4, 'belowSpiritStoneIdeal'],
      [5, 'belowRecommendedForgeFloor'],
      [6, 'missingGatePrepPackage'],
      [6, 'missingTargetedLocalMaterial'],
      [7, 'buildCorrectionGap'],
    ],
  );
  assert.equal(evaluation.readinessBand, 'below_minimum');
});

test('economic shortfall evaluator computes concrete gaps for healing, specialty, cultivation prep, forge floors, support reserves, and direct prep package', async () => {
  const validated = await getValidated();
  const snapshot = buildSnapshot(validated);
  const evaluation = evaluateEconomicShortfalls(snapshot);
  const byKind = Object.fromEntries(evaluation.shortfalls.map((entry) => [entry.problemKind, entry]));

  assert.equal(byKind.belowHealingFloor.currentValue, 5);
  assert.equal(byKind.belowHealingFloor.targetValue, 20);
  assert.equal(byKind.belowHealingFloor.gap, 15);

  assert.equal(byKind.belowSpecialtyFloor, undefined);

  assert.equal(byKind.belowCultivationPrepFloor.currentValue, 1);
  assert.equal(byKind.belowCultivationPrepFloor.targetValue, 4);
  assert.equal(byKind.belowCultivationPrepFloor.gap, 3);

  assert.ok(byKind.belowMinimumForgeFloor.gap > 0);
  assert.ok(byKind.belowRecommendedForgeFloor.gap > byKind.belowMinimumForgeFloor.gap);

  assert.equal(byKind.belowMeritReserve.targetValue, 15);
  assert.equal(byKind.belowSpiritStoneMinimum.targetValue, 3);
  assert.equal(byKind.belowSpiritStoneIdeal.targetValue, 5);

  assert.equal(byKind.missingGatePrepPackage.relatedIds.includes('cons_healing_pellet_t1'), true);
  assert.equal(byKind.missingGatePrepPackage.relatedIds.includes('cons_meridian_warmth_draft_t1'), true);
});
