import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateLoadedContent, type LoadedContentRaw, type ValidatedContent } from '../../src/content/index.ts';
import { useContentStore } from '../../src/stores/contentStore.ts';

function readJson<T>(relativePath: string): T {
  const absolutePath = join(process.cwd(), relativePath);
  const raw = readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as T;
}

function buildLoadedContentRawFromDisk(): LoadedContentRaw {
  const base = 'public/cultivation_idle_content_bible_v1_config';
  return {
    economy: readJson(`${base}/economy.json`),
    cities: readJson(`${base}/cities.json`),
    items: readJson(`${base}/items.json`),
    techniques: readJson(`${base}/techniques.json`),
    pavilions: readJson(`${base}/pavilions.json`),
    outskirts: readJson(`${base}/outskirts.json`),
    enemies: readJson(`${base}/enemies.json`),
    trials: readJson(`${base}/trials.json`),
    ruins: readJson(`${base}/ruins.json`),
    alchemy_recipes: readJson(`${base}/alchemy_recipes.json`),
    forge_blueprints: readJson(`${base}/forge_blueprints.json`),
    runes: readJson(`${base}/runes.json`),
    talisman_recipes: readJson(`${base}/talisman_recipes.json`),
    apothecary_shops: readJson(`${base}/apothecary_shops.json`),
    expeditions: readJson(`${base}/expeditions.json`),
    bounties: readJson(`${base}/bounties.json`),
    heart_laws: readJson(`${base}/heart_laws.json`),
    prestige_store: readJson(`${base}/prestige_store.json`),
  };
}

export function loadValidatedContentFromDisk(): ValidatedContent {
  return validateLoadedContent(buildLoadedContentRawFromDisk());
}

export function bootstrapContentStore(validated: ValidatedContent): void {
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  const techniquesByPath: Record<'heaven' | 'earth' | 'martial', ValidatedContent['techniques']> = {
    heaven: [],
    earth: [],
    martial: [],
  };

  validated.techniques.forEach((technique) => {
    const path = technique.path as 'heaven' | 'earth' | 'martial';
    if (techniquesByPath[path]) {
      techniquesByPath[path].push(technique);
    }
  });

  useContentStore.setState({
    isLoading: false,
    isLoaded: true,
    error: null,
    raw: validated,
    citiesSorted,
    techniquesByPath,
    maps: {
      citiesById: Object.fromEntries(validated.cities.map((entry) => [entry.id, entry])),
      itemsById: Object.fromEntries(validated.items.map((entry) => [entry.id, entry])),
      techniquesById: Object.fromEntries(validated.techniques.map((entry) => [entry.id, entry])),
      pavilionsById: Object.fromEntries(validated.pavilions.map((entry) => [entry.id, entry])),
      outskirtsById: Object.fromEntries(validated.outskirts.map((entry) => [entry.id, entry])),
      enemiesById: Object.fromEntries(validated.enemies.map((entry) => [entry.id, entry])),
      trialsById: Object.fromEntries(validated.trials.map((entry) => [entry.id, entry])),
      trialsByCityId: Object.fromEntries(validated.trials.map((entry) => [entry.cityId, entry])),
      ruinsById: Object.fromEntries(validated.ruins.map((entry) => [entry.id, entry])),
      runesById: Object.fromEntries(validated.runes.map((entry) => [entry.id, entry])),
      heartLawsById: Object.fromEntries(validated.heart_laws.map((entry) => [entry.id, entry])),
      prestigeUpgradesById: Object.fromEntries(validated.prestige_store.upgrades.map((entry) => [entry.id, entry])),
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((entry) => [entry.id, entry])),
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((entry) => [entry.cityId, entry])),
    },
  });
}
