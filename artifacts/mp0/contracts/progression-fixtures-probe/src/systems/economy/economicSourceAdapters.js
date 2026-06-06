import { normalizeForgeBlueprint } from '../../content/forge.js';
import { getVisibleAlchemyRecipes, getVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import { getTargetedMaterialSinkMapEntry } from './targetedMaterialSinkMap.js';
import { listTargetedMaterialIds } from './targetedMaterialSinkAudit.js';
import { getCityRewardRoleProfile, getCommonFieldMaterialIds, getDeterministicRuinAnchorItemId, getOutskirtsRareSpikeItemIds, getTargetedCityMaterialIds, isCommonFieldMaterial, isDeterministicRuinAnchor, isOutskirtsRareSpike, isTargetedCityMaterial, } from './activityRewardRoles.js';
import { getLiveExpeditionRoutePurpose } from '../world/expeditionRouteContract.js';
import { CITY_PACKAGE_REGISTRY_BY_ID } from '../world/cityPackageRegistry.js';
const BUILD_CORRECTION_ITEM_IDS = ['mat_technique_fragment', 'crate_manual_scraps', 'frag_manual_mortal'];
const SUPPORT_CURRENCY_IDS = ['gold', 'merit', 'spiritStones'];
function unique(values) {
    return [...new Set(values)];
}
export function getCityById(content, cityId) {
    if (!cityId)
        return null;
    return content.cities.find((city) => city.id === cityId) ?? null;
}
export function getCityIndex(content, cityId) {
    return getCityById(content, cityId)?.index ?? null;
}
export function getPriorCityIds(content, currentCityId) {
    const currentCity = getCityById(content, currentCityId);
    if (!currentCity)
        return [];
    return content.cities
        .filter((city) => city.index < currentCity.index)
        .sort((left, right) => right.index - left.index)
        .map((city) => city.id);
}
export function getOnePriorCityId(content, currentCityId) {
    return getPriorCityIds(content, currentCityId)[0] ?? null;
}
export function getLiveCriticalBuildCorrectionItemIds() {
    return [...BUILD_CORRECTION_ITEM_IDS];
}
export function getSupportCurrencyIds() {
    return [...SUPPORT_CURRENCY_IDS];
}
export function getAllLiveCriticalTargetedMaterialIds() {
    return listTargetedMaterialIds();
}
export function getApothecaryShopByCityId(content, cityId) {
    if (!cityId)
        return null;
    return content.apothecary_shops.find((shop) => shop.cityId === cityId) ?? null;
}
export function findApothecaryStockSource(content, itemId, cityId) {
    if (!cityId)
        return null;
    const shop = getApothecaryShopByCityId(content, cityId);
    const stockEntry = shop?.stock.find((entry) => entry.itemId === itemId) ?? null;
    if (!shop || !stockEntry)
        return null;
    return { shop, stockEntry, city: getCityById(content, cityId) };
}
export function listVisibleAlchemyOutputsByItemId(content, itemId) {
    return getVisibleAlchemyRecipes(content).flatMap((recipe) => {
        const outputQty = Number(recipe.outputs?.[itemId] ?? 0);
        if (outputQty <= 0)
            return [];
        const cityId = recipe.unlocksAtCityId ?? null;
        return [{
                recipe,
                outputQty,
                cityId,
                cityIndex: getCityIndex(content, cityId),
            }];
    });
}
export function listVisibleAlchemyInputsForOutput(content, itemId) {
    return listVisibleAlchemyOutputsByItemId(content, itemId).flatMap(({ recipe, cityId, cityIndex }) => Object.entries(recipe.inputs ?? {}).map(([inputItemId, qty]) => ({
        recipeId: recipe.id,
        cityId,
        cityIndex,
        itemId: inputItemId,
        qty: Number(qty ?? 0),
    })));
}
export function listVisibleForgeInputsByItemId(content, itemId) {
    return getVisibleForgeBlueprints(content)
        .map((blueprint) => {
        const normalized = normalizeForgeBlueprint(blueprint);
        const input = normalized.costs.items.find((entry) => entry.itemId === itemId) ?? null;
        if (!input)
            return null;
        return {
            blueprintId: blueprint.id,
            cityId: normalized.cityId ?? null,
            cityIndex: getCityIndex(content, normalized.cityId),
            service: normalized.service,
            qty: input.qty,
        };
    })
        .filter((entry) => Boolean(entry));
}
function ruinPoolHasItem(ruin, itemId) {
    return ruin.dropsPerRoom.pool.some((entry) => entry.itemId === itemId)
        || ruin.finalChestDrops.pool.some((entry) => entry.itemId === itemId)
        || (ruin.finalChestDrops.guaranteed ?? []).some((entry) => entry.itemId === itemId);
}
function outskirtsPoolHasItem(outskirts, itemId) {
    return Object.values(outskirts.matPools ?? {}).some((pool) => pool.includes(itemId));
}
export function findRuinSourceByItemId(content, itemId, cityId) {
    if (!cityId)
        return null;
    return content.ruins.find((ruin) => ruin.cityId === cityId && ruinPoolHasItem(ruin, itemId)) ?? null;
}
export function findOutskirtsSourceByItemId(content, itemId, cityId) {
    if (!cityId)
        return null;
    return content.outskirts.find((zone) => zone.cityId === cityId && outskirtsPoolHasItem(zone, itemId)) ?? null;
}
export function listExpeditionItemSources(content, itemId, currentCityId) {
    const currentCity = getCityById(content, currentCityId);
    const onePriorCityId = getOnePriorCityId(content, currentCityId);
    return content.expeditions.cityYields.flatMap((cityYield) => Object.entries(cityYield.yieldsByTag ?? {}).flatMap(([yieldTag, yieldDef]) => {
        const item = (yieldDef?.items ?? []).find((entry) => entry.itemId === itemId);
        if (!item)
            return [];
        const city = content.cities.find((entry) => entry.index === cityYield.cityIndex) ?? null;
        const locality = !currentCity || !city
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
    }));
}
export function getCitySupportIdentity(cityId) {
    if (!cityId)
        return null;
    return CITY_PACKAGE_REGISTRY_BY_ID[cityId]?.leadSupportIdentity ?? null;
}
export function classifyMaterialRoutingBand(cityId, itemId) {
    if (isDeterministicRuinAnchor(cityId, itemId))
        return 'anchor';
    if (isTargetedCityMaterial(cityId, itemId))
        return 'targeted_local';
    if (isCommonFieldMaterial(cityId, itemId))
        return 'common_field';
    if (isOutskirtsRareSpike(cityId, itemId))
        return 'support';
    return 'other';
}
export function getCityTargetedMaterialIds(cityId) {
    return getTargetedCityMaterialIds(cityId);
}
export function getCityCommonMaterialIds(cityId) {
    return getCommonFieldMaterialIds(cityId);
}
export function getCityOutskirtsRareSpikeIds(cityId) {
    return getOutskirtsRareSpikeItemIds(cityId);
}
export function getDeterministicAnchorItemId(cityId) {
    return getDeterministicRuinAnchorItemId(cityId);
}
export function getTargetedMaterialOwningCityId(itemId) {
    const targetedOwner = listTargetedMaterialIds().find((candidate) => candidate === itemId);
    if (targetedOwner) {
        return getTargetedMaterialSinkMapEntry(targetedOwner).cityId;
    }
    for (const cityId of Object.keys(CITY_PACKAGE_REGISTRY_BY_ID)) {
        if (getTargetedCityMaterialIds(cityId).includes(itemId))
            return cityId;
    }
    return null;
}
export function listVisibleAlchemyInputItemIds(content) {
    return unique(getVisibleAlchemyRecipes(content).flatMap((recipe) => Object.keys(recipe.inputs ?? {})));
}
export function listVisibleAlchemyOutputItemIds(content) {
    return unique(getVisibleAlchemyRecipes(content).flatMap((recipe) => Object.keys(recipe.outputs ?? {})));
}
export function listVisibleForgeInputItemIds(content) {
    return unique(getVisibleForgeBlueprints(content).flatMap((blueprint) => normalizeForgeBlueprint(blueprint).costs.items.map((entry) => entry.itemId)));
}
export function getItemName(content, itemId) {
    return content.items.find((item) => item.id === itemId)?.name ?? itemId;
}
export function isBuildCorrectionItem(itemId) {
    return BUILD_CORRECTION_ITEM_IDS.includes(itemId);
}
export function isSupportCurrencyId(itemId) {
    return SUPPORT_CURRENCY_IDS.includes(itemId);
}
export function getCityRewardRoleSummary(cityId) {
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
