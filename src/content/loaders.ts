import type {
  AlchemyRecipesConfig,
  ApothecaryShopsConfig,
  BountiesConfig,
  CitiesPayload,
  EconomyConfig,
  EnemiesConfig,
  ExpeditionsConfig,
  ForgeBlueprintsConfig,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PavilionsConfig,
  PrestigeStoreConfig,
  RunesConfig,
  RuinsConfig,
  TalismanRecipesConfig,
  TechniquesConfig,
  TrialsConfig,
} from './types';
import { contentUrl } from './contentPaths';

export interface LoadedContentRaw {
  economy: EconomyConfig;
  cities: CitiesPayload;
  items: ItemsConfig;
  techniques: TechniquesConfig;
  pavilions: PavilionsConfig;
  outskirts: OutskirtsConfig;
  enemies: EnemiesConfig;
  trials: TrialsConfig;
  ruins: RuinsConfig;
  alchemy_recipes: AlchemyRecipesConfig;
  forge_blueprints: ForgeBlueprintsConfig;
  runes: RunesConfig;
  talisman_recipes: TalismanRecipesConfig;
  apothecary_shops: ApothecaryShopsConfig;
  expeditions: ExpeditionsConfig;
  bounties: BountiesConfig;
  heart_laws: HeartLawsConfig;
  prestige_store: PrestigeStoreConfig;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: import.meta.env.DEV ? 'no-store' : undefined,
  });

  if (!res.ok) {
    throw new Error(`[Content] Failed to fetch ${url} (HTTP ${res.status})`);
  }

  try {
    return await res.json();
  } catch (error) {
    throw new Error(`[Content] Invalid JSON in ${url}`);
  }
}

async function loadFile<T>(fileName: string): Promise<T> {
  try {
    return await fetchJson<T>(contentUrl(fileName));
  } catch (error) {
    if (error instanceof Error) {
      error.message = `[Content] ${fileName}: ${error.message}`;
    }
    throw error;
  }
}

export async function loadAllContent(): Promise<LoadedContentRaw> {
  const files = {
    economy: 'economy.json',
    cities: 'cities.json',
    items: 'items.json',
    techniques: 'techniques.json',
    pavilions: 'pavilions.json',
    outskirts: 'outskirts.json',
    enemies: 'enemies.json',
    trials: 'trials.json',
    ruins: 'ruins.json',
    alchemy_recipes: 'alchemy_recipes.json',
    forge_blueprints: 'forge_blueprints.json',
    runes: 'runes.json',
    talisman_recipes: 'talisman_recipes.json',
    apothecary_shops: 'apothecary_shops.json',
    expeditions: 'expeditions.json',
    bounties: 'bounties.json',
    heart_laws: 'heart_laws.json',
    prestige_store: 'prestige_store.json',
  } as const;

  const entries = await Promise.all(
    Object.entries(files).map(async ([key, fileName]) => {
      const data = await loadFile(fileName as string);
      return [key, data] as const;
    }),
  );

  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}
