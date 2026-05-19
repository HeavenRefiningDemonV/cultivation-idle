import type { LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import type { EconomicProblemKind } from './economicProblemKinds.js';
import { buildBestSourceIndex, getBestSourceIndexEntry, type BestSourceOption, type EconomicSourceKind } from './bestSourceIndex.js';
import { getProblemDestinationPolicy } from './problemDestinationPolicy.js';
import { getApothecaryShopByCityId, getCityById, getCityIndex, getOnePriorCityId } from './economicSourceAdapters.js';

export interface MissingMaterialRouteResolverInput {
  content: ValidatedContent;
  targetId: string;
  currentCityId: string;
  unlockedCityIds: readonly string[];
  currentTransitionId?: string | null;
  availableModuleKeys?: readonly LiveWorldModuleKey[];
  shortageQty?: number;
  allowPassive?: boolean;
  allowBackground?: boolean;
  purchasedTodayByStockId?: Record<string, number>;
  problemKind?: EconomicProblemKind;
}

export interface MissingMaterialRouteOption {
  destinationModuleKey: LiveWorldModuleKey;
  destinationCityId: string | null;
  routeType: EconomicSourceKind;
  whyPrimary: string;
  fallbackNote: string | null;
  blockedReason: string | null;
  activityMode: 'active' | 'passive' | 'background';
  locality: 'city_local' | 'one_prior_fallback' | 'evergreen';
}

function cityHasModule(content: ValidatedContent, cityId: string | null | undefined, moduleKey: LiveWorldModuleKey): boolean {
  if (!cityId) return true;
  return Boolean(getCityById(content, cityId)?.modules.includes(moduleKey));
}

function resolveAvailableModules(content: ValidatedContent, currentCityId: string, availableModuleKeys?: readonly LiveWorldModuleKey[]) {
  return availableModuleKeys ? [...availableModuleKeys] : (getCityById(content, currentCityId)?.modules as LiveWorldModuleKey[] | undefined) ?? [];
}

function resolveBlockedReason(input: MissingMaterialRouteResolverInput, option: BestSourceOption): string | null {
  const availableModules = resolveAvailableModules(input.content, input.currentCityId, input.availableModuleKeys);
  const currentCity = getCityById(input.content, input.currentCityId);
  const onePriorCityId = getOnePriorCityId(input.content, input.currentCityId);
  const optionCityIndex = option.cityId ? getCityIndex(input.content, option.cityId) : null;
  const currentCityIndex = currentCity?.index ?? null;

  if (!availableModules.includes(option.moduleKey)) {
    return `${option.moduleKey} is not currently available.`;
  }
  if (option.activityMode === 'passive' && input.allowPassive === false) {
    return 'Passive routes are disabled for this request.';
  }
  if (option.activityMode === 'background' && input.allowBackground === false) {
    return 'Background routes are disabled for this request.';
  }
  if (option.cityId && !input.unlockedCityIds.includes(option.cityId)) {
    return `${option.cityId} is not unlocked.`;
  }
  if (option.locality === 'one_prior_fallback' && option.cityId && option.cityId !== onePriorCityId) {
    return 'Route would require more than one backward city fallback.';
  }
  if (option.cityId && currentCityIndex !== null && optionCityIndex !== null && optionCityIndex < currentCityIndex - 1) {
    return 'Route would require traveling through multiple older cities.';
  }
  if (!cityHasModule(input.content, option.cityId, option.moduleKey)) {
    return `${option.moduleKey} is not exposed in the destination city.`;
  }

  if (option.sourceKind === 'apothecary_buy' && option.cityId) {
    const shop = getApothecaryShopByCityId(input.content, option.cityId);
    const stockEntry = shop?.stock.find((entry) => entry.itemId === input.targetId) ?? null;
    if (!stockEntry) return 'Item is not sold in the destination shop.';
    if (stockEntry.dailyLimit != null) {
      const stockIndex = shop?.stock.findIndex((entry) => entry === stockEntry) ?? -1;
      const stockKeys = [
        stockEntry.id,
        stockEntry.itemId,
        shop ? `${shop.id}:${stockEntry.itemId}` : null,
        stockIndex >= 0 ? `${stockEntry.itemId}_${stockIndex}` : null,
      ].filter((key): key is string => Boolean(key));
      const purchased = stockKeys.reduce((highest, stockKey) => Math.max(highest, input.purchasedTodayByStockId?.[stockKey] ?? 0), 0);
      const remaining = Math.max(0, stockEntry.dailyLimit - purchased);
      if ((input.shortageQty ?? 1) > remaining) {
        return `Shop cap only has ${remaining} remaining today.`;
      }
    }
  }

  return null;
}

function optionToRoute(input: MissingMaterialRouteResolverInput, option: BestSourceOption, index: number): MissingMaterialRouteOption {
  return {
    destinationModuleKey: option.moduleKey,
    destinationCityId: option.cityId,
    routeType: option.sourceKind,
    whyPrimary: option.reason,
    fallbackNote: index === 0 ? null : option.shortReason,
    blockedReason: resolveBlockedReason(input, option),
    activityMode: option.activityMode,
    locality: option.locality,
  };
}

export function resolveMissingMaterialRoutes(input: MissingMaterialRouteResolverInput): MissingMaterialRouteOption[] {
  const index = buildBestSourceIndex(input.content);
  const entry = getBestSourceIndexEntry(index, input.targetId);
  const routes = (entry?.sourceOptions ?? []).map((option, optionIndex) => optionToRoute(input, option, optionIndex));

  if (!input.problemKind) {
    return routes;
  }

  const policy = getProblemDestinationPolicy(input.problemKind);
  const policyRoutes = routes.filter((route, routeIndex) => {
    const primaryFamily = policy.primaryDestinations.includes(route.routeType);
    const secondaryFamily = policy.secondaryDestinations.includes(route.routeType);
    return routeIndex === 0 ? primaryFamily || secondaryFamily : primaryFamily || secondaryFamily;
  });

  if (policyRoutes.length > 0) {
    return policyRoutes;
  }

  return [
    ...policy.primaryModuleKeys.map((moduleKey) => ({
      destinationModuleKey: moduleKey,
      destinationCityId: input.currentCityId,
      routeType: (
        moduleKey === 'manualPavilion' ? 'manual_pavilion'
          : moduleKey === 'gateTrial' ? 'gate_trial'
            : moduleKey === 'bounties' ? 'bounties'
              : moduleKey === 'forge' ? 'forge'
                : moduleKey === 'ruins' ? 'ruins'
                  : moduleKey === 'outskirts' ? 'outskirts'
                    : moduleKey === 'expeditions' ? 'expeditions'
                      : 'apothecary_buy'
      ) as EconomicSourceKind,
      whyPrimary: `Problem policy for ${input.problemKind} routes here first.`,
      fallbackNote: null,
      blockedReason: resolveAvailableModules(input.content, input.currentCityId, input.availableModuleKeys).includes(moduleKey)
        ? null
        : `${moduleKey} is not currently available.`,
      activityMode: (moduleKey === 'expeditions' ? 'passive' : moduleKey === 'outskirts' || moduleKey === 'ruins' || moduleKey === 'gateTrial' ? 'active' : 'background') as 'active' | 'passive' | 'background',
      locality: 'city_local' as const,
    })),
  ];
}
