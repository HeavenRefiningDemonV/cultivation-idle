import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useCityStore } from './cityStore.js';
import { useContentStore } from './contentStore.js';

export type EquipmentSlot = 'weapon' | 'accessory';

export interface TemperAffix {
  id: string;
  label: string;
  stat: 'atkPct' | 'defPct' | 'hpPct' | 'critPct' | 'dodgePct';
  valuePct: number;
}

export interface ForgeToolTiers {
  anvil: number;
  hammer: number;
  bellows: number;
  quenchTub: number;
}

export type EquipmentRefineResult =
  | { ok: true; applied: number; capped: boolean }
  | { ok: false; error: string };

interface EquipmentState {
  equippedWeaponId: string | null;
  equippedAccessoryId: string | null;
  refineLevelBySlot: { weapon: number; accessory: number };
  temperBonusesBySlot: Record<EquipmentSlot, TemperAffix[]>;
  forgeToolTiers: ForgeToolTiers;
  equipWeapon: (itemId: string | null) => void;
  equipAccessory: (itemId: string | null) => void;
  getRefineCapForCurrentProgress: () => number;
  applyRefineFromForge: (
    slot: EquipmentSlot,
    qty: number,
    options?: { addLevel?: number; maxLevelCap?: number },
  ) => EquipmentRefineResult;
  applyTemperAffix: (slot: EquipmentSlot, affix: TemperAffix) => void;
  upgradeForgeTool: (tool: keyof ForgeToolTiers, amount?: number) => void;
  getTemperAffixes: (slot: EquipmentSlot) => TemperAffix[];
  getForgeToolTiers: () => ForgeToolTiers;
  hardResetEquipment: () => void;
}

const createInitialEquipmentState = (): Pick<
  EquipmentState,
  'equippedWeaponId' | 'equippedAccessoryId' | 'refineLevelBySlot' | 'temperBonusesBySlot' | 'forgeToolTiers'
> => ({
  equippedWeaponId: null,
  equippedAccessoryId: null,
  refineLevelBySlot: { weapon: 0, accessory: 0 },
  temperBonusesBySlot: { weapon: [], accessory: [] },
  forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
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

    applyRefineFromForge: (slot, qty, options) => {
      const amount = Math.floor(qty);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'Invalid refine quantity' };
      }

      const state = get();
      const equippedId = slot === 'weapon' ? state.equippedWeaponId : state.equippedAccessoryId;
      if (!equippedId) {
        return { ok: false, error: `No ${slot} equipped` };
      }

      const addLevel = Math.max(1, Math.floor(options?.addLevel ?? 1));
      const capOverride = options?.maxLevelCap;
      const capFromProgress = get().getRefineCapForCurrentProgress();
      const cap = Number.isFinite(capOverride) ? Math.max(0, Math.min(capOverride ?? capFromProgress, capFromProgress)) : capFromProgress;
      const currentLevel = state.refineLevelBySlot[slot];
      const nextLevel = Math.min(cap, currentLevel + amount * addLevel);
      const applied = Math.max(0, nextLevel - currentLevel);

      set((draft) => {
        draft.refineLevelBySlot[slot] = nextLevel;
      });

      return { ok: true, applied, capped: nextLevel >= cap };
    },

    applyTemperAffix: (slot, affix) => {
      set((draft) => {
        const list = draft.temperBonusesBySlot[slot] ?? [];
        const next = [...list];
        const existingIndex = next.findIndex((entry) => entry.id === affix.id);
        if (existingIndex >= 0) {
          next[existingIndex] = affix;
        } else {
          next.push(affix);
        }
        draft.temperBonusesBySlot[slot] = next.slice(-3);
      });
    },

    upgradeForgeTool: (tool, amount = 1) => {
      const increment = Math.max(0, Math.floor(amount));
      if (increment <= 0) return;
      set((draft) => {
        const current = draft.forgeToolTiers[tool] ?? 1;
        draft.forgeToolTiers[tool] = Math.min(10, current + increment);
      });
    },

    getTemperAffixes: (slot) => {
      const state = get();
      return state.temperBonusesBySlot[slot] ?? [];
    },

    getForgeToolTiers: () => {
      const state = get();
      return { ...state.forgeToolTiers };
    },

    hardResetEquipment: () => {
      set(() => ({
        ...createInitialEquipmentState(),
      }));
    },
  })),
);
