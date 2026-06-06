import { normalizeForgeBlueprint } from '../../content/forge.js';
import { buildLiveForgeCatalog } from '../forge/liveForgeCatalog.js';
import { buildLiveEconomyCatalog, getVisibleAlchemyRecipes } from './liveEconomyCatalog.js';
import { buildLiveEconomyAuditReport, getVisibleLiveSinksForItem } from './sourceSinkAudit.js';
import { TARGETED_MATERIAL_IDS, getTargetedMaterialSinkMapEntry, listTargetedMaterialSinkMap, } from './targetedMaterialSinkMap.js';
function buildVisibleOutputDuplicateCount(content) {
    const counts = new Map();
    const forgeCatalog = buildLiveForgeCatalog(content);
    Object.values(forgeCatalog.entriesById).forEach((entry) => {
        if (entry.status !== 'visible_live')
            return;
        Object.keys(entry.blueprint.outputs ?? {}).forEach((itemId) => {
            counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
        });
    });
    getVisibleAlchemyRecipes(content).forEach((recipe) => {
        Object.keys(recipe.outputs ?? {}).forEach((itemId) => {
            counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
        });
    });
    return counts;
}
function deriveForgeDomain(blueprint) {
    const normalized = normalizeForgeBlueprint(blueprint);
    if (normalized.type === 'service' && normalized.service === 'refine')
        return 'Forge Refine';
    if (normalized.type === 'service' && normalized.service === 'temper')
        return 'Forge Temper';
    if (normalized.output?.itemId?.startsWith('rune_'))
        return 'Forge Rune';
    return 'Other Live Conversion';
}
function toSinkDetail(content, route, duplicateOutputCounts) {
    if (route.kind === 'alchemy_input') {
        const recipe = content.alchemy_recipes.find((entry) => entry.id === route.refId);
        if (!recipe)
            return null;
        const outputItemIds = Object.keys(recipe.outputs ?? {});
        return {
            sinkId: route.refId,
            routeKind: route.kind,
            domain: 'Apothecary Brew',
            unlockCityId: recipe.unlocksAtCityId ?? null,
            unlockCityIndex: content.cities.find((city) => city.id === recipe.unlocksAtCityId)?.index ?? null,
            outputItemIds,
            blockedByVisibility: false,
            duplicateNoisy: outputItemIds.length > 0 && outputItemIds.every((itemId) => (duplicateOutputCounts.get(itemId) ?? 0) > 1),
        };
    }
    if (route.kind === 'forge_input') {
        const blueprint = content.forge_blueprints.find((entry) => entry.id === route.refId);
        if (!blueprint)
            return null;
        const outputItemIds = Object.keys(blueprint.outputs ?? {});
        return {
            sinkId: route.refId,
            routeKind: route.kind,
            domain: deriveForgeDomain(blueprint),
            unlockCityId: blueprint.unlocksAtCityId ?? null,
            unlockCityIndex: content.cities.find((city) => city.id === blueprint.unlocksAtCityId)?.index ?? null,
            outputItemIds,
            blockedByVisibility: false,
            duplicateNoisy: outputItemIds.length > 0 && outputItemIds.every((itemId) => (duplicateOutputCounts.get(itemId) ?? 0) > 1),
        };
    }
    return null;
}
function listHiddenOrDeferredSinkIds(content, materialId, liveSinkIds) {
    const liveCatalog = buildLiveEconomyCatalog(content);
    const hiddenAlchemy = content.alchemy_recipes
        .filter((recipe) => !liveSinkIds.has(recipe.id) && (recipe.inputs?.[materialId] ?? 0) > 0)
        .filter((recipe) => (liveCatalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown') !== 'visible_live')
        .map((recipe) => recipe.id);
    const hiddenForge = content.forge_blueprints
        .filter((blueprint) => !liveSinkIds.has(blueprint.id) && (blueprint.inputs?.[materialId] ?? 0) > 0)
        .filter((blueprint) => (liveCatalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown') !== 'visible_live')
        .map((blueprint) => blueprint.id);
    return [...hiddenAlchemy, ...hiddenForge].sort();
}
export function buildTargetedMaterialSinkAudit(content) {
    const auditReport = buildLiveEconomyAuditReport(content);
    const economyCatalog = buildLiveEconomyCatalog(content);
    const duplicateOutputCounts = buildVisibleOutputDuplicateCount(content);
    const entries = TARGETED_MATERIAL_IDS.map((materialId) => {
        const mapEntry = getTargetedMaterialSinkMapEntry(materialId);
        const liveSinks = getVisibleLiveSinksForItem(auditReport, materialId)
            .map((route) => toSinkDetail(content, route, duplicateOutputCounts))
            .filter((entry) => Boolean(entry));
        const primarySinks = liveSinks.filter((entry) => mapEntry.primarySinkIds.includes(entry.sinkId));
        const secondarySinks = liveSinks.filter((entry) => mapEntry.secondarySinkIds.includes(entry.sinkId));
        const otherVisibleLiveSinks = liveSinks.filter((entry) => !mapEntry.primarySinkIds.includes(entry.sinkId) && !mapEntry.secondarySinkIds.includes(entry.sinkId));
        const allVisibleSinkIds = new Set(liveSinks.map((entry) => entry.sinkId));
        const hiddenOrDeferredSinkIds = listHiddenOrDeferredSinkIds(content, materialId, allVisibleSinkIds);
        const viableVisibleSinks = liveSinks.filter((entry) => !entry.duplicateNoisy && !entry.blockedByVisibility);
        const materialStatus = economyCatalog.itemStatusById[materialId] === 'visible_live'
            ? 'visible_live'
            : economyCatalog.itemStatusById[materialId] === 'hidden_deferred' || economyCatalog.itemStatusById[materialId] === 'migration_refund_only'
                ? 'hidden_or_deferred'
                : 'unknown';
        const riskNotes = [];
        if (viableVisibleSinks.length === 1)
            riskNotes.push('single visible-live sink');
        if (primarySinks.length === 0 && viableVisibleSinks.length > 0)
            riskNotes.push('supported only by secondary/equivalent sink paths');
        if (hiddenOrDeferredSinkIds.length > 0)
            riskNotes.push(`raw hidden/deferred sink refs remain: ${hiddenOrDeferredSinkIds.join(', ')}`);
        return {
            materialId,
            cityId: mapEntry.cityId,
            materialStatus,
            hasVisibleLiveSink: viableVisibleSinks.length > 0,
            primarySinks,
            secondarySinks,
            otherVisibleLiveSinks,
            hiddenOrDeferredSinkIds,
            onlyHiddenOrDeferred: viableVisibleSinks.length === 0 && hiddenOrDeferredSinkIds.length > 0,
            onlyDuplicateNoisy: liveSinks.length > 0 && viableVisibleSinks.length === 0 && liveSinks.every((entry) => entry.duplicateNoisy),
            riskNotes,
        };
    });
    const entriesById = Object.fromEntries(entries.map((entry) => [entry.materialId, entry]));
    const unresolvedMaterialIds = entries
        .filter((entry) => !entry.hasVisibleLiveSink || entry.onlyHiddenOrDeferred || entry.onlyDuplicateNoisy)
        .map((entry) => entry.materialId);
    return { entries, entriesById, unresolvedMaterialIds };
}
export function getTargetedMaterialSinkAuditEntry(audit, materialId) {
    return audit.entriesById[materialId];
}
export function listUnresolvedTargetedMaterials(audit) {
    return audit.unresolvedMaterialIds.map((materialId) => audit.entriesById[materialId]);
}
export function listTargetedMaterialIds() {
    return [...TARGETED_MATERIAL_IDS];
}
export function listTargetedMaterialSinkEntries() {
    return listTargetedMaterialSinkMap();
}
