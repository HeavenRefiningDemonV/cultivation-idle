import { normalizeForgeBlueprint } from '../../content/forge.js';
import { getLiveForgeFamily, getLiveForgeRuntimeStatus, isCanonicalLiveForgeBlueprintId, LIVE_FORGE_BLUEPRINT_IDS, } from './forgeBlueprintFamilies.js';
function familyLabel(family) {
    if (family === 'refine')
        return 'Refine';
    if (family === 'temper')
        return 'Temper';
    if (family === 'runes')
        return 'Runes';
    return 'Hidden';
}
export function buildLiveForgeCatalog(content) {
    const cityIndexById = Object.fromEntries((content.cities ?? []).map((city) => [city.id, city.index]));
    const entriesById = Object.fromEntries(content.forge_blueprints.map((blueprint) => {
        const normalized = normalizeForgeBlueprint(blueprint);
        const cityId = normalized.cityId ?? null;
        const family = getLiveForgeFamily(blueprint);
        const entry = {
            blueprintId: blueprint.id,
            cityId,
            cityIndex: cityId ? cityIndexById[cityId] ?? null : null,
            status: getLiveForgeRuntimeStatus(blueprint),
            family,
            familyLabel: familyLabel(family),
            canonicalSemesterLadder: isCanonicalLiveForgeBlueprintId(blueprint.id),
            blueprint,
            normalized,
        };
        return [blueprint.id, entry];
    }));
    const visibleBlueprintIds = LIVE_FORGE_BLUEPRINT_IDS.filter((id) => entriesById[id]?.status === 'visible_live');
    const hiddenBlueprintIds = Object.values(entriesById)
        .filter((entry) => entry.status !== 'visible_live')
        .map((entry) => entry.blueprintId)
        .sort();
    return {
        entriesById,
        visibleBlueprintIds,
        hiddenBlueprintIds,
        visibleFamilies: ['Refine', 'Temper', 'Runes'],
    };
}
export function getVisibleLiveForgeBlueprints(content) {
    const catalog = buildLiveForgeCatalog(content);
    return catalog.visibleBlueprintIds
        .map((id) => catalog.entriesById[id]?.blueprint)
        .filter((entry) => Boolean(entry));
}
export function getVisibleNormalizedLiveForgeBlueprints(content) {
    return getVisibleLiveForgeBlueprints(content).map((blueprint) => normalizeForgeBlueprint(blueprint));
}
export function getVisibleLiveForgeBlueprintsForCity(content, cityId) {
    if (!cityId)
        return getVisibleLiveForgeBlueprints(content);
    return getVisibleLiveForgeBlueprints(content).filter((blueprint) => normalizeForgeBlueprint(blueprint).cityId === cityId);
}
export function getLiveForgeBlueprintById(content, blueprintId) {
    if (!content)
        return undefined;
    const entry = buildLiveForgeCatalog(content).entriesById[blueprintId];
    return entry?.status === 'visible_live' ? entry.blueprint : undefined;
}
