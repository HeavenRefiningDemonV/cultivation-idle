import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { buildEconomicRecommendationEngineFromState } from '../../src/systems/economy/economicRecommendationEngine.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function buildEngine(overrides: Partial<Parameters<typeof buildEconomicRecommendationEngineFromState>[0]> = {}) {
  return getValidated().then((content) => buildEconomicRecommendationEngineFromState({
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
  }));
}

test('economic recommendation engine routes low prep stock to Apothecary first', async () => {
  const result = await buildEngine();
  assert.equal(result.topRecommendation?.destinationModuleKey, 'apothecary');
  assert.equal(result.topRecommendation?.actionKind, 'buy');
});

test('economic recommendation engine routes below-minimum forge floor to Forge first', async () => {
  const result = await buildEngine({
    itemCountsById: {
      cons_healing_pellet_t1: 30,
      cons_windstep_powder_t1: 4,
      cons_ward_salt_t1: 4,
      cons_meridian_warmth_draft_t1: 4,
      mat_spirit_leaf: 1,
    },
    currencies: { gold: '1000', merit: '20', spiritStones: '10' },
  });
  const forgeProblem = result.perProblemRecommendations.find((entry) => entry.shortfall.problemKind === 'belowMinimumForgeFloor');
  assert.equal(forgeProblem?.candidates[0]?.destinationModuleKey, 'forge');
});

test('economic recommendation engine routes missing targeted local material to Ruins first and Expedition second', async () => {
  const result = await buildEngine({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
    selectedModuleByCity: { city_pinewind_hamlet: 'ruins' },
    currentRealmIndex: 0,
    itemCountsById: {
      cons_healing_pellet_t1: 30,
      cons_qi_elixir_t1: 4,
      mat_spirit_leaf: 0,
    },
    currencies: { gold: '1000', merit: '10', spiritStones: '0' },
    forgeFloor: buildForgeFloorReadModel({
      weaponRefineFloor: 3,
      accessoryRefineFloor: 2,
      temperSuccessesBySlot: { weapon: 1, accessory: 0 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: 0,
    }),
  });
  const targeted = result.perProblemRecommendations.find((entry) => entry.shortfall.problemKind === 'missingTargetedLocalMaterial');
  assert.equal(targeted?.candidates[0]?.destinationModuleKey, 'ruins');
  assert.equal(targeted?.candidates[1]?.destinationModuleKey, 'expeditions');
});

test('economic recommendation engine routes support-currency shortages to Bounties first', async () => {
  const meritResult = await buildEngine({
    itemCountsById: {
      cons_healing_pellet_t1: 30,
      cons_windstep_powder_t1: 4,
      cons_ward_salt_t1: 4,
      cons_meridian_warmth_draft_t1: 4,
    },
    currencies: { gold: '1000', merit: '0', spiritStones: '0' },
    forgeFloor: buildForgeFloorReadModel({
      weaponRefineFloor: 5,
      accessoryRefineFloor: 4,
      temperSuccessesBySlot: { weapon: 1, accessory: 1 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: 1,
    }),
  });

  const merit = meritResult.perProblemRecommendations.find((entry) => entry.shortfall.problemKind === 'belowMeritReserve');
  const spirit = meritResult.perProblemRecommendations.find((entry) => entry.shortfall.problemKind === 'belowSpiritStoneMinimum');
  assert.equal(merit?.candidates[0]?.destinationModuleKey, 'bounties');
  assert.equal(spirit?.candidates[0]?.destinationModuleKey, 'bounties');
});

test('economic recommendation engine surfaces Brew/material-source fallback when shop caps are exhausted', async () => {
  const result = await buildEngine({
    purchasedTodayByStockId: { 'shop_apothecary_stonecrag:cons_meridian_warmth_draft_t1': 10 },
  });
  const cultivationPrep = result.perProblemRecommendations.find((entry) => entry.shortfall.problemKind === 'belowCultivationPrepFloor');
  assert.match(cultivationPrep?.candidates[0]?.blockedReason ?? '', /Shop cap/);
  assert.equal(cultivationPrep?.candidates.some((candidate) => candidate.actionKind === 'brew'), true);
});

test('economic recommendation engine does not invent fake next-city or fake next-gate routes at content cap', async () => {
  const validated = await getValidated();
  const result = buildEconomicRecommendationEngineFromState({
    content: validated,
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: validated.cities.map((city) => city.id),
    selectedModuleByCity: { city_ironpeak_bastion: 'forge' },
    selectedPath: 'martial',
    currentRealmIndex: 5,
    currencies: { gold: '999999', merit: '999', spiritStones: '999' },
    itemCountsById: {
      cons_healing_pellet_t1: 50,
      cons_ironblood_pellet_t2: 10,
      cons_windstep_powder_t2: 10,
      cons_ward_salt_t2: 10,
      cons_mastery_tonic_t1: 10,
    },
    purchasedTodayByStockId: {},
    forgeFloor: buildForgeFloorReadModel({
      weaponRefineFloor: 10,
      accessoryRefineFloor: 10,
      temperSuccessesBySlot: { weapon: 3, accessory: 2 },
      inventoryRuneCounts: { rune_forge_guard_t1: 2, rune_forge_breaker_t1: 1 },
      socketedRuneIds: ['rune_forge_guard_t1', 'rune_forge_breaker_t1'],
      cityIndex: 4,
    }),
    expeditionState: {
      slots: 2,
      activeRunCount: 1,
      availableSlotCount: 1,
      activeRunTypeIds: ['exp_mining'],
      activeOriginCityIds: ['city_ironpeak_bastion'],
    },
    currentTrialProgressById: Object.fromEntries(validated.trials.map((trial) => [
      trial.id,
      { attempts: 1, sessionAttempts: 1, eligibleFailures: 0, resolution: 'cleared', cleared: true, lastAttemptAt: 1, lastClearAt: 1, bypassedAt: null, attemptStartAt: null, lastAttemptSummary: null },
    ])),
  });

  assert.equal(result.snapshot.atContentCap, true);
  assert.equal(result.topRouteCandidates.some((candidate) => candidate.destinationCityId === 'city_index_5'), false);
  assert.equal(result.topRouteCandidates.some((candidate) => candidate.destinationModuleKey === 'alchemy' as never), false);
});
