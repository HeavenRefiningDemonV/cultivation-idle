import { getAlchemyRecipeRuntimeStatus, getForgeBlueprintRuntimeStatus, getItemRuntimeStatus } from './liveEconomyVisibility.js';
import { getVisibleLiveForgeBlueprints, getVisibleNormalizedLiveForgeBlueprints, getLiveForgeBlueprintById as getLiveForgeBlueprintByIdFromCatalog } from '../forge/index.js';
const isLiveFacingStatus = (status) => status === 'visible_live' || status === 'visible_live_blocked';
export function buildLiveEconomyCatalog(content) {
    const itemStatusById = Object.fromEntries(content.items.map((item) => [item.id, getItemRuntimeStatus(item)]));
    const alchemyRecipeStatusById = Object.fromEntries(content.alchemy_recipes.map((recipe) => [recipe.id, getAlchemyRecipeRuntimeStatus(recipe)]));
    const forgeBlueprintStatusById = Object.fromEntries(content.forge_blueprints.map((blueprint) => [blueprint.id, getForgeBlueprintRuntimeStatus(blueprint, content)]));
    const visibleItemIds = Object.entries(itemStatusById)
        .filter(([, status]) => isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    const hiddenItemIds = Object.entries(itemStatusById)
        .filter(([, status]) => !isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    const visibleAlchemyRecipeIds = Object.entries(alchemyRecipeStatusById)
        .filter(([, status]) => isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    const hiddenAlchemyRecipeIds = Object.entries(alchemyRecipeStatusById)
        .filter(([, status]) => !isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    const visibleForgeBlueprintIds = Object.entries(forgeBlueprintStatusById)
        .filter(([, status]) => isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    const hiddenForgeBlueprintIds = Object.entries(forgeBlueprintStatusById)
        .filter(([, status]) => !isLiveFacingStatus(status))
        .map(([id]) => id)
        .sort();
    return {
        itemStatusById,
        alchemyRecipeStatusById,
        forgeBlueprintStatusById,
        visibleItemIds,
        hiddenItemIds,
        visibleAlchemyRecipeIds,
        hiddenAlchemyRecipeIds,
        visibleForgeBlueprintIds,
        hiddenForgeBlueprintIds,
    };
}
export function getVisibleAlchemyRecipes(content) {
    const catalog = buildLiveEconomyCatalog(content);
    return content.alchemy_recipes.filter((recipe) => isLiveFacingStatus(catalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown'));
}
export function getVisibleForgeBlueprints(content) {
    return getVisibleLiveForgeBlueprints(content);
}
export function getVisibleNormalizedForgeBlueprints(content) {
    return getVisibleNormalizedLiveForgeBlueprints(content);
}
export function getRawAlchemyRecipeById(content, recipeId) {
    return content?.alchemy_recipes.find((recipe) => recipe.id === recipeId);
}
export function getLiveAlchemyRecipeById(content, recipeId) {
    if (!content)
        return undefined;
    return getVisibleAlchemyRecipes(content).find((recipe) => recipe.id === recipeId);
}
export function getRawForgeBlueprintById(content, blueprintId) {
    return content?.forge_blueprints.find((blueprint) => blueprint.id === blueprintId);
}
export function getLiveForgeBlueprintById(content, blueprintId) {
    return getLiveForgeBlueprintByIdFromCatalog(content, blueprintId);
}
