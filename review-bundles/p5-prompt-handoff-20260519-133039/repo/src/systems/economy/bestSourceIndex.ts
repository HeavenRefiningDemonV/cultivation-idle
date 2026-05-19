import type { LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import { getVisibleAlchemyRecipes, getVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';
import { buildEconomicStockFloorSnapshot } from './spendOrderPolicy.js';
import { getSupportReserveTargetsByGateIndex } from './supportCurrencyTargets.js';
import { getAllProblemDestinationPolicies, type EconomicDestinationFamily } from './problemDestinationPolicy.js';
import {
  classifyMaterialRoutingBand,
  findApothecaryStockSource,
  findOutskirtsSourceByItemId,
  findRuinSourceByItemId,
  getAllLiveCriticalTargetedMaterialIds,
  getCityById,
  getCityIndex,
  getCitySupportIdentity,
  getCityTargetedMaterialIds,
  getDeterministicAnchorItemId,
  getItemName,
  getOnePriorCityId,
  getSupportCurrencyIds,
  isBuildCorrectionItem,
  isSupportCurrencyId,
  listExpeditionItemSources,
  listVisibleAlchemyInputsForOutput,
  listVisibleAlchemyOutputItemIds,
  listVisibleForgeInputItemIds,
  getLiveCriticalBuildCorrectionItemIds,
  getTargetedMaterialOwningCityId,
} from './economicSourceAdapters.js';
import { getLiveExpeditionRoutePurpose } from '../world/expeditionRouteContract.js';
import { getTargetedMaterialSinkMapEntry } from './targetedMaterialSinkMap.js';
import { getAllGateFailureMeritPolicies } from './gateFailureMeritPolicy.js';

export type BestSourceTargetType = 'item' | 'currency';
export type BestSourceClassification = 'common' | 'targeted' | 'support' | 'conversion';
export type BestSourceActivityMode = 'active' | 'passive' | 'background';
export type BestSourceLocality = 'city_local' | 'one_prior_fallback' | 'evergreen';
export type EconomicSourceKind = EconomicDestinationFamily;

export interface BestSourceOption {
  sourceKind: EconomicSourceKind;
  moduleKey: LiveWorldModuleKey;
  cityId: string | null;
  cityIndex: number | null;
  routeRefId: string;
  routeDetail: string;
  reason: string;
  activityMode: BestSourceActivityMode;
  locality: BestSourceLocality;
  classification: BestSourceClassification;
  currentCityEligibilityRule: string;
  currentCityEligible: boolean;
  shortReason: string;
  sortOrder?: number;
}

export interface BestSourceIndexEntry {
  targetId: string;
  targetType: BestSourceTargetType;
  itemName: string;
  classification: BestSourceClassification;
  currentCityEligibilityRule: string;
  primarySource: BestSourceOption | null;
  secondarySource: BestSourceOption | null;
  sourceOptions: BestSourceOption[];
  shortReason: string;
  sortOrder?: number;
}

export interface BestSourceIndex {
  scopeTargetIds: string[];
  entries: BestSourceIndexEntry[];
  entriesByTargetId: Record<string, BestSourceIndexEntry>;
}

const LIVE_CRITICAL_SCOPE_CURRENCY_IDS = ['gold', 'merit', 'spiritStones'] as const;

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function compareOptions(left: BestSourceOption, right: BestSourceOption) {
  const activityOrder: Record<BestSourceActivityMode, number> = { active: 0, background: 1, passive: 2 };
  const localityOrder: Record<BestSourceLocality, number> = { city_local: 0, evergreen: 1, one_prior_fallback: 2 };
  const kindOrder: Record<EconomicSourceKind, number> = {
    apothecary_buy: 0,
    apothecary_brew: 1,
    ruins: 2,
    outskirts: 3,
    forge: 4,
    bounties: 5,
    expeditions: 6,
    manual_pavilion: 7,
    gate_trial: 8,
  };
  return (left.sortOrder ?? kindOrder[left.sourceKind]) - (right.sortOrder ?? kindOrder[right.sourceKind])
    || localityOrder[left.locality] - localityOrder[right.locality]
    || activityOrder[left.activityMode] - activityOrder[right.activityMode]
    || kindOrder[left.sourceKind] - kindOrder[right.sourceKind]
    || (left.cityIndex ?? 99) - (right.cityIndex ?? 99)
    || left.routeRefId.localeCompare(right.routeRefId);
}

function pushOption(list: BestSourceOption[], option: BestSourceOption | null) {
  if (!option) return;
  if (list.some((entry) => entry.sourceKind === option.sourceKind && entry.routeRefId === option.routeRefId && entry.cityId === option.cityId)) {
    return;
  }
  list.push(option);
}

function getScopeTargetIds(content: ValidatedContent): string[] {
  const targets = new Set<string>(LIVE_CRITICAL_SCOPE_CURRENCY_IDS);

  getAllPrepBudgetRegistryEntries().forEach((entry) => {
    entry.minimumPrepPackage.stockPackage.directCore.forEach((line) => targets.add(line.itemId));
    entry.minimumPrepPackage.stockPackage.supplementLanes.forEach((lane) => lane.optionItemIds.forEach((itemId) => targets.add(itemId)));
    entry.recommendedPrepPackage.stockPackage.directCore.forEach((line) => targets.add(line.itemId));
    entry.recommendedPrepPackage.stockPackage.supplementLanes.forEach((lane) => lane.optionItemIds.forEach((itemId) => targets.add(itemId)));
  });

  content.cities.forEach((city) => {
    const floors = buildEconomicStockFloorSnapshot({ gateIndex: city.index + 1, cityId: city.id as never });
    if (floors.cultivationPrepItemId) targets.add(floors.cultivationPrepItemId);
  });

  listVisibleAlchemyOutputItemIds(content).forEach((itemId) => targets.add(itemId));
  listVisibleForgeInputItemIds(content).forEach((itemId) => targets.add(itemId));
  getAllLiveCriticalTargetedMaterialIds().forEach((itemId) => targets.add(itemId));
  getLiveCriticalBuildCorrectionItemIds().forEach((itemId) => targets.add(itemId));

  let changed = true;
  while (changed) {
    changed = false;
    for (const itemId of [...targets]) {
      for (const input of listVisibleAlchemyInputsForOutput(content, itemId)) {
        if (!targets.has(input.itemId)) {
          targets.add(input.itemId);
          changed = true;
        }
      }
    }
  }

  return [...targets].sort();
}

function buildCurrencyEntry(targetId: string): BestSourceIndexEntry {
  if (targetId === 'gold') {
    const sourceOptions: BestSourceOption[] = [
      {
        sourceKind: 'outskirts',
        moduleKey: 'outskirts',
        cityId: null,
        cityIndex: null,
        routeRefId: 'outskirts:any',
        routeDetail: 'Active field farming with common-material upside.',
        reason: 'Outskirts is the locked gold + common-mat primary route.',
        activityMode: 'active',
        locality: 'evergreen',
        classification: 'common',
        currentCityEligibilityRule: 'Current city outskirts always qualifies for live gold routing.',
        currentCityEligible: true,
        shortReason: 'Gold + common mats',
        sortOrder: 0,
      },
      {
        sourceKind: 'bounties',
        moduleKey: 'bounties',
        cityId: null,
        cityIndex: null,
        routeRefId: 'bounties:any',
        routeDetail: 'Support-economy fallback with Merit and spirit stones attached.',
        reason: 'Bounties remain the bounded support fallback for currency shortages.',
        activityMode: 'background',
        locality: 'evergreen',
        classification: 'support',
        currentCityEligibilityRule: 'Any unlocked city bounty board can cover support-currency routing.',
        currentCityEligible: true,
        shortReason: 'Support currency fallback',
        sortOrder: 1,
      },
    ];
    return {
      targetId,
      targetType: 'currency',
      itemName: 'Gold',
      classification: 'common',
      currentCityEligibilityRule: 'Use current city outskirts first; bounties remain the support fallback.',
      primarySource: sourceOptions[0],
      secondarySource: sourceOptions[1],
      sourceOptions,
      shortReason: 'Gold should come from Outskirts first.',
    };
  }

  if (targetId === 'merit') {
    const gatePolicy = getAllGateFailureMeritPolicies()[0] ?? null;
    const sourceOptions: BestSourceOption[] = [
      {
        sourceKind: 'bounties',
        moduleKey: 'bounties',
        cityId: null,
        cityIndex: null,
        routeRefId: 'bounties:any',
        routeDetail: 'Bounty board is the canonical Merit reserve route.',
        reason: 'Merit reserve gaps must route to Bounties first.',
        activityMode: 'background',
        locality: 'evergreen',
        classification: 'support',
        currentCityEligibilityRule: 'Use the current city bounty board first for Merit reserve recovery.',
        currentCityEligible: true,
        shortReason: 'Canonical Merit route',
        sortOrder: 0,
      },
      {
        sourceKind: 'gate_trial',
        moduleKey: 'gateTrial',
        cityId: null,
        cityIndex: null,
        routeRefId: gatePolicy ? `gate_${gatePolicy.gateIndex}` : 'eligible_gate_defeat',
        routeDetail: 'Eligible gate defeats provide bounded fallback Merit only when that packet truth is live.',
        reason: 'Gate-defeat fallback is allowed only because Packet 3.8 exposed this support truth.',
        activityMode: 'active',
        locality: 'evergreen',
        classification: 'support',
        currentCityEligibilityRule: 'Only the current gate-trial band may provide the eligible-defeat fallback.',
        currentCityEligible: true,
        shortReason: 'Eligible defeat fallback',
        sortOrder: 1,
      },
    ];
    return {
      targetId,
      targetType: 'currency',
      itemName: 'Merit',
      classification: 'support',
      currentCityEligibilityRule: 'Current city bounty board first; gate-trial fallback only if still in the active gate band.',
      primarySource: sourceOptions[0],
      secondarySource: sourceOptions[1],
      sourceOptions,
      shortReason: 'Merit reserve gaps route to Bounties first.',
    };
  }

  const sourceOptions: BestSourceOption[] = [
    {
      sourceKind: 'bounties',
      moduleKey: 'bounties',
      cityId: null,
      cityIndex: null,
      routeRefId: 'bounties:any',
      routeDetail: 'Bounty board is the canonical spirit-stone reserve route.',
      reason: 'Spirit-stone reserve gaps must route to Bounties first.',
      activityMode: 'background',
      locality: 'evergreen',
      classification: 'support',
      currentCityEligibilityRule: 'Use the current city bounty board first for spirit-stone reserve recovery.',
      currentCityEligible: true,
      shortReason: 'Canonical spirit-stone route',
        sortOrder: 0,
    },
    {
      sourceKind: 'gate_trial',
      moduleKey: 'gateTrial',
      cityId: null,
      cityIndex: null,
      routeRefId: 'gate_trial_support',
      routeDetail: 'Gate-trial/fail-safe support remains the only explicit non-bounty reserve fallback exposed by the branch.',
      reason: 'No unrelated module should be used as a spirit-stone reserve recommendation.',
      activityMode: 'active',
      locality: 'evergreen',
      classification: 'support',
      currentCityEligibilityRule: 'Only the current gate-trial support band may act as a fallback.',
      currentCityEligible: true,
      shortReason: 'Bounded reserve fallback',
        sortOrder: 1,
    },
  ];
  return {
    targetId,
    targetType: 'currency',
    itemName: 'Spirit Stones',
    classification: 'support',
    currentCityEligibilityRule: 'Current city bounty board first; bounded gate-trial support is the only fallback.',
    primarySource: sourceOptions[0],
    secondarySource: sourceOptions[1],
    sourceOptions,
    shortReason: 'Spirit-stone reserve gaps route to Bounties first.',
  };
}

function buildItemEntry(content: ValidatedContent, targetId: string): BestSourceIndexEntry {
  const itemName = getItemName(content, targetId);
  const targetOwningCityId = getTargetedMaterialOwningCityId(targetId);
  const targetOwningCity = getCityById(content, targetOwningCityId);
  const onePriorCityId = getOnePriorCityId(content, targetOwningCityId);
  const classification: BestSourceClassification = isBuildCorrectionItem(targetId)
    ? 'support'
    : targetOwningCityId
      ? 'targeted'
      : targetId.startsWith('cons_') || targetId.startsWith('reagent_')
        ? 'conversion'
        : 'common';
  const sourceOptions: BestSourceOption[] = [];

  if (targetId.startsWith('cons_') || targetId.startsWith('reagent_')) {
    const stockSource = targetOwningCityId
      ? findApothecaryStockSource(content, targetId, targetOwningCityId)
      : content.cities
          .map((city) => findApothecaryStockSource(content, targetId, city.id))
          .find((entry) => Boolean(entry)) ?? null;
    const recipeSource = getVisibleAlchemyRecipes(content).find((recipe) => Number(recipe.outputs?.[targetId] ?? 0) > 0) ?? null;

    pushOption(sourceOptions, stockSource ? {
      sourceKind: 'apothecary_buy',
      moduleKey: 'apothecary',
      cityId: stockSource.shop.cityId,
      cityIndex: stockSource.city?.index ?? null,
      routeRefId: stockSource.shop.id,
      routeDetail: stockSource.stockEntry.dailyLimit == null
        ? 'Shelf stock is uncapped for immediate readiness.'
        : `Shelf stock is immediate and bounded by a daily limit of ${stockSource.stockEntry.dailyLimit}.`,
      reason: 'Consumable shortages should route to Apothecary Buy first when the current city stocks them and the cap can still cover the gap.',
      activityMode: 'background',
      locality: stockSource.shop.cityId === targetOwningCityId || !targetOwningCityId ? 'city_local' : 'one_prior_fallback',
      classification: 'conversion',
      currentCityEligibilityRule: 'Use the current city shop first; if the item is not sold there, use brew before older-city travel.',
      currentCityEligible: true,
      shortReason: 'Immediate shop stock',
      sortOrder: 0,
    } : null);

    pushOption(sourceOptions, recipeSource ? {
      sourceKind: 'apothecary_brew',
      moduleKey: 'apothecary',
      cityId: recipeSource.unlocksAtCityId ?? null,
      cityIndex: getCityIndex(content, recipeSource.unlocksAtCityId ?? null),
      routeRefId: recipeSource.id,
      routeDetail: 'Live Apothecary Brew route using visible semester recipes.',
      reason: 'Brew is the honest fallback when shop stock is capped or the item is not directly sold in the current city.',
      activityMode: 'background',
      locality: recipeSource.unlocksAtCityId === targetOwningCityId || !targetOwningCityId ? 'city_local' : 'evergreen',
      classification: 'conversion',
      currentCityEligibilityRule: 'Use Apothecary Brew instead of pointing at a separate Alchemy room.',
      currentCityEligible: true,
      shortReason: 'Brew fallback',
      sortOrder: 1,
    } : null);
  }

  if (isBuildCorrectionItem(targetId)) {
    pushOption(sourceOptions, {
      sourceKind: 'expeditions',
      moduleKey: 'expeditions',
      cityId: null,
      cityIndex: null,
      routeRefId: 'scout',
      routeDetail: 'Scout expeditions are the canonical build-correction support route.',
      reason: 'Technique fragments and manual scraps should be sourced through scout support, not flattened into generic combat farming.',
      activityMode: 'passive',
      locality: 'evergreen',
      classification: 'support',
      currentCityEligibilityRule: 'Current city scout expeditions are the primary support route.',
      currentCityEligible: true,
      shortReason: 'Scout support route',
      sortOrder: 0,
    });
    pushOption(sourceOptions, {
      sourceKind: 'manual_pavilion',
      moduleKey: 'manualPavilion',
      cityId: targetOwningCityId,
      cityIndex: targetOwningCity?.index ?? null,
      routeRefId: 'manual_pavilion_support',
      routeDetail: 'Manual Pavilion is the destination for spending build-correction support once fragments are acquired.',
      reason: 'Build-correction gaps should surface Manual Pavilion as the destination module, with scout support feeding it.',
      activityMode: 'background',
      locality: 'evergreen',
      classification: 'support',
      currentCityEligibilityRule: 'Manual Pavilion remains the correction destination, not the material generator.',
      currentCityEligible: true,
      shortReason: 'Correction destination',
      sortOrder: 1,
    });
  }

  if (targetOwningCityId) {
    const ruin = findRuinSourceByItemId(content, targetId, targetOwningCityId);
    const expeditionSources = listExpeditionItemSources(content, targetId, targetOwningCityId);
    const outskirts = findOutskirtsSourceByItemId(content, targetId, targetOwningCityId);
    const roleBand = classifyMaterialRoutingBand(targetOwningCityId, targetId);
    const sinkMapEntry = (getAllLiveCriticalTargetedMaterialIds() as string[]).includes(targetId)
      ? getTargetedMaterialSinkMapEntry(targetId as never)
      : null;

    pushOption(sourceOptions, ruin ? {
      sourceKind: 'ruins',
      moduleKey: 'ruins',
      cityId: targetOwningCityId,
      cityIndex: targetOwningCity?.index ?? null,
      routeRefId: ruin.id,
      routeDetail: sinkMapEntry
        ? `City-local ruins target ${targetId} and support ${sinkMapEntry.primarySinkIds.join(', ')}.`
        : `City-local ruins are the targeted source for ${targetId}.`,
      reason: 'Targeted local shortages must route to city-local Ruins first.',
      activityMode: 'active',
      locality: 'city_local',
      classification: roleBand === 'common_field' ? 'common' : 'targeted',
      currentCityEligibilityRule: 'Targeted local materials should resolve in the owning city ruins before any fallback.',
      currentCityEligible: true,
      shortReason: 'City-local targeted source',
      sortOrder: 0,
    } : null);

    const expedition = expeditionSources.find((entry) => entry.cityId === targetOwningCityId)
      ?? expeditionSources.find((entry) => entry.locality === 'city_local')
      ?? expeditionSources[0]
      ?? null;
    pushOption(sourceOptions, expedition ? {
      sourceKind: 'expeditions',
      moduleKey: 'expeditions',
      cityId: expedition.cityId,
      cityIndex: expedition.cityIndex,
      routeRefId: expedition.expeditionTypeId,
      routeDetail: `${expedition.expeditionTypeId} expedition yields ${expedition.qty} and matches ${getLiveExpeditionRoutePurpose(expedition.expeditionTypeId)?.moduleKey ?? 'expeditions'} routing.`,
      reason: 'Targeted local shortages may use local expedition support as the bounded secondary route.',
      activityMode: 'passive',
      locality: expedition.locality,
      classification: 'targeted',
      currentCityEligibilityRule: 'Only current city or one backward-compatible prior-city expedition support is allowed.',
      currentCityEligible: expedition.locality !== 'evergreen' || expedition.cityId === targetOwningCityId,
      shortReason: 'Passive shortage smoothing',
      sortOrder: 1,
    } : null);

    pushOption(sourceOptions, outskirts ? {
      sourceKind: 'outskirts',
      moduleKey: 'outskirts',
      cityId: targetOwningCityId,
      cityIndex: targetOwningCity?.index ?? null,
      routeRefId: outskirts.id,
      routeDetail: `Rare-spike fallback in ${getCitySupportIdentity(targetOwningCityId) ?? 'live city'} outskirts.`,
      reason: 'Outskirts can only be a tertiary fallback for targeted local materials when the live role profile already exposes a rare spike there.',
      activityMode: 'active',
      locality: 'city_local',
      classification: 'targeted',
      currentCityEligibilityRule: 'Outskirts is never the primary targeted-material recommendation.',
      currentCityEligible: true,
      shortReason: 'Rare-spike tertiary fallback',
      sortOrder: 2,
    } : null);
  }

  if (!targetOwningCityId && !isBuildCorrectionItem(targetId) && !targetId.startsWith('cons_') && !targetId.startsWith('reagent_')) {
    for (const city of content.cities) {
      const outskirts = findOutskirtsSourceByItemId(content, targetId, city.id);
      if (outskirts) {
        pushOption(sourceOptions, {
          sourceKind: 'outskirts',
          moduleKey: 'outskirts',
          cityId: city.id,
          cityIndex: city.index,
          routeRefId: outskirts.id,
          routeDetail: `${city.name} outskirts exposes the material directly.`,
          reason: 'Common evergreen shortages should route to Outskirts first.',
          activityMode: 'active',
          locality: city.index === 0 ? 'evergreen' : 'city_local',
          classification: 'common',
          currentCityEligibilityRule: 'Use the current city outskirts first for common-material shortages.',
          currentCityEligible: true,
          shortReason: 'Primary common-material route',
          sortOrder: 0,
        });
        break;
      }
    }

    const expedition = listExpeditionItemSources(content, targetId, content.cities[0]?.id ?? null)[0] ?? null;
    pushOption(sourceOptions, expedition ? {
      sourceKind: 'expeditions',
      moduleKey: 'expeditions',
      cityId: expedition.cityId,
      cityIndex: expedition.cityIndex,
      routeRefId: expedition.expeditionTypeId,
      routeDetail: `${expedition.expeditionTypeId} expedition yields the material as passive smoothing.`,
      reason: 'Short expeditions are the bounded passive fallback for common shortages.',
      activityMode: 'passive',
      locality: expedition.locality === 'one_prior_fallback' ? 'evergreen' : expedition.locality,
      classification: 'common',
      currentCityEligibilityRule: 'Expedition fallback must remain current city or evergreen, never a deep old-city chain.',
      currentCityEligible: true,
      shortReason: 'Passive common-material fallback',
      sortOrder: 1,
    } : null);
  }

  if (sourceOptions.length === 0 && targetId.startsWith('cons_')) {
    pushOption(sourceOptions, {
      sourceKind: 'apothecary_brew',
      moduleKey: 'apothecary',
      cityId: null,
      cityIndex: null,
      routeRefId: `brew:${targetId}`,
      routeDetail: 'Fallback to visible Apothecary Brew support if no direct stock route exists.',
      reason: 'Consumables should never point to a separate Alchemy room.',
      activityMode: 'background',
      locality: 'evergreen',
      classification: 'conversion',
      currentCityEligibilityRule: 'Use visible Apothecary Brew support only.',
      currentCityEligible: true,
      shortReason: 'Visible brew-only fallback',
      sortOrder: 0,
    });
  }

  sourceOptions.sort(compareOptions);

  return {
    targetId,
    targetType: 'item',
    itemName,
    classification,
    currentCityEligibilityRule: sourceOptions[0]?.currentCityEligibilityRule ?? 'No live route available.',
    primarySource: sourceOptions[0] ?? null,
    secondarySource: sourceOptions[1] ?? null,
    sourceOptions,
    shortReason: sourceOptions[0]?.reason ?? 'No live route available.',
  };
}

export function buildBestSourceIndex(content: ValidatedContent): BestSourceIndex {
  const scopeTargetIds = getScopeTargetIds(content);
  const entries = scopeTargetIds.map((targetId) =>
    isSupportCurrencyId(targetId) ? buildCurrencyEntry(targetId) : buildItemEntry(content, targetId),
  );
  const entriesByTargetId = Object.fromEntries(entries.map((entry) => [entry.targetId, entry])) as Record<string, BestSourceIndexEntry>;
  return { scopeTargetIds, entries, entriesByTargetId };
}

export function getBestSourceIndexEntry(index: BestSourceIndex, targetId: string): BestSourceIndexEntry | null {
  return index.entriesByTargetId[targetId] ?? null;
}

export function listLiveCriticalSourceTargetIds(content: ValidatedContent): string[] {
  return buildBestSourceIndex(content).scopeTargetIds;
}

export function getAllProblemDestinationFamilies(): EconomicDestinationFamily[] {
  return unique(getAllProblemDestinationPolicies().flatMap((policy) => [...policy.primaryDestinations, ...policy.secondaryDestinations])) as EconomicDestinationFamily[];
}
