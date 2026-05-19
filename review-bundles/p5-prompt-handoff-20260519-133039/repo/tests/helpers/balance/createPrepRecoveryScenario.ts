import { buildForgeFloorReadModel } from '../../../src/systems/forge/forgeFloorReadModel.js';
import { buildEconomicRuntimeSnapshotFromState } from '../../../src/systems/economy/economicSnapshot.js';
import { getAllPrepBudgetRegistryEntries } from '../../../src/systems/economy/prepBudgetRegistry.js';
import { getLiveCriticalBuildCorrectionItemIds } from '../../../src/systems/economy/economicSourceAdapters.js';
import type { ValidatedContent } from '../../../src/content/index.js';
import type { PrepRecoveryScenarioKind } from '../../../src/systems/balance/prepEconomyTargets.js';

export function createPrepRecoveryScenario(content: ValidatedContent, gateIndex: number, kind: PrepRecoveryScenarioKind) {
  const budget = getAllPrepBudgetRegistryEntries().find((entry) => entry.gateIndex === gateIndex);
  if (!budget) throw new Error(`Missing prep budget for gate ${gateIndex}`);

  const itemCountsById: Record<string, number> = {};
  budget.recommendedPrepPackage.stockPackage.directCore.forEach((line) => {
    itemCountsById[line.itemId] = line.qty;
  });
  budget.recommendedPrepPackage.stockPackage.supplementLanes.forEach((lane) => {
    if (lane.optionItemIds[0]) itemCountsById[lane.optionItemIds[0]] = Math.max(itemCountsById[lane.optionItemIds[0]] ?? 0, lane.qty);
  });
  getLiveCriticalBuildCorrectionItemIds().forEach((itemId) => {
    itemCountsById[itemId] = 3;
  });

  if (kind === 'consumables_only') {
    budget.recommendedPrepPackage.stockPackage.directCore.forEach((line) => {
      itemCountsById[line.itemId] = 0;
    });
  }
  if (kind === 'build_correction_only') {
    getLiveCriticalBuildCorrectionItemIds().forEach((itemId) => {
      itemCountsById[itemId] = 0;
    });
  }

  const forgeFloor = kind === 'forge_floor_only'
    ? buildForgeFloorReadModel({
      weaponRefineFloor: Math.max(0, budget.minimumPrepPackage.forgeFloor.weaponRefine - 3),
      accessoryRefineFloor: Math.max(0, budget.minimumPrepPackage.forgeFloor.accessoryRefine - 3),
      temperSuccessesBySlot: { weapon: 0, accessory: 0 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: budget.cityIndex,
    })
    : buildForgeFloorReadModel({
      weaponRefineFloor: budget.recommendedPrepPackage.forgeFloor.weaponRefine,
      accessoryRefineFloor: budget.recommendedPrepPackage.forgeFloor.accessoryRefine,
      temperSuccessesBySlot: {
        weapon: Math.ceil(budget.recommendedPrepPackage.forgeFloor.temperSuccesses / 2),
        accessory: Math.floor(budget.recommendedPrepPackage.forgeFloor.temperSuccesses / 2),
      },
      inventoryRuneCounts: { rune_forge_guard_t1: budget.recommendedPrepPackage.forgeFloor.runeRecommendation.recommendedHigh },
      socketedRuneIds: [],
      cityIndex: budget.cityIndex,
    });

  return buildEconomicRuntimeSnapshotFromState({
    content,
    currentCityId: budget.cityId,
    unlockedCityIds: content.cities.filter((city) => city.index <= budget.cityIndex).map((city) => city.id),
    selectedModuleByCity: { [budget.cityId]: 'apothecary' },
    selectedPath: 'earth',
    currentRealmIndex: budget.gateIndex - 1,
    currencies: {
      gold: String(Math.max(budget.recommendedPrepPackage.goldSpendRange.recommended * 2, 999999)),
      merit: '999',
      spiritStones: '999',
    },
    itemCountsById,
    purchasedTodayByStockId: {},
    forgeFloor,
    expeditionState: {
      slots: 2,
      activeRunCount: 0,
      availableSlotCount: 2,
      activeRunTypeIds: [],
      activeOriginCityIds: [],
    },
    currentTrialProgressById: {},
  });
}
