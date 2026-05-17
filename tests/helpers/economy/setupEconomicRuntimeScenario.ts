import { promises as fs } from 'node:fs';
import path from 'node:path';

import { validateLoadedContent, type ValidatedContent } from '../../../src/content/index.js';
import { useBountyStore } from '../../../src/stores/bountyStore.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useEquipmentStore } from '../../../src/stores/equipmentStore.js';
import { useExpeditionStore } from '../../../src/stores/expeditionStore.js';
import { useGameStore, setInventoryStoreGetter, setPrestigeStoreGetter } from '../../../src/stores/gameStore.js';
import { useInventoryStore } from '../../../src/stores/inventoryStore.js';
import { useShopStore } from '../../../src/stores/shopStore.js';
import { useTechCollectionStore } from '../../../src/stores/techCollectionStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';

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
  pavilion_records: 'pavilion_records.json',
};

async function readJson(fileName: string) {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
}

let validatedPromise: Promise<ValidatedContent> | null = null;
export async function getValidatedEconomicContent() {
  if (!validatedPromise) {
    validatedPromise = Promise.all(
      Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
    ).then((entries) => validateLoadedContent(Object.fromEntries(entries) as never));
  }
  return validatedPromise;
}

export function primeContentStore(content: ValidatedContent) {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...content.cities].sort((a, b) => a.index - b.index),
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(content.cities.map((entry) => [entry.id, entry])) as never,
      itemsById: Object.fromEntries(content.items.map((entry) => [entry.id, entry])) as never,
      runesById: Object.fromEntries(content.runes.map((entry) => [entry.id, entry])) as never,
      heartLawsById: Object.fromEntries(content.heart_laws.map((entry) => [entry.id, entry])) as never,
      apothecariesById: Object.fromEntries(content.apothecary_shops.map((entry) => [entry.id, entry])) as never,
      apothecariesByCityId: Object.fromEntries(content.apothecary_shops.map((entry) => [entry.cityId, entry])) as never,
      trialsById: Object.fromEntries(content.trials.map((entry) => [entry.id, entry])) as never,
      trialsByCityId: Object.fromEntries(content.trials.map((entry) => [entry.cityId, entry])) as never,
    },
  });
}

export function resetEconomicRuntimeStores() {
  useInventoryStore.getState().hardResetInventory();
  useGameStore.getState().hardResetGameState();
  useCityStore.getState().hardResetCity();
  useEquipmentStore.getState().hardResetEquipment();
  useShopStore.getState().hardResetShop();
  useTrialStore.getState().hardResetTrials();
  useBountyStore.getState().hardResetBounties();
  useTechCollectionStore.getState().hardReset();
  useExpeditionStore.getState().hydrate({ slots: 1, active: [], rareProgressByKey: {} }, 0);
  setPrestigeStoreGetter(() => ({
    updateHighestRealm: () => {},
    getQiMultiplier: () => 1,
    getCombatMultiplier: () => 1,
    getSpiritRootTotalMultiplier: () => 1,
    spiritRoot: null,
  }));
  setInventoryStoreGetter(() => ({
    getItemCount: (itemId: string) => useInventoryStore.getState().getItemCount(itemId),
    removeItem: (itemId: string, quantity: number) => useInventoryStore.getState().removeItem(itemId, quantity),
    resetInventory: () => useInventoryStore.getState().resetInventory(),
  }));
}
