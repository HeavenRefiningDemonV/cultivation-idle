import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useCityStore } from './cityStore';
import { useContentStore } from './contentStore';

export type EquipmentSlot = 'weapon' | 'accessory';

export type EquipmentRefineResult =
  | { ok: true; applied: number; capped: boolean }
  | { ok: false; error: string };

interface EquipmentState {
  equippedWeaponId: string | null;
  equippedAccessoryId: string | null;
  refineLevelBySlot: { weapon: number; accessory: number };
  equipWeapon: (itemId: string | null) => void;
  equipAccessory: (itemId: string | null) => void;
  getRefineCapForCurrentProgress: () => number;
  applyRefineFromForge: (slot: EquipmentSlot, qty: number) => EquipmentRefineResult;
  hardResetEquipment: () => void;
}

const createInitialEquipmentState = (): Pick<
  EquipmentState,
  'equippedWeaponId' | 'equippedAccessoryId' | 'refineLevelBySlot'
> => ({
  equippedWeaponId: null,
  equippedAccessoryId: null,
  refineLevelBySlot: { weapon: 0, accessory: 0 },
});

function resolveCityTier(): number {
  const cityState = useCityStore.getState();
  const contentStore = useContentStore.getState();
  const currentCityId = cityState.currentCityId;
  if (currentCityId) {
    const city = contentStore.maps.citiesById[currentCityId];
    if (typeof city?.index === 'number') {
      return Math.max(1, city.index + 1);
    }
  }

  const unlockedCount = cityState.unlockedCityIds.length;
  if (unlockedCount > 0) return unlockedCount;
  return 1;
}

function refineCapForTier(tier: number): number {
  if (tier <= 1) return 3;
  if (tier === 2) return 5;
  if (tier === 3) return 7;
  if (tier === 4) return 9;
  return 10;
}

export const useEquipmentStore = create<EquipmentState>()(
  immer((set, get) => ({
    ...createInitialEquipmentState(),

    equipWeapon: (itemId) => {
      set((state) => {
        state.equippedWeaponId = itemId || null;
      });
    },

    equipAccessory: (itemId) => {
      set((state) => {
        state.equippedAccessoryId = itemId || null;
      });
    },

    getRefineCapForCurrentProgress: () => {
      const tier = resolveCityTier();
      return refineCapForTier(tier);
    },

    applyRefineFromForge: (slot, qty) => {
      const amount = Math.floor(qty);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'Invalid refine quantity' };
      }

      const state = get();
      const equippedId = slot === 'weapon' ? state.equippedWeaponId : state.equippedAccessoryId;
      if (!equippedId) {
        return { ok: false, error: `No ${slot} equipped` };
      }

      const cap = get().getRefineCapForCurrentProgress();
      const currentLevel = state.refineLevelBySlot[slot];
      const nextLevel = Math.min(cap, currentLevel + amount);
      const applied = Math.max(0, nextLevel - currentLevel);

      set((draft) => {
        draft.refineLevelBySlot[slot] = nextLevel;
      });

      return { ok: true, applied, capped: nextLevel >= cap };
    },

    hardResetEquipment: () => {
      set(() => ({
        ...createInitialEquipmentState(),
      }));
    },
  })),
);
