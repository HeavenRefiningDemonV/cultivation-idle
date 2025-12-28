import type { AlchemyRecipesConfig } from './types';
import { useContentStore } from '../stores/contentStore';

type AlchemyRecipe = AlchemyRecipesConfig['recipes'][number];

export function listAlchemyRecipes(): AlchemyRecipe[] {
  return useContentStore.getState().raw?.alchemy_recipes ?? [];
}

export function listAlchemyRecipesForCity(cityId: string | null): AlchemyRecipe[] {
  const recipes = listAlchemyRecipes();
  if (!cityId) return recipes;

  const cities = useContentStore.getState().raw?.cities ?? [];
  const targetIndex = cities.findIndex((city) => city.id === cityId);
  if (targetIndex < 0) return recipes;

  return recipes.filter((recipe) => {
    const unlockId = (recipe as Record<string, unknown>).unlocksAtCityId as string | undefined;
    if (!unlockId) return true;
    const unlockIndex = cities.findIndex((city) => city.id === unlockId);
    if (unlockIndex === -1) return true;
    return unlockIndex <= targetIndex;
  });
}
