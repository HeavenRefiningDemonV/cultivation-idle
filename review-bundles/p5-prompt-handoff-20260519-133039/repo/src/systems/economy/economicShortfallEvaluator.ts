import type { EconomicProblemKind } from './economicProblemKinds.js';
import { getProblemDestinationPolicy } from './problemDestinationPolicy.js';
import type {
  EconomicPriorityBand,
  EconomicReadinessBand,
  EconomicRuntimeSnapshot,
  EconomicShortfall,
  EconomicShortfallSeverity,
} from './economicRecommendationTypes.js';
import type { SpendPriorityId } from './spendOrderPolicy.js';
import { getAllPrepBudgetRegistryEntries, type EconomicPrepBudgetRegistryEntry } from './prepBudgetRegistry.js';
import { getCityTargetedMaterialIds, getLiveCriticalBuildCorrectionItemIds } from './economicSourceAdapters.js';

const PRIORITY_BAND_BY_ID: Record<SpendPriorityId, EconomicPriorityBand> = {
  maintain_consumable_floor: 1,
  reach_minimum_forge_floor: 2,
  build_merit_reserve: 3,
  build_spirit_stone_reserve: 4,
  reach_recommended_forge_floor: 5,
  buy_full_gate_prep_package: 6,
  build_correction_and_optional_runes: 7,
};

function toSeverity(gap: number, targetValue: number, priorityBand: EconomicPriorityBand): EconomicShortfallSeverity {
  if (gap <= 0) return 'low';
  const normalized = targetValue > 0 ? gap / targetValue : gap;
  if (priorityBand <= 2 || normalized >= 0.75) return 'critical';
  if (priorityBand <= 4 || normalized >= 0.4) return 'high';
  return normalized >= 0.15 ? 'medium' : 'low';
}

function buildShortfall(input: {
  id: string;
  problemKind: EconomicProblemKind;
  spendPriorityId: SpendPriorityId;
  currentValue: number;
  targetValue: number;
  mandatoryBeforeNextGate: boolean;
  label: string;
  relatedIds: string[];
  benefitCategory: EconomicShortfall['benefitCategory'];
  primaryRecommendedRouteKey: string | null;
}): EconomicShortfall | null {
  const gap = Math.max(0, input.targetValue - input.currentValue);
  if (gap <= 0) return null;
  const priorityBand = PRIORITY_BAND_BY_ID[input.spendPriorityId];
  const policy = getProblemDestinationPolicy(input.problemKind);
  return {
    id: input.id,
    problemKind: input.problemKind,
    severity: toSeverity(gap, input.targetValue, priorityBand),
    currentValue: input.currentValue,
    targetValue: input.targetValue,
    gap,
    mandatoryBeforeNextGate: input.mandatoryBeforeNextGate,
    spendPriorityId: input.spendPriorityId,
    priorityBand,
    primaryDestinationFamily: policy.primaryDestinations[0],
    primaryRecommendedRouteKey: input.primaryRecommendedRouteKey,
    label: input.label,
    relatedIds: input.relatedIds,
    benefitCategory: input.benefitCategory,
  };
}

function getCurrentGateBudget(snapshot: EconomicRuntimeSnapshot): EconomicPrepBudgetRegistryEntry | null {
  return getAllPrepBudgetRegistryEntries().find((entry) => entry.gateIndex === snapshot.currentGateIndex) ?? null;
}

function getPackageCoverage(itemCountsById: Record<string, number>, lines: readonly { itemId: string; qty: number }[]) {
  const currentValue = lines.reduce((total, line) => total + Math.min(itemCountsById[line.itemId] ?? 0, line.qty), 0);
  const targetValue = lines.reduce((total, line) => total + line.qty, 0);
  const missingLines = lines.filter((line) => (itemCountsById[line.itemId] ?? 0) < line.qty);
  return { currentValue, targetValue, missingLines };
}

function getSpecialtyCoverage(snapshot: EconomicRuntimeSnapshot, budget: EconomicPrepBudgetRegistryEntry | null) {
  const cityId = snapshot.currentCityId;
  const cultivationPrepItemId = snapshot.spendPolicy.consumableFloor.cultivationPrepItemId;
  const supplementIds = (budget?.minimumPrepPackage.stockPackage.supplementLanes ?? []).flatMap((lane) => lane.optionItemIds);
  const directSpecialtyIds = (budget?.minimumPrepPackage.stockPackage.directCore ?? [])
    .map((line) => line.itemId)
    .filter((itemId) => itemId !== 'cons_healing_pellet_t1' && itemId !== cultivationPrepItemId);
  const relevantIds = [...new Set([...directSpecialtyIds, ...supplementIds])];
  if (!cityId || relevantIds.length === 0) {
    return { currentValue: 0, targetValue: snapshot.spendPolicy.consumableFloor.specialtyFloor, relatedIds: [] as string[] };
  }
  const currentValue = relevantIds.reduce((total, itemId) => total + (snapshot.ownedItemCountsById[itemId] ?? 0), 0);
  return {
    currentValue,
    targetValue: snapshot.spendPolicy.consumableFloor.specialtyFloor,
    relatedIds: [...new Set(relevantIds)],
  };
}

function getForgeProgressValue(snapshot: EconomicRuntimeSnapshot, budget: EconomicPrepBudgetRegistryEntry | null, recommended = false) {
  if (!budget) return { currentValue: 0, targetValue: 0 };
  const floor = recommended ? budget.recommendedPrepPackage.forgeFloor : budget.minimumPrepPackage.forgeFloor;
  const currentRune = Math.min(snapshot.forgeFloor.runeTotalCount, floor.runeRecommendation.recommendedHigh || floor.runeRecommendation.minimum);
  const targetRune = floor.runeRecommendation.recommendedHigh || floor.runeRecommendation.minimum;
  return {
    currentValue:
      snapshot.forgeFloor.weaponRefineFloor
      + snapshot.forgeFloor.accessoryRefineFloor
      + snapshot.forgeFloor.temperSuccessTotal
      + currentRune,
    targetValue:
      floor.weaponRefine
      + floor.accessoryRefine
      + floor.temperSuccesses
      + targetRune,
  };
}

function pickPrimaryRouteKey(snapshot: EconomicRuntimeSnapshot, relatedIds: string[]): string | null {
  const firstRelatedId = relatedIds[0];
  if (!firstRelatedId) return null;
  const entry = snapshot.bestSourceIndex.entriesByTargetId[firstRelatedId];
  return entry?.primarySource?.routeRefId ?? null;
}

export interface EconomicShortfallEvaluation {
  shortfalls: EconomicShortfall[];
  readinessBand: EconomicReadinessBand;
}

export function evaluateEconomicShortfalls(snapshot: EconomicRuntimeSnapshot): EconomicShortfallEvaluation {
  const budget = getCurrentGateBudget(snapshot);
  const minimumPackage = budget?.minimumPrepPackage.stockPackage.directCore ?? [];
  const recommendedPackage = budget?.recommendedPrepPackage.stockPackage.directCore ?? [];
  const cultivationPrepItemId = snapshot.spendPolicy.consumableFloor.cultivationPrepItemId;
  const targetedMaterialIds = snapshot.currentCityId ? getCityTargetedMaterialIds(snapshot.currentCityId) : [];
  const firstMissingTargetedMaterialId = targetedMaterialIds.find((itemId) => (snapshot.ownedItemCountsById[itemId] ?? 0) <= 0) ?? null;
  const buildCorrectionIds = getLiveCriticalBuildCorrectionItemIds();
  const buildCorrectionCurrent = buildCorrectionIds.reduce((total, itemId) => total + (snapshot.ownedItemCountsById[itemId] ?? 0), 0);
  const directMinimumCoverage = getPackageCoverage(snapshot.ownedItemCountsById, minimumPackage);
  const directRecommendedCoverage = getPackageCoverage(snapshot.ownedItemCountsById, recommendedPackage);
  const specialtyCoverage = getSpecialtyCoverage(snapshot, budget);
  const minimumForge = getForgeProgressValue(snapshot, budget, false);
  const recommendedForge = getForgeProgressValue(snapshot, budget, true);

  const shortfalls = [
    buildShortfall({
      id: 'healing-floor',
      problemKind: 'belowHealingFloor',
      spendPriorityId: 'maintain_consumable_floor',
      currentValue: snapshot.ownedItemCountsById.cons_healing_pellet_t1 ?? 0,
      targetValue: snapshot.spendPolicy.consumableFloor.healingFloor,
      mandatoryBeforeNextGate: true,
      label: 'Healing floor below target',
      relatedIds: ['cons_healing_pellet_t1'],
      benefitCategory: 'consumable_floor',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, ['cons_healing_pellet_t1']),
    }),
    buildShortfall({
      id: 'specialty-floor',
      problemKind: 'belowSpecialtyFloor',
      spendPriorityId: 'maintain_consumable_floor',
      currentValue: specialtyCoverage.currentValue,
      targetValue: specialtyCoverage.targetValue,
      mandatoryBeforeNextGate: snapshot.spendPolicy.consumableFloor.specialtyFloor > 0,
      label: 'Current-city specialty stock below target',
      relatedIds: specialtyCoverage.relatedIds,
      benefitCategory: 'consumable_floor',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, specialtyCoverage.relatedIds),
    }),
    buildShortfall({
      id: 'cultivation-prep-floor',
      problemKind: 'belowCultivationPrepFloor',
      spendPriorityId: 'maintain_consumable_floor',
      currentValue: cultivationPrepItemId ? snapshot.ownedItemCountsById[cultivationPrepItemId] ?? 0 : 0,
      targetValue: snapshot.spendPolicy.consumableFloor.cultivationPrepFloor,
      mandatoryBeforeNextGate: true,
      label: 'Cultivation-prep tonic below target',
      relatedIds: cultivationPrepItemId ? [cultivationPrepItemId] : [],
      benefitCategory: 'consumable_floor',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, cultivationPrepItemId ? [cultivationPrepItemId] : []),
    }),
    buildShortfall({
      id: 'minimum-forge-floor',
      problemKind: 'belowMinimumForgeFloor',
      spendPriorityId: 'reach_minimum_forge_floor',
      currentValue: minimumForge.currentValue,
      targetValue: minimumForge.targetValue,
      mandatoryBeforeNextGate: true,
      label: 'Minimum forge floor below target',
      relatedIds: ['weapon', 'accessory', 'temper'],
      benefitCategory: 'forge_floor',
      primaryRecommendedRouteKey: 'forge:minimum-floor',
    }),
    buildShortfall({
      id: 'merit-reserve',
      problemKind: 'belowMeritReserve',
      spendPriorityId: 'build_merit_reserve',
      currentValue: Number(snapshot.supportEconomy.currentMerit),
      targetValue: Number(snapshot.supportEconomy.targetMeritReserve),
      mandatoryBeforeNextGate: true,
      label: 'Merit reserve below target',
      relatedIds: ['merit'],
      benefitCategory: 'support_reserve',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, ['merit']),
    }),
    buildShortfall({
      id: 'spirit-stone-minimum',
      problemKind: 'belowSpiritStoneMinimum',
      spendPriorityId: 'build_spirit_stone_reserve',
      currentValue: Number(snapshot.supportEconomy.currentSpiritStones),
      targetValue: Number(snapshot.supportEconomy.spiritStoneMinimumReserve),
      mandatoryBeforeNextGate: true,
      label: 'Spirit-stone reserve below minimum',
      relatedIds: ['spiritStones'],
      benefitCategory: 'support_reserve',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, ['spiritStones']),
    }),
    buildShortfall({
      id: 'spirit-stone-ideal',
      problemKind: 'belowSpiritStoneIdeal',
      spendPriorityId: 'build_spirit_stone_reserve',
      currentValue: Number(snapshot.supportEconomy.currentSpiritStones),
      targetValue: Number(snapshot.supportEconomy.spiritStoneIdealReserve),
      mandatoryBeforeNextGate: false,
      label: 'Spirit-stone reserve below ideal',
      relatedIds: ['spiritStones'],
      benefitCategory: 'support_reserve',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, ['spiritStones']),
    }),
    buildShortfall({
      id: 'recommended-forge-floor',
      problemKind: 'belowRecommendedForgeFloor',
      spendPriorityId: 'reach_recommended_forge_floor',
      currentValue: recommendedForge.currentValue,
      targetValue: recommendedForge.targetValue,
      mandatoryBeforeNextGate: false,
      label: 'Recommended forge floor below target',
      relatedIds: ['weapon', 'accessory', 'temper', 'runes'],
      benefitCategory: 'forge_floor',
      primaryRecommendedRouteKey: 'forge:recommended-floor',
    }),
    buildShortfall({
      id: 'gate-prep-package',
      problemKind: 'missingGatePrepPackage',
      spendPriorityId: 'buy_full_gate_prep_package',
      currentValue: directRecommendedCoverage.currentValue,
      targetValue: directRecommendedCoverage.targetValue,
      mandatoryBeforeNextGate: false,
      label: 'Recommended direct gate-prep package incomplete',
      relatedIds: directRecommendedCoverage.missingLines.map((line) => line.itemId),
      benefitCategory: 'gate_prep',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, directRecommendedCoverage.missingLines.map((line) => line.itemId)),
    }),
    firstMissingTargetedMaterialId
      ? buildShortfall({
        id: `targeted-material:${firstMissingTargetedMaterialId}`,
        problemKind: 'missingTargetedLocalMaterial',
        spendPriorityId: 'buy_full_gate_prep_package',
        currentValue: snapshot.ownedItemCountsById[firstMissingTargetedMaterialId] ?? 0,
        targetValue: 1,
        mandatoryBeforeNextGate: false,
        label: 'Targeted local material missing',
        relatedIds: [firstMissingTargetedMaterialId],
        benefitCategory: 'targeted_material',
        primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, [firstMissingTargetedMaterialId]),
      })
      : null,
    buildShortfall({
      id: 'build-correction',
      problemKind: 'buildCorrectionGap',
      spendPriorityId: 'build_correction_and_optional_runes',
      currentValue: buildCorrectionCurrent,
      targetValue: 1,
      mandatoryBeforeNextGate: false,
      label: 'Build-correction reserve missing',
      relatedIds: buildCorrectionIds,
      benefitCategory: 'build_correction',
      primaryRecommendedRouteKey: pickPrimaryRouteKey(snapshot, buildCorrectionIds),
    }),
  ].filter((entry): entry is EconomicShortfall => Boolean(entry));

  shortfalls.sort((left, right) =>
    left.priorityBand - right.priorityBand
    || (left.mandatoryBeforeNextGate === right.mandatoryBeforeNextGate ? 0 : left.mandatoryBeforeNextGate ? -1 : 1)
    || right.gap - left.gap
    || left.label.localeCompare(right.label),
  );

  const readinessBand: EconomicReadinessBand =
    shortfalls.some((entry) => entry.mandatoryBeforeNextGate && entry.priorityBand <= 4)
      ? 'below_minimum'
      : shortfalls.some((entry) => entry.priorityBand <= 6)
        ? 'minimum_met_below_recommended'
        : 'recommended_met';

  void directMinimumCoverage;

  return { shortfalls, readinessBand };
}
