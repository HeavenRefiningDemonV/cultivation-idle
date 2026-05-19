export const RUNTIME_CONTENT_DIR = 'cultivation_idle_content_bible_v1_config' as const;

export const RUNTIME_CONTENT_FILE_BY_KEY = {
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

export type RuntimeContentKey = keyof typeof RUNTIME_CONTENT_FILE_BY_KEY;
export type RuntimeContentFileName = (typeof RUNTIME_CONTENT_FILE_BY_KEY)[RuntimeContentKey];

export const RUNTIME_CONTENT_FILES = Object.freeze(
  Object.values(RUNTIME_CONTENT_FILE_BY_KEY),
) as readonly RuntimeContentFileName[];

