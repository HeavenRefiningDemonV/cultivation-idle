import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { LoadedContentRaw } from '../src/content/loaders.ts';
import { validateLoadedContent } from '../src/content/validators.ts';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const FILES: Record<keyof LoadedContentRaw, string> = {
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
};

async function readJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(CONTENT_DIR, fileName);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function run(): Promise<void> {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => {
      const data = await readJson(fileName);
      return [key, data] as const;
    }),
  );

  const raw = Object.fromEntries(entries) as LoadedContentRaw;
  validateLoadedContent(raw);
  console.log('[ContentValidation] Content validation passed.');
}

run().catch((error) => {
  console.error('[ContentValidation] Content validation failed.');
  console.error(error);
  process.exit(1);
});
