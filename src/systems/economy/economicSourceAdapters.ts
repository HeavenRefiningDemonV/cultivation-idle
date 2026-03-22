import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { ApothecaryShopDef, CityDef, LiveWorldModuleKey, OutskirtsDef, RuinDef, ValidatedContent } from '../../content/index.js';
import { getVisibleAlchemyRecipes, getVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import { getTargetedMaterialSinkMapEntry } from './targetedMaterialSinkMap.js';
import { listTargetedMaterialIds } from './targetedMaterialSinkAudit.js';
import {
  getCityRewardRoleProfile,
  getCommonFieldMaterialIds,
  getDeterministicRuinAnchorItemId,
  getOutskirtsRareSpikeItemIds,
  getTargetedCityMaterialIds,
  isCommonFieldMaterial,
  isDeterministicRuinAnchor,
  isOutskirtsRareSpike,
  isTargetedCityMaterial,
} from './activityRewardRoles.js';
import { getLiveExpeditionRoutePurpose } from '../world/expeditionRouteContract.js';
import { CITY_PACKAGE_REGISTRY_BY_ID } from '../world/cityPackageRegistry.js';

export interface ExpeditionItemSource {
  cityId: string;
  cityIndex: number;
  expeditionTypeId: string;
  moduleKey: LiveWorldModuleKey;
  qty: number;
  locality: 'city_local' | 'one_prior_fallback' | 'evergreen';
}

export interface ApothecaryStockSource {
  shop: ApothecaryShopDef;
  stockEntry: ApothecaryShopDef['stock'][number];
  city: CityDef | null;
}

export interface AlchemyOutputSource {
  recipe: ValidatedContent['alchemy_recipes'][number];
  outputQty: number;
  cityId: string | null;
  cityIndex: number | null;
}

export interface ForgeInputSource {
  blueprintId: string;
  cityId: string | null;
  cityIndex: number | null;
  service: string | undefined;
  qty: number;
}

const BUILD_CORRECTION_ITEM_IDS = ['mat_technique_fragment', 'crate_manual_scraps', 'frag_manual_mortal'] as const;
const SUPPORT_CURRENCY_IDS = ['gold', 'merit', 'spiritStones'] as const;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function getCityById(content: Pick<ValidatedContent, 'cities'>, cityId: string | null | undefined): CityDef | null {
  if (!cityId) return null;
  return content.cities.find((city) => city.id === cityId) ?? null;
}

export function getCityIndex(content: Pick<ValidatedContent, 'cities'>, cityId: string | null | undefined): number | null {
  return getCityById(content, cityId)?.index ?? null;
}

export function getPriorCityIds(content: Pick<ValidatedContent, 'cities'>, currentCityId: string | null | undefined): string[] {
  const currentCity = getCityById(content, currentCityId);
  if (!currentCity) return [];
  return content.cities
    .filter((city) => city.index < currentCity.index)
    .sort((left, right) => right.index - left.index)
    .map((city) => city.id);
}

export function getOnePriorCityId(content: Pick<ValidatedContent, 'cities'>, currentCityId: string | null | undefined): string | null {
  return getPriorCityIds(content, currentCityId)[0] ?? null;
}

export function getLiveCriticalBuildCorrectionItemIds(): string[] {
  return [...BUILD_CORRECTION_ITEM_IDS];
}

export function getSupportCurrencyIds(): string[] {
  return [...SUPPORT_CURRENCY_IDS];
}

export function getAllLiveCriticalTargetedMaterialIds(): string[] {
  return listTargetedMaterialIds();
}

export function getApothecaryShopByCityId(content: Pick<ValidatedContent, 'apothecary_shops'>, cityId: string | null | undefined) {
  if (!cityId) return null;
  return content.apothecary_shops.find((shop) => shop.cityId === cityId) ?? null;
}

export function findApothecaryStockSource(
  content: Pick<ValidatedContent, 'apothecary_shops' | 'cities'>,
  itemId: string,
  cityId: string | null | undefined,
): ApothecaryStockSource | null {
  if (!cityId) return null;
  const shop = getApothecaryShopByCityId(content, cityId);
  const stockEntry = shop?.stock.find((entry) => entry.itemId === itemId) ?? null;
  if (!shop || !stockEntry) return null;
  return { shop, stockEntry, city: getCityById(content, cityId) };
}

export function listVisibleAlchemyOutputsByItemId(
  content: Pick<ValidatedContent, 'alchemy_recipes' | 'cities' | 'items' | 'forge_blueprints'>,
  itemId: string,
): AlchemyOutputSource[] {
  return getVisibleAlchemyRecipes(content).flatMap((recipe) => {
    const outputQty = Number(recipe.outputs?.[itemId] ?? 0);
    if (outputQty <= 0) return [];
    const cityId = recipe.unlocksAtCityId ?? null;
    return [{
      recipe,
      outputQty,
      cityId,
      cityIndex: getCityIndex(content, cityId),
    }];
  });
}

export function listVisibleAlchemyInputsForOutput(
  content: Pick<ValidatedContent, 'alchemy_recipes' | 'cities' | 'items' | 'forge_blueprints'>,
  itemId: string,
): Array<{ recipeId: string; cityId: string | null; cityIndex: number | null; itemId: string; qty: number }> {
  return listVisibleAlchemyOutputsByItemId(content, itemId).flatMap(({ recipe, cityId, cityIndex }) =>
    Object.entries(recipe.inputs ?? {}).map(([inputItemId, qty]) => ({
      recipeId: recipe.id,
      cityId,
      cityIndex,
      itemId: inputItemId,
      qty: Number(qty ?? 0),
    })),
  );
}

export function listVisibleForgeInputsByItemId(
  content: Pick<ValidatedContent, 'forge_blueprints' | 'cities' | 'items' | 'alchemy_recipes'>,
  itemId: string,
): ForgeInputSource[] {
  return getVisibleForgeBlueprints(content)
    .map((blueprint) => {
      const normalized = normalizeForgeBlueprint(blueprint);
      const input = normalized.costs.items.find((entry) => entry.itemId === itemId) ?? null;
      if (!input) return null;
      return {
        blueprintId: blueprint.id,
        cityId: normalized.cityId ?? null,
        cityIndex: getCityIndex(content, normalized.cityId),
        service: normalized.service,
        qty: input.qty,
      };
    })
    .filter((entry): entry is ForgeInputSource => Boolean(entry));
}

function ruinPoolHasItem(ruin: RuinDef, itemId: string) {
  return ruin.dropsPerRoom.pool.some((entry) => entry.itemId === itemId)
    || ruin.finalChestDrops.pool.some((entry) => entry.itemId === itemId)
    || (ruin.finalChestDrops.guaranteed ?? []).some((entry) => entry.itemId === itemId);
}

function outskirtsPoolHasItem(outskirts: OutskirtsDef, itemId: string) {
  return Object.values(outskirts.matPools ?? {}).some((pool) => pool.includes(itemId));
}

export function findRuinSourceByItemId(
  content: Pick<ValidatedContent, 'ruins' | 'cities'>,
  itemId: string,
  cityId: string | null | undefined,
) {
  if (!cityId) return null;
  return content.ruins.find((ruin) => ruin.cityId === cityId && ruinPoolHasItem(ruin, itemId)) ?? null;
}

export function findOutskirtsSourceByItemId(
  content: Pick<ValidatedContent, 'outskirts' | 'cities'>,
  itemId: string,
  cityId: string | null | undefined,
) {
  if (!cityId) return null;
  return content.outskirts.find((zone) => zone.cityId === cityId && outskirtsPoolHasItem(zone, itemId)) ?? null;
}

export function listExpeditionItemSources(
  content: Pick<ValidatedContent, 'expeditions' | 'cities'>,
  itemId: string,
  currentCityId: string | null | undefined,
): ExpeditionItemSource[] {
  const currentCity = getCityById(content, currentCityId);
  const onePriorCityId = getOnePriorCityId(content, currentCityId);
  return content.expeditions.cityYields.flatMap((cityYield) =>
    Object.entries(cityYield.yieldsByTag ?? {}).flatMap(([yieldTag, yieldDef]) => {
      const item = (yieldDef?.items ?? []).find((entry) => entry.itemId === itemId);
      if (!item) return [];
      const city = content.cities.find((entry) => entry.index === cityYield.cityIndex) ?? null;
      const locality: ExpeditionItemSource['locality'] = !currentCity || !city
        ? 'evergreen'
        : city.id === currentCity.id
          ? 'city_local'
          : city.id === onePriorCityId
            ? 'one_prior_fallback'
            : 'evergreen';
      return [{
        cityId: city?.id ?? `city_index_${cityYield.cityIndex}`,
        cityIndex: cityYield.cityIndex,
        expeditionTypeId: yieldTag,
        moduleKey: getLiveExpeditionRoutePurpose(yieldTag)?.moduleKey ?? 'expeditions',
        qty: item.qty,
        locality,
      }];
    }),
  );
}

export function getCitySupportIdentity(cityId: string | null | undefined): string | null {
  if (!cityId) return null;
  return CITY_PACKAGE_REGISTRY_BY_ID[cityId]?.leadSupportIdentity ?? null;
}

export function classifyMaterialRoutingBand(cityId: string, itemId: string): 'targeted_local' | 'common_field' | 'anchor' | 'support' | 'other' {
  if (isDeterministicRuinAnchor(cityId, itemId)) return 'anchor';
  if (isTargetedCityMaterial(cityId, itemId)) return 'targeted_local';
  if (isCommonFieldMaterial(cityId, itemId)) return 'common_field';
  if (isOutskirtsRareSpike(cityId, itemId)) return 'support';
  return 'other';
}

export function getCityTargetedMaterialIds(cityId: string): string[] {
  return getTargetedCityMaterialIds(cityId);
}

export function getCityCommonMaterialIds(cityId: string): string[] {
  return getCommonFieldMaterialIds(cityId);
}

export function getCityOutskirtsRareSpikeIds(cityId: string): string[] {
  return getOutskirtsRareSpikeItemIds(cityId);
}

export function getDeterministicAnchorItemId(cityId: string): string {
  return getDeterministicRuinAnchorItemId(cityId);
}

export function getTargetedMaterialOwningCityId(itemId: string): string | null {
  const targetedOwner = listTargetedMaterialIds().find((candidate: string) => candidate === itemId);
  if (targetedOwner) {
    return getTargetedMaterialSinkMapEntry(targetedOwner as ReturnType<typeof listTargetedMaterialIds>[number]).cityId;
  }
  for (const cityId of Object.keys(CITY_PACKAGE_REGISTRY_BY_ID)) {
    if (getTargetedCityMaterialIds(cityId).includes(itemId)) return cityId;
  }
  return null;
}

export function listVisibleAlchemyInputItemIds(content: Pick<ValidatedContent, 'alchemy_recipes' | 'cities' | 'items' | 'forge_blueprints'>): string[] {
  return unique(getVisibleAlchemyRecipes(content).flatMap((recipe) => Object.keys(recipe.inputs ?? {})));
}

export function listVisibleAlchemyOutputItemIds(content: Pick<ValidatedContent, 'alchemy_recipes' | 'cities' | 'items' | 'forge_blueprints'>): string[] {
  return unique(getVisibleAlchemyRecipes(content).flatMap((recipe) => Object.keys(recipe.outputs ?? {})));
}

export function listVisibleForgeInputItemIds(
  content: Pick<ValidatedContent, 'forge_blueprints' | 'cities' | 'items' | 'alchemy_recipes'>,
): string[] {
  return unique(
    getVisibleForgeBlueprints(content).flatMap((blueprint) => normalizeForgeBlueprint(blueprint).costs.items.map((entry) => entry.itemId)),
  );
}

export function getItemName(content: Pick<ValidatedContent, 'items'>, itemId: string): string {
  return content.items.find((item) => item.id === itemId)?.name ?? itemId;
}

export function isBuildCorrectionItem(itemId: string): boolean {
  return BUILD_CORRECTION_ITEM_IDS.includes(itemId as (typeof BUILD_CORRECTION_ITEM_IDS)[number]);
}

export function isSupportCurrencyId(itemId: string): boolean {
  return SUPPORT_CURRENCY_IDS.includes(itemId as (typeof SUPPORT_CURRENCY_IDS)[number]);
}

export function getCityRewardRoleSummary(cityId: string) {
  const profile = getCityRewardRoleProfile(cityId);
  return {
    cityId: profile.cityId,
    cityIndex: profile.cityIndex,
    commonFieldMaterialIds: [...profile.commonFieldMaterialIds],
    targetedMaterialIds: [...profile.targetedMaterialIds],
    deterministicAnchorItemId: profile.deterministicAnchorItemId,
    supportItemIds: [...profile.supportItemIds],
  };
}
