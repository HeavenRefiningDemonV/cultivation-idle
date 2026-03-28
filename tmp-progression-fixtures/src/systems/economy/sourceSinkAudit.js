import { normalizeForgeBlueprint } from '../../content/forge.js';
import { getKnownLiveEconomyBlocker, listKnownLiveEconomyBlockers } from './knownLiveEconomyBlockers.js';
import { buildLiveEconomyCatalog, getVisibleAlchemyRecipes, getVisibleForgeBlueprints } from './liveEconomyCatalog.js';
import { getLiveEconomyItemFamily } from './liveEconomyVisibility.js';
const TECHNIQUE_REROLL_SINK_ITEM_ID = 'reagent_soul_ink_t0';
export const PACKET_3_6A_NAMED_MATERIAL_SINK_IDS = ['mat_spirit_dew', 'mat_artifact_shard'];
export const PACKET_3_6A_REAGENT_PATH_BLUEPRINT_ID = 'forge_refine_legendary_t5';
export const PACKET_3_6A_REAGENT_RECIPE_ID = 'alc_reagent_quenching_oil_t2';
export const PACKET_3_6A_REAGENT_ITEM_ID = 'reagent_quenching_oil_t2';
function pushRoute(map, route) {
    const list = map.get(route.itemId) ?? [];
    list.push(route);
    map.set(route.itemId, list);
}
function collectOutskirtsSources(outskirts, map) {
    outskirts.forEach((zone) => {
        const common = zone.matPools?.common ?? [];
        const rare = zone.matPools?.rare ?? [];
        [...common, ...rare].forEach((itemId) => pushRoute(map, { kind: 'outskirts', refId: zone.id, itemId }));
    });
}
function collectRuinSources(ruins, map) {
    ruins.forEach((ruin) => {
        ruin.dropsPerRoom.pool.forEach((entry) => pushRoute(map, { kind: 'ruins_room', refId: ruin.id, itemId: entry.itemId }));
        ruin.finalChestDrops.pool.forEach((entry) => pushRoute(map, { kind: 'ruins_chest', refId: ruin.id, itemId: entry.itemId }));
        (ruin.finalChestDrops.guaranteed ?? []).forEach((entry) => pushRoute(map, { kind: 'ruins_chest', refId: ruin.id, itemId: entry.itemId, detail: 'guaranteed' }));
    });
}
function collectExpeditionSources(cityYields, map) {
    cityYields.forEach((cityYield) => {
        Object.entries(cityYield.yieldsByTag ?? {}).forEach(([tag, yieldDef]) => {
            (yieldDef?.items ?? []).forEach((entry) => pushRoute(map, { kind: 'expedition', refId: `city_${cityYield.cityIndex}:${tag}`, itemId: entry.itemId }));
        });
    });
}
function collectCraftRelevantItemIds(content) {
    const ids = new Set();
    content.alchemy_recipes.forEach((recipe) => {
        Object.keys(recipe.inputs ?? {}).forEach((itemId) => ids.add(itemId));
        Object.keys(recipe.outputs ?? {}).forEach((itemId) => ids.add(itemId));
    });
    content.forge_blueprints.forEach((blueprint) => {
        Object.keys(blueprint.inputs ?? {}).forEach((itemId) => ids.add(itemId));
        Object.keys(blueprint.outputs ?? {}).forEach((itemId) => ids.add(itemId));
        Object.keys(blueprint.cost ?? {}).forEach((itemId) => {
            if (!['gold', 'spiritStones', 'merit'].includes(itemId))
                ids.add(itemId);
        });
    });
    return [...ids].sort();
}
function collectApothecarySources(shops, map) {
    shops.forEach((shop) => {
        shop.stock.forEach((entry) => pushRoute(map, { kind: 'apothecary_shop', refId: shop.id, itemId: entry.itemId }));
    });
}
export function buildLiveEconomyAuditReport(content) {
    const catalog = buildLiveEconomyCatalog(content);
    const craftRelevantItemIds = collectCraftRelevantItemIds(content);
    const visibleAlchemyRecipes = getVisibleAlchemyRecipes(content);
    const visibleForgeBlueprints = getVisibleForgeBlueprints(content);
    const sourceMap = new Map();
    const sinkMap = new Map();
    collectOutskirtsSources(content.outskirts, sourceMap);
    collectRuinSources(content.ruins, sourceMap);
    collectExpeditionSources(content.expeditions.cityYields, sourceMap);
    collectApothecarySources(content.apothecary_shops, sourceMap);
    visibleAlchemyRecipes.forEach((recipe) => {
        Object.keys(recipe.outputs ?? {}).forEach((itemId) => pushRoute(sourceMap, { kind: 'alchemy_output', refId: recipe.id, itemId }));
        Object.keys(recipe.inputs ?? {}).forEach((itemId) => pushRoute(sinkMap, { kind: 'alchemy_input', refId: recipe.id, itemId }));
    });
    pushRoute(sinkMap, { kind: 'technique_reroll', refId: 'technique_reroll', itemId: TECHNIQUE_REROLL_SINK_ITEM_ID });
    visibleForgeBlueprints.forEach((blueprint) => {
        const normalized = normalizeForgeBlueprint(blueprint);
        if (normalized.output?.itemId) {
            pushRoute(sourceMap, { kind: 'forge_output', refId: blueprint.id, itemId: normalized.output.itemId });
        }
        normalized.costs.items.forEach((cost) => pushRoute(sinkMap, { kind: 'forge_input', refId: blueprint.id, itemId: cost.itemId }));
    });
    const trackedItemIds = new Set();
    content.items.forEach((item) => {
        const status = catalog.itemStatusById[item.id] ?? 'unknown';
        if (status === 'visible_live' || status === 'visible_live_blocked')
            trackedItemIds.add(item.id);
    });
    sourceMap.forEach((_, itemId) => trackedItemIds.add(itemId));
    sinkMap.forEach((_, itemId) => trackedItemIds.add(itemId));
    const itemAudits = [...trackedItemIds]
        .map((itemId) => {
        const item = content.items.find((entry) => entry.id === itemId);
        const blocker = getKnownLiveEconomyBlocker(itemId);
        const runtimeStatus = catalog.itemStatusById[itemId] ?? 'unknown';
        return {
            itemId,
            runtimeStatus,
            family: item ? getLiveEconomyItemFamily(item) : 'other',
            liveSources: sourceMap.get(itemId) ?? [],
            liveSinks: sinkMap.get(itemId) ?? [],
            isBlocked: Boolean(blocker),
            blockerReason: blocker?.reason,
        };
    })
        .sort((a, b) => a.itemId.localeCompare(b.itemId));
    const reagentPathAudits = visibleForgeBlueprints
        .filter((blueprint) => blueprint.service === 'refine')
        .map((blueprint) => {
        const missingDependencyIds = Object.keys(blueprint.inputs ?? {}).filter((itemId) => {
            const item = content.items.find((entry) => entry.id === itemId);
            if (!item || item.category !== 'reagent')
                return false;
            const sourceCount = (sourceMap.get(itemId) ?? []).length;
            return sourceCount === 0;
        });
        const blocker = getKnownLiveEconomyBlocker(blueprint.id);
        return {
            blueprintId: blueprint.id,
            runtimeStatus: catalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown',
            missingDependencyIds,
            isBlocked: Boolean(blocker),
            blockerReason: blocker?.reason,
        };
    })
        .filter((entry) => entry.missingDependencyIds.length > 0 || entry.isBlocked)
        .sort((a, b) => a.blueprintId.localeCompare(b.blueprintId));
    const activeBlockerIds = listKnownLiveEconomyBlockers().map((entry) => entry.id).sort();
    return { catalog, itemAudits, reagentPathAudits, activeBlockerIds, craftRelevantItemIds };
}
export function getSinklessLiveMaterials(report) {
    return report.itemAudits.filter((entry) => {
        if (!['material', 'reagent'].includes(entry.family))
            return false;
        if (entry.runtimeStatus !== 'visible_live' && entry.runtimeStatus !== 'visible_live_blocked')
            return false;
        if (!report.craftRelevantItemIds.includes(entry.itemId))
            return false;
        return entry.liveSinks.length === 0;
    });
}
export function getLiveEconomyItemAuditById(report, itemId) {
    return report.itemAudits.find((entry) => entry.itemId === itemId);
}
export function getLiveReagentPathAuditByBlueprintId(report, blueprintId) {
    return report.reagentPathAudits.find((entry) => entry.blueprintId === blueprintId);
}
export function getVisibleLiveSourcesForItem(report, itemId) {
    return getLiveEconomyItemAuditById(report, itemId)?.liveSources ?? [];
}
export function getVisibleLiveSinksForItem(report, itemId) {
    return getLiveEconomyItemAuditById(report, itemId)?.liveSinks ?? [];
}
export function hasVisibleLiveSink(report, itemId) {
    return getVisibleLiveSinksForItem(report, itemId).length > 0;
}
export function hasVisibleLiveSource(report, itemId) {
    return getVisibleLiveSourcesForItem(report, itemId).length > 0;
}
export function hasVisibleLiveReagentPath(report, blueprintId, reagentItemId) {
    const audit = getLiveReagentPathAuditByBlueprintId(report, blueprintId);
    if (audit?.missingDependencyIds.length) {
        if (!reagentItemId)
            return false;
        return !audit.missingDependencyIds.includes(reagentItemId);
    }
    if (!reagentItemId)
        return true;
    return hasVisibleLiveSource(report, reagentItemId);
}
export function getPacket36AMaterialSinkStatus(report) {
    return Object.fromEntries(PACKET_3_6A_NAMED_MATERIAL_SINK_IDS.map((itemId) => [
        itemId,
        {
            itemId,
            hasVisibleLiveSink: hasVisibleLiveSink(report, itemId),
            sinkIds: getVisibleLiveSinksForItem(report, itemId).map((entry) => entry.refId).sort(),
        },
    ]));
}
