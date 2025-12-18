import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TechniqueDef } from '../content';
import { useContentStore } from './contentStore';
import { useTechCollectionStore } from './techCollectionStore';

export type AiProfile = 'balanced' | 'survivor' | 'burst' | 'farmer';
export type SlotType = 'active' | 'passive' | 'ultimate';

export interface TechniqueLoadout {
  id: string;
  name: string;
  slots: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
  aiProfile: AiProfile;
}

interface TechniqueStoreState {
  loadouts: TechniqueLoadout[];
  selectedLoadoutId: string;
  setSelectedLoadout: (id: string) => void;
  setAiProfile: (loadoutId: string, profile: AiProfile) => void;
  equipTechnique: (slotType: SlotType, slotIndex: number, techId: string) => void;
  resetLoadouts: () => void;
  getSelectedLoadout: () => TechniqueLoadout | undefined;
  getSelectedAiProfile: () => AiProfile;
  getEquippedTechIds: (
    loadoutId?: string
  ) => { active: string[]; passive: string[]; ultimate: string | null };
}

const ACTIVE_SLOTS = 2;
const PASSIVE_SLOTS = 1;

const createEmptyLoadout = (id: string, name: string, aiProfile: AiProfile): TechniqueLoadout => ({
  id,
  name,
  aiProfile,
  slots: {
    active: Array.from({ length: ACTIVE_SLOTS }, () => ''),
    passive: Array.from({ length: PASSIVE_SLOTS }, () => ''),
    ultimate: null,
  },
});

const isSlotCompatible = (tech: TechniqueDef | undefined, slotType: SlotType) => {
  if (!tech || !tech.type) return true;
  if (tech.type === slotType) return true;
  // Allow unknown or unexpected types for forward-compatibility
  return false;
};

export const useTechniqueStore = create<TechniqueStoreState>()(
  immer((set, get) => ({
    loadouts: [
      createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced'),
      createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor'),
      createEmptyLoadout('loadout_3', 'Loadout 3', 'burst'),
    ],
    selectedLoadoutId: 'loadout_1',

    setSelectedLoadout: (id) => {
      const exists = get().loadouts.some((l) => l.id === id);
      if (!exists) return;
      set((state) => {
        state.selectedLoadoutId = id;
      });
    },

    setAiProfile: (loadoutId, profile) => {
      set((state) => {
        const loadout = state.loadouts.find((l) => l.id === loadoutId);
        if (!loadout) return;
        loadout.aiProfile = profile;
      });
    },

    equipTechnique: (slotType, slotIndex, techId) => {
      const state = get();
      const loadout = state.loadouts.find((l) => l.id === state.selectedLoadoutId);
      if (!loadout) return;

      if (slotType === 'active' && (slotIndex < 0 || slotIndex >= ACTIVE_SLOTS)) return;
      if (slotType === 'passive' && (slotIndex < 0 || slotIndex >= PASSIVE_SLOTS)) return;
      if (slotType === 'ultimate' && slotIndex !== 0) return;

      if (techId !== '') {
        const unlocked = useTechCollectionStore.getState().hasTech(techId);
        if (!unlocked) return;

        const techniqueDef = useContentStore.getState().maps.techniquesById?.[techId];
        if (!techniqueDef) {
          console.warn(`[TechniqueStore] Attempted to equip unknown technique: ${techId}`);
          return;
        }

        if (!isSlotCompatible(techniqueDef, slotType)) {
          console.warn(
            `[TechniqueStore] Technique ${techId} is not compatible with ${slotType} slots`
          );
          return;
        }
      }

      set((draft) => {
        const targetLoadout = draft.loadouts.find((l) => l.id === draft.selectedLoadoutId);
        if (!targetLoadout) return;

        // Remove duplicates within the same loadout
        if (techId !== '') {
          targetLoadout.slots.active = targetLoadout.slots.active.map((id) =>
            id === techId ? '' : id
          );
          targetLoadout.slots.passive = targetLoadout.slots.passive.map((id) =>
            id === techId ? '' : id
          );
          if (targetLoadout.slots.ultimate === techId) {
            targetLoadout.slots.ultimate = null;
          }
        }

        if (slotType === 'active') {
          targetLoadout.slots.active[slotIndex] = techId;
        } else if (slotType === 'passive') {
          targetLoadout.slots.passive[slotIndex] = techId;
        } else {
          targetLoadout.slots.ultimate = techId || null;
        }
      });
    },

    resetLoadouts: () => {
      set(() => ({
        loadouts: [
          createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced'),
          createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor'),
          createEmptyLoadout('loadout_3', 'Loadout 3', 'burst'),
        ],
        selectedLoadoutId: 'loadout_1',
      }));
    },

    getSelectedLoadout: () => {
      const state = get();
      return state.loadouts.find((l) => l.id === state.selectedLoadoutId);
    },

    getSelectedAiProfile: () => {
      return get().getSelectedLoadout()?.aiProfile ?? 'balanced';
    },

    getEquippedTechIds: (loadoutId) => {
      const state = get();
      const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
      if (!loadout) {
        return {
          active: Array.from({ length: ACTIVE_SLOTS }, () => ''),
          passive: Array.from({ length: PASSIVE_SLOTS }, () => ''),
          ultimate: null,
        };
      }
      return {
        active: [...loadout.slots.active],
        passive: [...loadout.slots.passive],
        ultimate: loadout.slots.ultimate,
      };
    },
  }))
);
