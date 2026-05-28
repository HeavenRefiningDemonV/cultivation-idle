import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useCityStore } from './cityStore.js';
import { useContentStore } from './contentStore.js';
import { bumpVersion } from './versionCounters.js';
const createInitialEquipmentState = () => ({
    equippedWeaponId: null,
    equippedAccessoryId: null,
    refineLevelBySlot: { weapon: 0, accessory: 0 },
    temperBonusesBySlot: { weapon: [], accessory: [] },
    forgeToolTiers: { anvil: 1, hammer: 1, bellows: 1, quenchTub: 1 },
    equipmentVersion: 0,
});
const sameTemperAffix = (left, right) => !!left
    && left.id === right.id
    && left.label === right.label
    && left.stat === right.stat
    && left.valuePct === right.valuePct;
function resolveCityTier() {
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
    if (unlockedCount > 0)
        return unlockedCount;
    return 1;
}
function refineCapForTier(tier) {
    if (tier <= 1)
        return 3;
    if (tier === 2)
        return 5;
    if (tier === 3)
        return 7;
    if (tier === 4)
        return 9;
    return 10;
}
export const useEquipmentStore = create()(immer((set, get) => ({
    ...createInitialEquipmentState(),
    equipWeapon: (itemId) => {
        const nextItemId = itemId || null;
        if (get().equippedWeaponId === nextItemId)
            return;
        set((state) => {
            state.equippedWeaponId = nextItemId;
            state.equipmentVersion = bumpVersion(state.equipmentVersion);
        });
    },
    equipAccessory: (itemId) => {
        const nextItemId = itemId || null;
        if (get().equippedAccessoryId === nextItemId)
            return;
        set((state) => {
            state.equippedAccessoryId = nextItemId;
            state.equipmentVersion = bumpVersion(state.equipmentVersion);
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
        if (applied <= 0) {
            return { ok: true, applied, capped: nextLevel >= cap };
        }
        set((draft) => {
            draft.refineLevelBySlot[slot] = nextLevel;
            draft.equipmentVersion = bumpVersion(draft.equipmentVersion);
        });
        return { ok: true, applied, capped: nextLevel >= cap };
    },
    applyTemperAffix: (slot, affix) => {
        set((draft) => {
            const list = draft.temperBonusesBySlot[slot] ?? [];
            const next = [...list];
            const existingIndex = next.findIndex((entry) => entry.id === affix.id);
            if (existingIndex >= 0) {
                if (sameTemperAffix(next[existingIndex], affix))
                    return;
                next[existingIndex] = affix;
            }
            else {
                next.push(affix);
            }
            const trimmed = next.slice(-3);
            draft.temperBonusesBySlot[slot] = trimmed;
            draft.equipmentVersion = bumpVersion(draft.equipmentVersion);
        });
    },
    upgradeForgeTool: (tool, amount = 1) => {
        const increment = Math.max(0, Math.floor(amount));
        if (increment <= 0)
            return;
        set((draft) => {
            const current = draft.forgeToolTiers[tool] ?? 1;
            const next = Math.min(10, current + increment);
            if (next === current)
                return;
            draft.forgeToolTiers[tool] = next;
            draft.equipmentVersion = bumpVersion(draft.equipmentVersion);
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
})));
