import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CityDef } from '../content';
import { useContentStore } from './contentStore';

export type CityFlags = {
  outskirtsBossDefeated: boolean;
  gateTrialCleared: boolean;
  ruinsCleared: boolean;
};

interface CityState {
  currentCityId: string | null;
  unlockedCityIds: string[];
  selectedModuleByCity: Record<string, string>;
  cityFlagsById: Record<string, CityFlags>;
  initializedFromContent: boolean;
  initializeFromContent: (cities: CityDef[]) => void;
  setCurrentCity: (cityId: string) => void;
  setSelectedModule: (cityId: string, moduleKey: string) => void;
  unlockCity: (cityId: string) => void;
  markOutskirtsBossDefeated: (cityId: string) => void;
  markGateTrialCleared: (cityId: string) => void;
  markRuinsCleared: (cityId: string) => void;
  hardResetCity: () => void;
}

const createDefaultFlags = (): CityFlags => ({
  outskirtsBossDefeated: false,
  gateTrialCleared: false,
  ruinsCleared: false,
});

const createInitialCityState = (): Omit<
  CityState,
  | 'initializeFromContent'
  | 'setCurrentCity'
  | 'setSelectedModule'
  | 'unlockCity'
  | 'markOutskirtsBossDefeated'
  | 'markGateTrialCleared'
  | 'markRuinsCleared'
  | 'hardResetCity'
> => ({
  currentCityId: null,
  unlockedCityIds: [],
  selectedModuleByCity: {},
  cityFlagsById: {},
  initializedFromContent: false,
});

export const useCityStore = create<CityState>()(
  immer((set, get) => ({
    ...createInitialCityState(),

    initializeFromContent: (cities: CityDef[]) => {
      if (!cities || cities.length === 0) {
        set((state) => {
          state.currentCityId = null;
          state.initializedFromContent = true;
        });
        return;
      }

      const sorted = [...cities].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const validCityIds = new Set(sorted.map((c) => c.id));
      const firstCityId = sorted[0]?.id ?? null;

      set((state) => {
        // Filter unlocked to valid ids
        state.unlockedCityIds = Array.from(new Set(state.unlockedCityIds.filter((id) => validCityIds.has(id))));

        // Ensure first city unlocked
        if (firstCityId && !state.unlockedCityIds.includes(firstCityId)) {
          state.unlockedCityIds.push(firstCityId);
        }

        // Ensure current city is valid and unlocked
        if (!state.currentCityId || !state.unlockedCityIds.includes(state.currentCityId)) {
          state.currentCityId = firstCityId;
        }

        // Ensure flags and modules for unlocked cities
        for (const city of sorted) {
          if (!state.cityFlagsById[city.id]) {
            state.cityFlagsById[city.id] = createDefaultFlags();
          }

          if (!state.unlockedCityIds.includes(city.id)) {
            continue;
          }

          const existingModule = state.selectedModuleByCity[city.id];
          if (!existingModule || !city.modules.includes(existingModule)) {
            if (city.modules.length > 0) {
              state.selectedModuleByCity[city.id] = city.modules[0];
            } else {
              delete state.selectedModuleByCity[city.id];
            }
          }
        }

        state.initializedFromContent = true;
      });
    },

    setCurrentCity: (cityId: string) => {
      const state = get();
      const city = useContentStore.getState().maps.citiesById[cityId];
      if (!city || !state.unlockedCityIds.includes(cityId)) {
        return;
      }

      set((draft) => {
        draft.currentCityId = cityId;

        const currentSelection = draft.selectedModuleByCity[cityId];
        if (!currentSelection || !city.modules.includes(currentSelection)) {
          if (city.modules.length > 0) {
            draft.selectedModuleByCity[cityId] = city.modules[0];
          } else {
            delete draft.selectedModuleByCity[cityId];
          }
        }
      });
    },

    setSelectedModule: (cityId: string, moduleKey: string) => {
      const state = get();
      const city = useContentStore.getState().maps.citiesById[cityId];
      if (!city || !state.unlockedCityIds.includes(cityId)) return;
      if (!city.modules.includes(moduleKey)) return;

      set((draft) => {
        draft.selectedModuleByCity[cityId] = moduleKey;
      });
    },

    unlockCity: (cityId: string) => {
      const state = get();
      const city = useContentStore.getState().maps.citiesById[cityId];
      if (!city) return;
      if (state.unlockedCityIds.includes(cityId)) return;

      set((draft) => {
        draft.unlockedCityIds.push(cityId);
        if (!draft.cityFlagsById[cityId]) {
          draft.cityFlagsById[cityId] = createDefaultFlags();
        }

        if (city.modules.length > 0) {
          draft.selectedModuleByCity[cityId] = city.modules[0];
        }

        if (!draft.currentCityId) {
          draft.currentCityId = cityId;
        }
      });
    },

    markOutskirtsBossDefeated: (cityId: string) => {
      set((draft) => {
        if (!draft.cityFlagsById[cityId]) {
          draft.cityFlagsById[cityId] = createDefaultFlags();
        }
        draft.cityFlagsById[cityId].outskirtsBossDefeated = true;
      });
    },

    markGateTrialCleared: (cityId: string) => {
      set((draft) => {
        if (!draft.cityFlagsById[cityId]) {
          draft.cityFlagsById[cityId] = createDefaultFlags();
        }
        draft.cityFlagsById[cityId].gateTrialCleared = true;
      });
    },

    markRuinsCleared: (cityId: string) => {
      set((draft) => {
        if (!draft.cityFlagsById[cityId]) {
          draft.cityFlagsById[cityId] = createDefaultFlags();
        }
        draft.cityFlagsById[cityId].ruinsCleared = true;
      });
    },

    hardResetCity: () => {
      set(() => ({
        ...createInitialCityState(),
      }));
    },
  })),
);
