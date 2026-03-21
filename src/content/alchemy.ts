import type { AlchemyRecipesConfig } from './types';
import { useContentStore } from '../stores/contentStore';
import { listVisibleAlchemyRecipes as listVisibleAlchemyRecipesFromCatalog, getVisibleAlchemyRecipeById } from '../systems/economy/liveEconomyCatalog.js';

type AlchemyRecipe = AlchemyRecipesConfig['recipes'][number];

function filterRecipesForCity(recipes: readonly AlchemyRecipe[], cityId: string | null): AlchemyRecipe[] {
  if (!cityId) return [...recipes];

  const cities = useContentStore.getState().raw?.cities ?? [];
  const targetIndex = cities.findIndex((city) => city.id === cityId);
  if (targetIndex < 0) return [...recipes];

  return recipes.filter((recipe) => {
    const unlockId = (recipe as Record<string, unknown>).unlocksAtCityId as string | undefined;
    if (!unlockId) return true;
    const unlockIndex = cities.findIndex((city) => city.id === unlockId);
    if (unlockIndex === -1) return true;
    return unlockIndex <= targetIndex;
  });
}

export function listAlchemyRecipesRaw(): AlchemyRecipe[] {
  return useContentStore.getState().raw?.alchemy_recipes ?? [];
}

export function getAlchemyRecipeRaw(recipeId: string): AlchemyRecipe | undefined {
  return listAlchemyRecipesRaw().find((recipe) => recipe.id === recipeId);
}

export function listAlchemyRecipes(): AlchemyRecipe[] {
  const content = useContentStore.getState().raw;
  if (!content) return [];
  return listVisibleAlchemyRecipesFromCatalog(content);
}

export function getAlchemyRecipe(recipeId: string): AlchemyRecipe | undefined {
  const content = useContentStore.getState().raw;
  if (!content) return undefined;
  return getVisibleAlchemyRecipeById(content, recipeId);
}

export function listAlchemyRecipesForCity(cityId: string | null): AlchemyRecipe[] {
  return filterRecipesForCity(listAlchemyRecipes(), cityId);
}

export function listAlchemyRecipesRawForCity(cityId: string | null): AlchemyRecipe[] {
  return filterRecipesForCity(listAlchemyRecipesRaw(), cityId);
}
