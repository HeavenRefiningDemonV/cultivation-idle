import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  type RawProgressionContentLike,
} from '../../../src/systems/progression/contract/index.js';
import type { FixtureBuildContext } from './fixtureTypes.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const FILES = {
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
};

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

let cachedContext: FixtureBuildContext | null = null;

export const loadRawProgressionContent = async (): Promise<RawProgressionContentLike> => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as RawProgressionContentLike;
};

export const loadProgressionFixtureContext = async (): Promise<FixtureBuildContext> => {
  if (cachedContext) return cachedContext;
  const rawContent = await loadRawProgressionContent();
  cachedContext = {
    rawContent,
    contract: buildProgressionContract(adaptProgressionAuthoredContent(rawContent)),
  };
  return cachedContext;
};
