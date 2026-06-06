import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  validateLoadedContent,
  type LoadedContentRaw,
  type ValidatedContent,
} from '../../src/content/index.js';
import { useBountyStore } from '../../src/stores/bountyStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useExpeditionStore } from '../../src/stores/expeditionStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

export const FILES = {
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
  onboarding_milestones: 'onboarding_milestones.json',
  cultivator_stats: 'stats.json',
  training_regimens: 'training_regimens.json',
  dao_heart_practices: 'dao_heart_practices.json',
  spirit_roots: 'spirit_roots.json',
  readiness_categories: 'readiness_categories.json',
} as const;

export const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

type LoadedValidatedContent = {
  raw: LoadedContentRaw;
  validated: ValidatedContent;
  citiesSorted: ValidatedContent['cities'];
};

let validatedContentPromise: Promise<LoadedValidatedContent> | null = null;

export async function loadExpeditionValidatedContent(): Promise<LoadedValidatedContent> {
  if (!validatedContentPromise) {
    validatedContentPromise = (async () => {
      const entries = await Promise.all(
        Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
      );
      const raw = Object.fromEntries(entries) as unknown as LoadedContentRaw;
      const validated = validateLoadedContent(raw);
      const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
      return { raw, validated, citiesSorted };
    })();
  }
  return validatedContentPromise;
}

export function resetExpeditionRuntimeStores() {
  useExpeditionStore.setState({ slots: 1, active: [], rareProgressByKey: {} });
  useBountyStore.getState().hardResetBounties();
  useCityStore.getState().hardResetCity();
  useUIStore.getState().hardResetUI();
  useContentStore.setState({
    raw: null,
    economy: null,
    isLoaded: false,
    isLoading: false,
    error: null,
    citiesSorted: [],
    techniquesByPath: {
      heaven: [],
      earth: [],
      martial: [],
    },
    maps: {
      citiesById: {},
      itemsById: {},
      techniquesById: {},
      pavilionsById: {},
      outskirtsById: {},
      enemiesById: {},
      trialsById: {},
      trialsByCityId: {},
      ruinsById: {},
      runesById: {},
      heartLawsById: {},
      prestigeUpgradesById: {},
      apothecariesById: {},
      apothecariesByCityId: {},
    },
  });
}

export async function primeExpeditionRuntimeStores() {
  const { validated, citiesSorted } = await loadExpeditionValidatedContent();

  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    techniquesByPath: {
      heaven: validated.techniques.filter((tech) => tech.path === 'heaven'),
      earth: validated.techniques.filter((tech) => tech.path === 'earth'),
      martial: validated.techniques.filter((tech) => tech.path === 'martial'),
    },
    maps: {
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])),
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])),
      techniquesById: Object.fromEntries(validated.techniques.map((technique) => [technique.id, technique])),
      pavilionsById: Object.fromEntries(validated.pavilions.map((pavilion) => [pavilion.id, pavilion])),
      outskirtsById: Object.fromEntries(validated.outskirts.map((outskirts) => [outskirts.id, outskirts])),
      enemiesById: Object.fromEntries(validated.enemies.map((enemy) => [enemy.id, enemy])),
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])),
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])),
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])),
      runesById: Object.fromEntries(validated.runes.map((rune) => [rune.id, rune])),
      heartLawsById: Object.fromEntries(validated.heart_laws.map((law) => [law.id, law])),
      prestigeUpgradesById: Object.fromEntries(validated.prestige_store.upgrades.map((upgrade) => [upgrade.id, upgrade])),
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])),
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])),
    },
  });

  return { validated, citiesSorted };
}
