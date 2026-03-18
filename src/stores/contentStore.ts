import { create } from 'zustand';
import type {
  ApothecaryShopDef,
  CityDef,
  EnemyTemplate,
  HeartLawDef,
  ItemDef,
  OutskirtsDef,
  PavilionDef,
  PrestigeUpgradeDef,
  RuinDef,
  TechniqueDef,
  TrialDef,
  ValidatedContent,
} from '../content';
import {
  loadAllContent,
  normalizeForgeBlueprint,
  validateLoadedContent,
  type NormalizedForgeBlueprint,
  isRefineBlueprint,
  isRuneBlueprint,
} from '../content';
import {
  getPrestigeRuntimeCatalog,
  getVisiblePrestigeUpgrades as getVisiblePrestigeUpgradesFromRuntime,
} from '../systems/prestige/runtime/prestigeRuntimeCatalog.js';

interface ContentMaps {
  citiesById: Record<string, CityDef>;
  itemsById: Record<string, ItemDef>;
  techniquesById: Record<string, TechniqueDef>;
  pavilionsById: Record<string, PavilionDef>;
  outskirtsById: Record<string, OutskirtsDef>;
  enemiesById: Record<string, EnemyTemplate>;
  trialsById: Record<string, TrialDef>;
  trialsByCityId: Record<string, TrialDef>;
  ruinsById: Record<string, RuinDef>;
  runesById: Record<string, { id: string; [k: string]: unknown }>;
  heartLawsById: Record<string, HeartLawDef>;
  prestigeUpgradesById: Record<string, PrestigeUpgradeDef>;
  apothecariesById: Record<string, ApothecaryShopDef>;
  apothecariesByCityId: Record<string, ApothecaryShopDef>;
}

interface ContentStoreState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  raw: ValidatedContent | null;
  maps: ContentMaps;
  citiesSorted: CityDef[];
  techniquesByPath: Record<'heaven' | 'earth' | 'martial', TechniqueDef[]>;
  load: () => Promise<boolean>;
  getCity: (id: string) => CityDef;
  getItem: (id: string) => ItemDef;
  getTechnique: (id: string) => TechniqueDef;
  getPavilion: (id: string) => PavilionDef | undefined;
  getApothecaryShop: (id: string) => ApothecaryShopDef | undefined;
  getBountyConfig: () => ValidatedContent['bounties'];
  getExpeditionsContent: () => ValidatedContent['expeditions'];
  getExpeditionDurations: () => ValidatedContent['expeditions']['durations'];
  getExpeditionTypes: () => ValidatedContent['expeditions']['types'];
  getExpeditionCityYields: (cityIndex: number) => ValidatedContent['expeditions']['cityYields'][number] | null;
  getHeartLaw: (id: string) => HeartLawDef;
  listHeartLaws: () => HeartLawDef[];
  getPrestigeStoreConfig: () => ValidatedContent['prestige_store'];
  getAllPrestigeUpgrades: () => ValidatedContent['prestige_store']['upgrades'];
  getVisiblePrestigeUpgrades: () => ValidatedContent['prestige_store']['upgrades'];
  getPrestigeRuntimeCatalog: () => ReturnType<typeof getPrestigeRuntimeCatalog>;
}

const emptyMaps: ContentMaps = {
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
};

const emptyTechniquesByPath: Record<'heaven' | 'earth' | 'martial', TechniqueDef[]> = {
  heaven: [],
  earth: [],
  martial: [],
};

let inFlight: Promise<boolean> | null = null;

export const useContentStore = create<ContentStoreState>((set, get) => ({
  isLoading: false,
  isLoaded: false,
  error: null,
  raw: null,
  maps: emptyMaps,
  citiesSorted: [],
  techniquesByPath: emptyTechniquesByPath,

  load: async () => {
    if (get().isLoaded) {
      return true;
    }

    if (inFlight) {
      return inFlight;
    }

    inFlight = (async () => {
      set({ isLoading: true, error: null });

      try {
        const raw = await loadAllContent();
        const validated = validateLoadedContent(raw);
        const cities = validated.cities;
        const items = validated.items;
        const techniques = validated.techniques;
        const pavilions = validated.pavilions;
        const outskirts = validated.outskirts;
        const enemies = validated.enemies;
        const trials = validated.trials;
        const ruins = validated.ruins;
        const apothecaries = validated.apothecary_shops;
        const runes = validated.runes;
        const heartLaws = validated.heart_laws;
        const prestigeUpgrades = validated.prestige_store.upgrades;

        const maps: ContentMaps = {
          citiesById: Object.fromEntries(cities.map((city) => [city.id, city])),
          itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
          techniquesById: Object.fromEntries(techniques.map((tech) => [tech.id, tech])),
          pavilionsById: Object.fromEntries(pavilions.map((pavilion) => [pavilion.id, pavilion])),
          outskirtsById: Object.fromEntries(outskirts.map((outskirt) => [outskirt.id, outskirt])),
          enemiesById: Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])),
          trialsById: Object.fromEntries(trials.map((trial) => [trial.id, trial])),
          trialsByCityId: Object.fromEntries(trials.map((trial) => [trial.cityId, trial])),
          ruinsById: Object.fromEntries(ruins.map((ruin) => [ruin.id, ruin])),
          apothecariesById: Object.fromEntries(apothecaries.map((shop) => [shop.id, shop])),
          apothecariesByCityId: Object.fromEntries(apothecaries.map((shop) => [shop.cityId, shop])),
          runesById: Object.fromEntries(runes.map((rune) => [rune.id, rune as { id: string; [k: string]: unknown }])),
          heartLawsById: Object.fromEntries(heartLaws.map((law) => [law.id, law])),
          prestigeUpgradesById: Object.fromEntries(
            prestigeUpgrades.map((upgrade) => [upgrade.id, upgrade]),
          ),
        };

        const citiesSorted = [...cities].sort((a, b) => a.index - b.index);

        const techniquesByPath: Record<'heaven' | 'earth' | 'martial', TechniqueDef[]> = {
          heaven: [],
          earth: [],
          martial: [],
        };
        techniques.forEach((tech) => {
          if (techniquesByPath[tech.path as 'heaven' | 'earth' | 'martial']) {
            techniquesByPath[tech.path as 'heaven' | 'earth' | 'martial'].push(tech);
          }
        });

        console.info(
          `[Content] Loaded ${cities.length} cities, ${techniques.length} techniques (H/E/M: ${techniquesByPath.heaven.length}/${techniquesByPath.earth.length}/${techniquesByPath.martial.length})`,
        );
        console.info(`[Content] Prestige upgrades: ${prestigeUpgrades.length}`);

        set({
          raw: validated,
          maps,
          citiesSorted,
          techniquesByPath,
          isLoaded: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, isLoading: false, isLoaded: false });
        return false;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  getCity: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    const city = maps.citiesById[id];
    if (!city) {
      throw new Error(`[ContentStore] Unknown city id ${id}`);
    }
    return city;
  },

  getItem: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    const item = maps.itemsById[id];
    if (!item) {
      throw new Error(`[ContentStore] Unknown item id ${id}`);
    }
    return item;
  },

  getTechnique: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    const technique = maps.techniquesById[id];
    if (!technique) {
      throw new Error(`[ContentStore] Unknown technique id ${id}`);
    }
    return technique;
  },

  getPavilion: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return maps.pavilionsById[id];
  },

  getApothecaryShop: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return maps.apothecariesById[id];
  },

  getBountyConfig: () => {
    const { isLoaded, raw } = get();
    if (!isLoaded || !raw?.bounties) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return raw.bounties;
  },

  getExpeditionsContent: () => {
    const { isLoaded, raw } = get();
    if (!isLoaded || !raw?.expeditions) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return raw.expeditions;
  },

  getExpeditionDurations: () => {
    return get().getExpeditionsContent().durations ?? [];
  },

  getExpeditionTypes: () => {
    return get().getExpeditionsContent().types ?? [];
  },

  getExpeditionCityYields: (cityIndex: number) => {
    const content = get().getExpeditionsContent();
    return content.cityYields.find((entry) => entry.cityIndex === cityIndex) ?? null;
  },

  getHeartLaw: (id: string) => {
    const { isLoaded, maps } = get();
    if (!isLoaded) {
      throw new Error('[ContentStore] Content not loaded');
    }
    const law = maps.heartLawsById[id];
    if (!law) {
      throw new Error(`[ContentStore] Unknown heart law id ${id}`);
    }
    return law;
  },

  listHeartLaws: () => {
    const { isLoaded, raw } = get();
    if (!isLoaded || !raw?.heart_laws) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return [...raw.heart_laws].sort((a, b) => {
      const tierA = a.tier ?? '';
      const tierB = b.tier ?? '';
      if (tierA !== tierB) return tierA.localeCompare(tierB);
      return a.name.localeCompare(b.name);
    });
  },

  getPrestigeStoreConfig: () => {
    const { isLoaded, raw } = get();
    if (!isLoaded || !raw?.prestige_store) {
      throw new Error('[ContentStore] Content not loaded');
    }
    return raw.prestige_store;
  },

  getAllPrestigeUpgrades: () => {
    return get().getPrestigeStoreConfig().upgrades ?? [];
  },

  getVisiblePrestigeUpgrades: () => {
    const { raw } = get();
    return getVisiblePrestigeUpgradesFromRuntime(raw);
  },

  getPrestigeRuntimeCatalog: () => {
    const { raw } = get();
    return getPrestigeRuntimeCatalog(raw);
  },
}));

export function getItemDef(itemId: string): ItemDef | null {
  const maps = useContentStore.getState().maps;
  return maps?.itemsById?.[itemId] ?? null;
}

export function formatPrice(price: Partial<Record<'gold' | 'spiritStones' | 'merit', string>>): string {
  const parts: string[] = [];
  if (price.gold) parts.push(`${price.gold} Gold`);
  if (price.spiritStones) parts.push(`${price.spiritStones} Spirit Stones`);
  if (price.merit) parts.push(`${price.merit} Merit`);
  return parts.join(' / ');
}

export function listTalismanRecipes() {
  return useContentStore.getState().raw?.talisman_recipes ?? [];
}

export function listForgeBlueprints(): NormalizedForgeBlueprint[] {
  const blueprints = useContentStore.getState().raw?.forge_blueprints ?? [];
  return blueprints.map((blueprint) => normalizeForgeBlueprint(blueprint));
}

export function getForgeBlueprint(id: string): NormalizedForgeBlueprint | undefined {
  return listForgeBlueprints().find((blueprint) => blueprint.id === id);
}

export function listForgeBlueprintsForCity(options: {
  cityId?: string | null;
  cityIndex?: number | null;
  tier?: number | null;
} = {}): NormalizedForgeBlueprint[] {
  const { cityId, cityIndex, tier } = options;
  const list = listForgeBlueprints();

  if (cityId) {
    const filtered = list.filter((blueprint) => blueprint.cityId === cityId);
    return filtered.length > 0 ? filtered : list;
  }

  const gatingIndex = cityIndex ?? tier;
  if (typeof gatingIndex === 'number') {
    const filtered = list.filter((blueprint) => blueprint.cityIndex === gatingIndex);
    return filtered.length > 0 ? filtered : list;
  }

  return list;
}

export { isRuneBlueprint, isRefineBlueprint };
