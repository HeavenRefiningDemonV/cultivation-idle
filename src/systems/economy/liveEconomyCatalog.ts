import { normalizeForgeBlueprint } from '../../content/forge.js';
import type { ValidatedContent } from '../../content/validators.js';
import { getAlchemyRecipeRuntimeStatus, getForgeBlueprintRuntimeStatus, getItemRuntimeStatus } from './liveEconomyVisibility.js';
import type { AlchemyRecipeDef, ForgeBlueprintDef, LiveEconomyCatalog, LiveEconomyRuntimeStatus } from './liveEconomyTypes.js';

const isLiveFacingStatus = (status: LiveEconomyRuntimeStatus): boolean =>
  status === 'visible_live' || status === 'visible_live_blocked';

export function buildLiveEconomyCatalog(content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'>): LiveEconomyCatalog {
  const itemStatusById = Object.fromEntries(content.items.map((item) => [item.id, getItemRuntimeStatus(item)]));
  const alchemyRecipeStatusById = Object.fromEntries(
    content.alchemy_recipes.map((recipe) => [recipe.id, getAlchemyRecipeRuntimeStatus(recipe)]),
  );
  const forgeBlueprintStatusById = Object.fromEntries(
    content.forge_blueprints.map((blueprint) => [blueprint.id, getForgeBlueprintRuntimeStatus(blueprint, content)]),
  );

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

export function getVisibleAlchemyRecipes(content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'>): AlchemyRecipeDef[] {
  const catalog = buildLiveEconomyCatalog(content);
  return content.alchemy_recipes.filter((recipe) => isLiveFacingStatus(catalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown'));
}

export function getVisibleForgeBlueprints(content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'>): ForgeBlueprintDef[] {
  const catalog = buildLiveEconomyCatalog(content);
  return content.forge_blueprints.filter((blueprint) => isLiveFacingStatus(catalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown'));
}

export function getVisibleNormalizedForgeBlueprints(content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'>) {
  return getVisibleForgeBlueprints(content).map((blueprint) => normalizeForgeBlueprint(blueprint));
}

export function getRawAlchemyRecipeById(
  content: Pick<ValidatedContent, 'alchemy_recipes'> | null | undefined,
  recipeId: string,
): AlchemyRecipeDef | undefined {
  return content?.alchemy_recipes.find((recipe) => recipe.id === recipeId);
}

export function getLiveAlchemyRecipeById(
  content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'> | null | undefined,
  recipeId: string,
): AlchemyRecipeDef | undefined {
  if (!content) return undefined;
  return getVisibleAlchemyRecipes(content).find((recipe) => recipe.id === recipeId);
}

export function getRawForgeBlueprintById(
  content: Pick<ValidatedContent, 'forge_blueprints'> | null | undefined,
  blueprintId: string,
): ForgeBlueprintDef | undefined {
  return content?.forge_blueprints.find((blueprint) => blueprint.id === blueprintId);
}

export function getLiveForgeBlueprintById(
  content: Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints'> | null | undefined,
  blueprintId: string,
): ForgeBlueprintDef | undefined {
  if (!content) return undefined;
  return getVisibleForgeBlueprints(content).find((blueprint) => blueprint.id === blueprintId);
}
