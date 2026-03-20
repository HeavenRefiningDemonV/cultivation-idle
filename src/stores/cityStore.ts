import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CityDef } from '../content/index.js';
import { useContentStore } from './contentStore';
import { useBountyStore } from './bountyStore';
import { useUIStore } from './uiStore';
import type { MajorRealmId } from '../systems/progression/contract';
import { syncRuntimeCityStateToRealmEntry } from '../systems/progression/runtime/index.js';
import {
  getQueuedCityArrivalCandidate,
  normalizeAcknowledgedArrivalCityIds,
} from '../systems/world/cityArrivalContract.js';
import {
  getDefaultModuleForWorldCity,
  resolveFallbackCurrentCityId,
} from '../systems/world/travelContract.js';

export type CityFlags = {
  outskirtsBossDefeated: boolean;
  gateTrialCleared: boolean;
  ruinsCleared: boolean;
};

export interface CityState {
  currentCityId: string | null;
  unlockedCityIds: string[];
  acknowledgedArrivalCityIds: string[];
  selectedModuleByCity: Record<string, string>;
  cityFlagsById: Record<string, CityFlags>;
  initializedFromContent: boolean;
  initializeFromContent: (cities: CityDef[]) => void;
  setCurrentCity: (cityId: string) => void;
  setSelectedModule: (cityId: string, moduleKey: string) => void;
  unlockCity: (cityId: string) => boolean;
  unlockCityAndFocus: (cityId: string) => boolean;
  syncRealmEntry: (majorRealmId: MajorRealmId) => string[];
  acknowledgeCityArrival: (cityId: string) => void;
  ensurePendingCityArrival: (preferredCityId?: string | null) => string | null;
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
  | 'unlockCityAndFocus'
  | 'syncRealmEntry'
  | 'acknowledgeCityArrival'
  | 'ensurePendingCityArrival'
  | 'markOutskirtsBossDefeated'
  | 'markGateTrialCleared'
  | 'markRuinsCleared'
  | 'hardResetCity'
> => ({
  currentCityId: null,
  unlockedCityIds: [],
  acknowledgedArrivalCityIds: [],
  selectedModuleByCity: {},
  cityFlagsById: {},
  initializedFromContent: false,
});

function normalizeAcknowledgedForState(args: {
  incoming: readonly string[];
  unlockedCityIds: readonly string[];
  cities: readonly CityDef[];
  fieldWasPresent?: boolean;
}): string[] {
  const { incoming, unlockedCityIds, cities, fieldWasPresent = true } = args;
  return normalizeAcknowledgedArrivalCityIds({
    incoming,
    unlockedCityIds,
    validCityIds: cities.map((city) => city.id),
    fieldWasPresent,
  });
}

export const useCityStore = create<CityState>()(
  immer((set, get) => ({
    ...createInitialCityState(),

    initializeFromContent: (cities: CityDef[]) => {
      if (!cities || cities.length === 0) {
        set((state) => {
          state.currentCityId = null;
          state.acknowledgedArrivalCityIds = [];
          state.initializedFromContent = true;
        });
        useUIStore.getState().clearCityArrival();
        return;
      }

      const sorted = [...cities].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const validCityIds = new Set(sorted.map((c) => c.id));
      const firstCityId = sorted[0]?.id ?? null;
      const wasInitialized = get().initializedFromContent;

      set((state) => {
        state.unlockedCityIds = sorted
          .map((city) => city.id)
          .filter((cityId) => state.unlockedCityIds.includes(cityId));

        if (firstCityId && !state.unlockedCityIds.includes(firstCityId)) {
          state.unlockedCityIds.push(firstCityId);
        }

        state.currentCityId = resolveFallbackCurrentCityId({
          cities: sorted,
          currentCityId: state.currentCityId,
          unlockedCityIds: state.unlockedCityIds,
        });

        state.acknowledgedArrivalCityIds = normalizeAcknowledgedForState({
          incoming: state.acknowledgedArrivalCityIds,
          unlockedCityIds: state.unlockedCityIds,
          cities: sorted,
        });

        if (!wasInitialized && state.acknowledgedArrivalCityIds.length === 0) {
          state.acknowledgedArrivalCityIds = [...state.unlockedCityIds];
        }

        for (const city of sorted) {
          if (!state.cityFlagsById[city.id]) {
            state.cityFlagsById[city.id] = createDefaultFlags();
          }

          if (!state.unlockedCityIds.includes(city.id)) {
            continue;
          }

          const existingModule = state.selectedModuleByCity[city.id];
          if (!existingModule || !city.modules.includes(existingModule)) {
            const defaultModule = getDefaultModuleForWorldCity(city);
            if (defaultModule) {
              state.selectedModuleByCity[city.id] = defaultModule;
            } else {
              delete state.selectedModuleByCity[city.id];
            }
          }
        }

        state.unlockedCityIds = state.unlockedCityIds.filter((cityId) => validCityIds.has(cityId));
        state.initializedFromContent = true;
      });

      get().ensurePendingCityArrival(get().currentCityId);
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
          const defaultModule = getDefaultModuleForWorldCity(city);
          if (defaultModule) {
            draft.selectedModuleByCity[cityId] = defaultModule;
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
      if (!city) return false;
      if (state.unlockedCityIds.includes(cityId)) return false;

      set((draft) => {
        draft.unlockedCityIds.push(cityId);
        if (!draft.cityFlagsById[cityId]) {
          draft.cityFlagsById[cityId] = createDefaultFlags();
        }

        const defaultModule = getDefaultModuleForWorldCity(city);
        if (defaultModule) {
          draft.selectedModuleByCity[cityId] = defaultModule;
        }
      });

      const cityIndex = typeof city.index === 'number' ? city.index : null;
      if (cityIndex != null) {
        useBountyStore.getState().generateForCity(cityId, cityIndex);
      }

      return true;
    },

    unlockCityAndFocus: (cityId: string) => {
      const state = get();
      const city = useContentStore.getState().maps.citiesById[cityId];
      if (!city) return false;

      const firstUnlock = !state.unlockedCityIds.includes(cityId) ? get().unlockCity(cityId) : false;

      set((draft) => {
        draft.currentCityId = cityId;

        const currentSelection = draft.selectedModuleByCity[cityId];
        if (!currentSelection || !city.modules.includes(currentSelection)) {
          const defaultModule = getDefaultModuleForWorldCity(city);
          if (defaultModule) {
            draft.selectedModuleByCity[cityId] = defaultModule;
          } else {
            delete draft.selectedModuleByCity[cityId];
          }
        }
      });

      return firstUnlock;
    },

    syncRealmEntry: (majorRealmId) => {
      const content = useContentStore.getState().raw;
      const sync = syncRuntimeCityStateToRealmEntry(content, majorRealmId, get().unlockedCityIds);
      const newlyUnlocked: string[] = [];

      for (const cityId of sync.unlockedCityIds) {
        if (get().unlockCity(cityId)) {
          newlyUnlocked.push(cityId);
        }
      }

      const focusCityId = newlyUnlocked.at(-1);
      if (newlyUnlocked.length > 1) {
        const olderUnlocks = newlyUnlocked.slice(0, -1);
        set((state) => {
          state.acknowledgedArrivalCityIds = normalizeAcknowledgedForState({
            incoming: [...state.acknowledgedArrivalCityIds, ...olderUnlocks],
            unlockedCityIds: state.unlockedCityIds,
            cities: useContentStore.getState().citiesSorted,
          });
        });
      }

      if (focusCityId) {
        get().unlockCityAndFocus(focusCityId);
        get().ensurePendingCityArrival(focusCityId);
      } else {
        const currentCityId = get().currentCityId;
        if (!currentCityId || !get().unlockedCityIds.includes(currentCityId)) {
          const fallbackCityId = sync.unlockedCityIds.at(-1) ?? get().unlockedCityIds[0] ?? null;
          if (fallbackCityId) {
            get().unlockCityAndFocus(fallbackCityId);
          }
        }
      }

      return newlyUnlocked;
    },

    acknowledgeCityArrival: (cityId) => {
      const city = useContentStore.getState().maps.citiesById[cityId];
      const state = get();
      if (!city || !state.unlockedCityIds.includes(cityId)) return;

      set((draft) => {
        draft.acknowledgedArrivalCityIds = normalizeAcknowledgedForState({
          incoming: [...draft.acknowledgedArrivalCityIds, cityId],
          unlockedCityIds: draft.unlockedCityIds,
          cities: useContentStore.getState().citiesSorted,
        });
      });

      if (useUIStore.getState().pendingCityArrivalId === cityId) {
        useUIStore.getState().clearCityArrival();
      }
    },

    ensurePendingCityArrival: (preferredCityId) => {
      const state = get();
      const cityId = getQueuedCityArrivalCandidate({
        unlockedCityIds: state.unlockedCityIds,
        acknowledgedArrivalCityIds: state.acknowledgedArrivalCityIds,
        citiesById: useContentStore.getState().maps.citiesById,
        preferredCityId,
      });

      if (cityId) {
        useUIStore.getState().queueCityArrival(cityId);
        return cityId;
      }

      useUIStore.getState().clearCityArrival();
      return null;
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
