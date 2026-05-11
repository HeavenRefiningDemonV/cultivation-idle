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
  PavilionRecordsConfig,
  RunesConfig,
  RuinsConfig,
  TalismanRecipesConfig,
  TechniquesConfig,
  TrialsConfig,
} from './types.js';
import { contentUrl } from './contentPaths.js';

export type ContentLoadFailurePhase = 'fetch' | 'parse' | 'load';

export class ContentLoadError extends Error {
  phase: ContentLoadFailurePhase;
  fileName: string | null;
  url: string | null;
  causeText?: string;

  constructor(args: { message: string; phase: ContentLoadFailurePhase; fileName?: string | null; url?: string | null; causeText?: string }) {
    super(args.message);
    this.name = 'ContentLoadError';
    this.phase = args.phase;
    this.fileName = args.fileName ?? null;
    this.url = args.url ?? null;
    this.causeText = args.causeText;
  }
}

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
  pavilion_records: PavilionRecordsConfig;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: import.meta.env.DEV ? 'no-store' : undefined,
  });

  if (!res.ok) {
    throw new ContentLoadError({
      message: `[Content] Failed to fetch ${url} (HTTP ${res.status})`,
      phase: 'fetch',
      url,
    });
  }

  try {
    return await res.json();
  } catch (error) {
    throw new ContentLoadError({
      message: `[Content] Invalid JSON in ${url}`,
      phase: 'parse',
      url,
      causeText: error instanceof Error ? error.message : String(error),
    });
  }
}

async function loadFile<T>(fileName: string): Promise<T> {
  const url = contentUrl(fileName);
  try {
    return await fetchJson<T>(url);
  } catch (error) {
    if (error instanceof ContentLoadError) {
      throw new ContentLoadError({
        message: `[Content] ${fileName}: ${error.message}`,
        phase: error.phase,
        fileName,
        url: error.url ?? url,
        causeText: error.causeText,
      });
    }
    throw new ContentLoadError({
      message: `[Content] ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
      phase: 'load',
      fileName,
      url,
    });
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
    pavilion_records: 'pavilion_records.json',
  } as const;

  const entries = await Promise.all(
    Object.entries(files).map(async ([key, fileName]) => {
      const data = await loadFile(fileName as string);
      return [key, data] as const;
    }),
  );

  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}
