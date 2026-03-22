import type { AlchemyRecipesConfig } from './types.js';
import type { ValidatedContent } from './validators.js';
import { useContentStore } from '../stores/contentStore.js';
import { getVisibleAlchemyRecipes } from '../systems/economy/liveEconomyCatalog.js';

type AlchemyRecipe = AlchemyRecipesConfig['recipes'][number];

type AlchemyContentSlice = Pick<ValidatedContent, 'items' | 'alchemy_recipes' | 'forge_blueprints' | 'cities'>;

function filterRecipesForCity(recipes: AlchemyRecipe[], cities: readonly { id: string }[], cityId: string | null): AlchemyRecipe[] {
  if (!cityId) return recipes;

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

export function listRawAlchemyRecipes(): AlchemyRecipe[] {
  return useContentStore.getState().raw?.alchemy_recipes ?? [];
}

export function listAlchemyRecipes(): AlchemyRecipe[] {
  const raw = useContentStore.getState().raw as AlchemyContentSlice | null;
  if (!raw) return [];
  return getVisibleAlchemyRecipes(raw);
}

export function listRawAlchemyRecipesForCity(cityId: string | null): AlchemyRecipe[] {
  const recipes = listRawAlchemyRecipes();
  const cities = useContentStore.getState().raw?.cities ?? [];
  return filterRecipesForCity(recipes, cities, cityId);
}

export function listAlchemyRecipesForCity(cityId: string | null): AlchemyRecipe[] {
  const recipes = listAlchemyRecipes();
  const cities = useContentStore.getState().raw?.cities ?? [];
  return filterRecipesForCity(recipes, cities, cityId);
}


export function getLiveAlchemyRecipeByOutputItemId(itemId: string, cityId?: string | null): AlchemyRecipe | null {
  const recipes = cityId ? listAlchemyRecipesForCity(cityId) : listAlchemyRecipes();
  return recipes.find((recipe) => Number(recipe.outputs?.[itemId] ?? 0) > 0) ?? null;
}

export function listLiveAlchemyRecipeInputsByOutputItemId(itemId: string, cityId?: string | null) {
  const recipe = getLiveAlchemyRecipeByOutputItemId(itemId, cityId);
  return recipe ? Object.entries(recipe.inputs ?? {}).map(([inputItemId, qty]) => ({ itemId: inputItemId, qty: Number(qty ?? 0) })) : [];
}
