import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { LiveEconomyCatalog, LiveEconomyContentSnapshot, NormalizedForgeBlueprintWithStatus } from './liveEconomyTypes.js';
import {
  getLiveAlchemyRecipeVisibility,
  getLiveEconomyItemVisibility,
  getLiveForgeBlueprintVisibility,
} from './liveEconomyVisibility.js';

export function createLiveEconomyCatalog(content: LiveEconomyContentSnapshot): LiveEconomyCatalog {
  const itemStatuses = Object.fromEntries(content.items.map((item) => [item.id, getLiveEconomyItemVisibility(item.id).status]));
  const alchemyRecipeStatuses = Object.fromEntries(content.alchemy_recipes.map((recipe) => [recipe.id, getLiveAlchemyRecipeVisibility(recipe).status]));
  const forgeBlueprintStatuses = Object.fromEntries(
    content.forge_blueprints.map((blueprint) => [blueprint.id, getLiveForgeBlueprintVisibility(blueprint, content).status]),
  );

  const isVisibleStatus = (status: string) => status === 'visible_live' || status === 'visible_live_blocked';
  const collectIds = (statuses: Record<string, string>, predicate: (status: string) => boolean) =>
    Object.entries(statuses)
      .filter(([, status]) => predicate(status))
      .map(([id]) => id)
      .sort();

  return {
    itemStatuses,
    alchemyRecipeStatuses,
    forgeBlueprintStatuses,
    visibleItemIds: collectIds(itemStatuses, isVisibleStatus),
    visibleAlchemyRecipeIds: collectIds(alchemyRecipeStatuses, isVisibleStatus),
    visibleForgeBlueprintIds: collectIds(forgeBlueprintStatuses, isVisibleStatus),
    hiddenItemIds: collectIds(itemStatuses, (status) => !isVisibleStatus(status)),
    hiddenAlchemyRecipeIds: collectIds(alchemyRecipeStatuses, (status) => !isVisibleStatus(status)),
    hiddenForgeBlueprintIds: collectIds(forgeBlueprintStatuses, (status) => !isVisibleStatus(status)),
    blockedItemIds: collectIds(itemStatuses, (status) => status === 'visible_live_blocked'),
    blockedForgeBlueprintIds: collectIds(forgeBlueprintStatuses, (status) => status === 'visible_live_blocked'),
  };
}

export function listVisibleAlchemyRecipes(content: LiveEconomyContentSnapshot) {
  const catalog = createLiveEconomyCatalog(content);
  return content.alchemy_recipes.filter((recipe) => {
    const status = catalog.alchemyRecipeStatuses[recipe.id];
    return status === 'visible_live' || status === 'visible_live_blocked';
  });
}

export function listVisibleForgeBlueprints(content: LiveEconomyContentSnapshot): NormalizedForgeBlueprintWithStatus[] {
  const catalog = createLiveEconomyCatalog(content);
  return content.forge_blueprints
    .map((blueprint) => ({ ...normalizeForgeBlueprint(blueprint), runtimeStatus: catalog.forgeBlueprintStatuses[blueprint.id] }))
    .filter((blueprint) => blueprint.runtimeStatus === 'visible_live' || blueprint.runtimeStatus === 'visible_live_blocked');
}

export function getVisibleAlchemyRecipeById(content: LiveEconomyContentSnapshot, recipeId: string) {
  return listVisibleAlchemyRecipes(content).find((recipe) => recipe.id === recipeId);
}

export function getVisibleForgeBlueprintById(content: LiveEconomyContentSnapshot, blueprintId: string) {
  return listVisibleForgeBlueprints(content).find((blueprint) => blueprint.id === blueprintId);
}
