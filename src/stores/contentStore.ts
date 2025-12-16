import { create } from 'zustand';
import type {
  CityDef,
  EnemyTemplate,
  ItemDef,
  OutskirtsDef,
  PavilionDef,
  RuinDef,
  TechniqueDef,
  TrialDef,
  ValidatedContent,
} from '../content';
import { loadAllContent, validateLoadedContent } from '../content';

interface ContentMaps {
  citiesById: Record<string, CityDef>;
  itemsById: Record<string, ItemDef>;
  techniquesById: Record<string, TechniqueDef>;
  pavilionsById: Record<string, PavilionDef>;
  outskirtsById: Record<string, OutskirtsDef>;
  enemiesById: Record<string, EnemyTemplate>;
  trialsById: Record<string, TrialDef>;
  ruinsById: Record<string, RuinDef>;
  runesById: Record<string, { id: string; [k: string]: any }>;
  heartLawsById: Record<string, { id: string; [k: string]: any }>;
  prestigeUpgradesById: Record<string, { id: string; [k: string]: any }>;
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
}

const emptyMaps: ContentMaps = {
  citiesById: {},
  itemsById: {},
  techniquesById: {},
  pavilionsById: {},
  outskirtsById: {},
  enemiesById: {},
  trialsById: {},
  ruinsById: {},
  runesById: {},
  heartLawsById: {},
  prestigeUpgradesById: {},
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
        const runes = validated.runes;
        const heartLaws = validated.heart_laws;
        const prestigeUpgrades = validated.prestige_store;

        const maps: ContentMaps = {
          citiesById: Object.fromEntries(cities.map((city) => [city.id, city])),
          itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
          techniquesById: Object.fromEntries(techniques.map((tech) => [tech.id, tech])),
          pavilionsById: Object.fromEntries(pavilions.map((pavilion) => [pavilion.id, pavilion])),
          outskirtsById: Object.fromEntries(outskirts.map((outskirt) => [outskirt.id, outskirt])),
          enemiesById: Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])),
          trialsById: Object.fromEntries(trials.map((trial) => [trial.id, trial])),
          ruinsById: Object.fromEntries(ruins.map((ruin) => [ruin.id, ruin])),
          runesById: Object.fromEntries(runes.map((rune) => [rune.id, rune as any])),
          heartLawsById: Object.fromEntries(heartLaws.map((law) => [law.id, law as any])),
          prestigeUpgradesById: Object.fromEntries(
            prestigeUpgrades.map((upgrade) => [upgrade.id, upgrade as any]),
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
}));
