import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SEMESTER_SLOT_CAPS, getSlotUnlockRequirementForProgression, resolveLoadoutProgressionSnapshot, } from '../systems/builds/loadoutProgressionContract.js';
import { buildLoadoutSnapshotFromLoadout } from '../systems/builds/loadoutSnapshot.js';
import { getDefaultCastingPolicyForAiProfile } from '../systems/builds/castingPolicyFit.js';
import { useContentStore } from './contentStore.js';
import { useGameStore } from './gameStore.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { useTechCollectionStore } from './techCollectionStore.js';
import { bumpVersion } from './versionCounters.js';
export const BASE_ACTIVE_SLOTS = 2;
export const BASE_PASSIVE_SLOTS = 1;
const createEmptyLoadout = (id, name, aiProfile, activeSlots, passiveSlots, castingPolicy) => ({
    id,
    name,
    aiProfile,
    castingPolicy: castingPolicy ?? getDefaultCastingPolicyForAiProfile(aiProfile),
    slots: {
        active: Array.from({ length: activeSlots }, () => ''),
        passive: Array.from({ length: passiveSlots }, () => ''),
        ultimate: null,
    },
});
const clampSlotCount = (value, minimum, maximum) => {
    if (!Number.isFinite(value))
        return minimum;
    return Math.min(maximum, Math.max(minimum, Math.floor(value)));
};
const normalizeSlots = (slots, nextCount) => {
    if (slots.length === nextCount)
        return [...slots];
    if (slots.length > nextCount)
        return slots.slice(0, nextCount);
    return [...slots, ...Array.from({ length: nextCount - slots.length }, () => '')];
};
const normalizeLoadoutSlots = (loadout) => ({
    active: normalizeSlots(loadout.slots?.active ?? [], SEMESTER_SLOT_CAPS.active),
    passive: normalizeSlots(loadout.slots?.passive ?? [], SEMESTER_SLOT_CAPS.passive),
    ultimate: loadout.slots?.ultimate ?? null,
});
const isPassive = (tech) => {
    if (!tech)
        return false;
    if (tech.type === 'passive')
        return true;
    return Array.isArray(tech.tags) && tech.tags.includes('passive');
};
const isUltimate = (tech) => tech?.type === 'ultimate';
const getRealmIndex = (realmIndex) => {
    if (typeof realmIndex === 'number')
        return realmIndex;
    return useGameStore.getState().realm.index ?? 0;
};
const getBonusSlots = (state) => ({
    activeBonusSlots: Math.max(0, Math.floor(state.activeSlots) - BASE_ACTIVE_SLOTS),
    passiveBonusSlots: Math.max(0, Math.floor(state.passiveSlots) - BASE_PASSIVE_SLOTS),
});
const buildProgressionSnapshotForState = (state, realmIndex) => {
    const resolvedRealmIndex = getRealmIndex(realmIndex);
    const { activeBonusSlots, passiveBonusSlots } = getBonusSlots(state);
    return resolveLoadoutProgressionSnapshot({
        realmIndex: resolvedRealmIndex,
        activeBonusSlots,
        passiveBonusSlots,
    });
};
const emitUnlockedSlotEvents = (previousUnlocked, nextUnlocked, slotType) => {
    if (nextUnlocked <= previousUnlocked)
        return;
    for (let slotIndex = previousUnlocked; slotIndex < nextUnlocked; slotIndex += 1) {
        GameEvents.emit({ type: 'techniques/slot_unlocked', payload: { slotType, slotIndex } });
    }
};
export const useTechniqueStore = create()(immer((set, get) => ({
    activeSlots: BASE_ACTIVE_SLOTS,
    passiveSlots: BASE_PASSIVE_SLOTS,
    loadoutVersion: 0,
    aiProfileVersion: 0,
    slotVersion: 0,
    loadouts: [
        createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
        createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
        createEmptyLoadout('loadout_3', 'Loadout 3', 'burst', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
    ],
    selectedLoadoutId: 'loadout_1',
    getSlotProgressionSnapshot: (realmIndex) => {
        return buildProgressionSnapshotForState(get(), realmIndex);
    },
    isSlotUnlocked: (slotType, slotIndex, realmIndex) => {
        const normalizedSlotIndex = Number.isFinite(slotIndex) ? Math.floor(slotIndex) : -1;
        if (normalizedSlotIndex < 0)
            return false;
        const snapshot = get().getSlotProgressionSnapshot(realmIndex);
        if (slotType === 'ultimate') {
            return normalizedSlotIndex === 0 && snapshot.unlocked.ultimate;
        }
        const unlockedCount = slotType === 'active'
            ? snapshot.unlocked.active
            : snapshot.unlocked.passive;
        return normalizedSlotIndex < unlockedCount;
    },
    getSlotUnlockRequirement: (slotType, slotIndex) => {
        if (get().isSlotUnlocked(slotType, slotIndex))
            return null;
        const requirement = getSlotUnlockRequirementForProgression({
            slotType,
            slotIndex,
            currentRealmIndex: getRealmIndex(),
            ...getBonusSlots(get()),
        });
        return requirement
            ? {
                realmIndex: requirement.realmIndex,
                realmName: requirement.realmName,
                reasonText: requirement.reasonText,
            }
            : null;
    },
    setSelectedLoadout: (id) => {
        if (get().selectedLoadoutId === id)
            return;
        const exists = get().loadouts.some((l) => l.id === id);
        if (!exists)
            return;
        set((state) => {
            state.selectedLoadoutId = id;
            state.loadoutVersion = bumpVersion(state.loadoutVersion);
        });
        GameEvents.emit({ type: 'techniques/loadout_changed', payload: { loadoutId: id } });
    },
    setSlotCounts: ({ active, passive }) => {
        const current = get();
        const currentRealmIndex = getRealmIndex();
        const previousSnapshot = buildProgressionSnapshotForState(current, currentRealmIndex);
        const nextActive = clampSlotCount(active ?? current.activeSlots, BASE_ACTIVE_SLOTS, SEMESTER_SLOT_CAPS.active);
        const nextPassive = clampSlotCount(passive ?? current.passiveSlots, BASE_PASSIVE_SLOTS, SEMESTER_SLOT_CAPS.passive);
        if (nextActive === current.activeSlots && nextPassive === current.passiveSlots)
            return;
        const nextSnapshot = buildProgressionSnapshotForState({ activeSlots: nextActive, passiveSlots: nextPassive }, currentRealmIndex);
        set((state) => {
            state.activeSlots = nextActive;
            state.passiveSlots = nextPassive;
            state.loadouts.forEach((loadout) => {
                loadout.slots.active = normalizeSlots(loadout.slots.active, SEMESTER_SLOT_CAPS.active);
                loadout.slots.passive = normalizeSlots(loadout.slots.passive, SEMESTER_SLOT_CAPS.passive);
            });
            state.slotVersion = bumpVersion(state.slotVersion);
            state.loadoutVersion = bumpVersion(state.loadoutVersion);
        });
        emitUnlockedSlotEvents(previousSnapshot.unlocked.active, nextSnapshot.unlocked.active, 'active');
        emitUnlockedSlotEvents(previousSnapshot.unlocked.passive, nextSnapshot.unlocked.passive, 'passive');
    },
    setAiProfile: (loadoutId, profile) => {
        const current = get().loadouts.find((l) => l.id === loadoutId);
        if (!current || current.aiProfile === profile)
            return;
        set((state) => {
            const loadout = state.loadouts.find((l) => l.id === loadoutId);
            if (!loadout)
                return;
            loadout.aiProfile = profile;
            state.aiProfileVersion = bumpVersion(state.aiProfileVersion);
        });
    },
    setCastingPolicy: (loadoutId, policy) => {
        const current = get().loadouts.find((l) => l.id === loadoutId);
        if (!current || current.castingPolicy === policy)
            return;
        set((state) => {
            const loadout = state.loadouts.find((l) => l.id === loadoutId);
            if (!loadout)
                return;
            loadout.castingPolicy = policy;
            state.aiProfileVersion = bumpVersion(state.aiProfileVersion);
        });
    },
    equipTechnique: (slotType, slotIndex, techId, loadoutId) => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
        if (!loadout) {
            GameEvents.emit({
                type: 'techniques/equip_failed',
                payload: { techniqueId: techId, slotType, slotIndex, reason: 'invalid_loadout' },
            });
            return { ok: false, reason: 'invalid_slot', message: 'Unknown loadout' };
        }
        const progression = get().getSlotProgressionSnapshot();
        const unlocked = get().isSlotUnlocked(slotType, slotIndex);
        const displayedLimit = slotType === 'active'
            ? progression.displayed.active
            : slotType === 'passive'
                ? progression.displayed.passive
                : 1;
        if (slotIndex < 0 || slotIndex >= displayedLimit || (slotType === 'ultimate' && slotIndex !== 0)) {
            GameEvents.emit({
                type: 'techniques/equip_failed',
                payload: { techniqueId: techId, slotType, slotIndex, reason: 'invalid_slot' },
            });
            return {
                ok: false,
                reason: 'invalid_slot',
                message: 'That slot does not exist.',
            };
        }
        if (!unlocked) {
            const requirement = get().getSlotUnlockRequirement(slotType, slotIndex);
            GameEvents.emit({
                type: 'techniques/equip_failed',
                payload: { techniqueId: techId, slotType, slotIndex, reason: 'locked' },
            });
            return {
                ok: false,
                reason: 'locked',
                message: 'This slot is locked.',
                unlockAt: requirement ? { realmIndex: requirement.realmIndex, realmName: requirement.realmName } : undefined,
            };
        }
        if (techId !== '') {
            const unlockedTech = useTechCollectionStore.getState().hasTech(techId);
            if (!unlockedTech) {
                GameEvents.emit({
                    type: 'techniques/equip_failed',
                    payload: { techniqueId: techId, slotType, slotIndex, reason: 'missing_tech' },
                });
                return { ok: false, reason: 'missing_tech', message: 'Technique not learned yet.' };
            }
            const techniqueDef = useContentStore.getState().maps.techniquesById?.[techId];
            if (!techniqueDef) {
                console.warn(`[TechniqueStore] Attempted to equip unknown technique: ${techId}`);
                GameEvents.emit({
                    type: 'techniques/equip_failed',
                    payload: { techniqueId: techId, slotType, slotIndex, reason: 'missing_tech' },
                });
                return { ok: false, reason: 'missing_tech', message: 'Technique data missing.' };
            }
            const isPassiveTech = isPassive(techniqueDef);
            const isUltimateTech = isUltimate(techniqueDef);
            const isActiveTech = !isPassiveTech && !isUltimateTech;
            const typeLabel = isUltimateTech ? 'Ultimate' : isPassiveTech ? 'Passive' : 'Active';
            const article = ['A', 'E', 'I', 'O', 'U'].includes(typeLabel[0] ?? '') ? 'an' : 'a';
            if (slotType === 'active' && !isActiveTech) {
                GameEvents.emit({
                    type: 'techniques/equip_failed',
                    payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
                });
                return {
                    ok: false,
                    reason: 'wrong_type',
                    message: `This technique is ${typeLabel}. It must be equipped in ${article} ${typeLabel} slot.`,
                };
            }
            if (slotType === 'passive' && !isPassiveTech) {
                GameEvents.emit({
                    type: 'techniques/equip_failed',
                    payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
                });
                return {
                    ok: false,
                    reason: 'wrong_type',
                    message: `This technique is ${typeLabel}. It must be equipped in ${article} ${typeLabel} slot.`,
                };
            }
            if (slotType === 'ultimate' && !isUltimateTech) {
                GameEvents.emit({
                    type: 'techniques/equip_failed',
                    payload: { techniqueId: techId, slotType, slotIndex, reason: 'wrong_type' },
                });
                return {
                    ok: false,
                    reason: 'wrong_type',
                    message: `This technique is ${typeLabel}. It must be equipped in the ${typeLabel} slot.`,
                };
            }
        }
        const previousTechId = slotType === 'active'
            ? loadout.slots.active[slotIndex]
            : slotType === 'passive'
                ? loadout.slots.passive[slotIndex]
                : loadout.slots.ultimate ?? '';
        if (previousTechId === techId) {
            return { ok: true };
        }
        set((draft) => {
            const targetLoadout = draft.loadouts.find((l) => l.id === (loadoutId ?? draft.selectedLoadoutId));
            if (!targetLoadout)
                return;
            targetLoadout.slots.active = normalizeSlots(targetLoadout.slots.active, SEMESTER_SLOT_CAPS.active);
            targetLoadout.slots.passive = normalizeSlots(targetLoadout.slots.passive, SEMESTER_SLOT_CAPS.passive);
            if (techId !== '') {
                targetLoadout.slots.active = targetLoadout.slots.active.map((id, idx) => slotType === 'active' && idx === slotIndex ? id : id === techId ? '' : id);
                targetLoadout.slots.passive = targetLoadout.slots.passive.map((id, idx) => slotType === 'passive' && idx === slotIndex ? id : id === techId ? '' : id);
                if (targetLoadout.slots.ultimate === techId) {
                    targetLoadout.slots.ultimate = null;
                }
            }
            if (slotType === 'active') {
                targetLoadout.slots.active[slotIndex] = techId;
            }
            else if (slotType === 'passive') {
                targetLoadout.slots.passive[slotIndex] = techId;
            }
            else {
                targetLoadout.slots.ultimate = techId || null;
            }
            draft.loadoutVersion = bumpVersion(draft.loadoutVersion);
        });
        GameEvents.emit({
            type: 'techniques/equipped',
            payload: { techniqueId: techId, slot: slotIndex, slotType },
        });
        const action = techId === ''
            ? 'unequip'
            : previousTechId && previousTechId !== '' && previousTechId !== techId
                ? 'swap'
                : 'equip';
        GameEvents.emit({
            type: 'techniques/equip_changed',
            payload: { techniqueId: techId, slotType, slotIndex, action },
        });
        return { ok: true };
    },
    hydrateFromSave: (data) => {
        if (!data || !Array.isArray(data.loadouts) || data.loadouts.length === 0)
            return;
        const normalizedLoadouts = data.loadouts.map((loadout) => ({
            ...loadout,
            castingPolicy: loadout.castingPolicy ?? getDefaultCastingPolicyForAiProfile(loadout.aiProfile),
            slots: normalizeLoadoutSlots(loadout),
        }));
        const selectedExists = normalizedLoadouts.some((l) => l.id === data.selectedLoadoutId);
        set((state) => {
            state.loadouts = normalizedLoadouts;
            state.selectedLoadoutId = selectedExists ? data.selectedLoadoutId : normalizedLoadouts[0].id;
            state.loadoutVersion = bumpVersion(state.loadoutVersion);
            state.aiProfileVersion = bumpVersion(state.aiProfileVersion);
        });
    },
    resetLoadouts: () => {
        set(() => ({
            loadouts: [
                createEmptyLoadout('loadout_1', 'Loadout 1', 'balanced', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
                createEmptyLoadout('loadout_2', 'Loadout 2', 'survivor', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
                createEmptyLoadout('loadout_3', 'Loadout 3', 'burst', SEMESTER_SLOT_CAPS.active, SEMESTER_SLOT_CAPS.passive),
            ],
            selectedLoadoutId: 'loadout_1',
            activeSlots: BASE_ACTIVE_SLOTS,
            passiveSlots: BASE_PASSIVE_SLOTS,
            loadoutVersion: 0,
            aiProfileVersion: 0,
            slotVersion: 0,
        }));
    },
    getSelectedLoadout: () => {
        const state = get();
        return state.loadouts.find((l) => l.id === state.selectedLoadoutId);
    },
    getSelectedAiProfile: () => {
        return get().getSelectedLoadout()?.aiProfile ?? 'balanced';
    },
    getSelectedCastingPolicy: () => {
        return get().getSelectedLoadout()?.castingPolicy ?? 'balanced';
    },
    getEquippedTechIds: (loadoutId) => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
        if (!loadout) {
            return {
                active: Array.from({ length: SEMESTER_SLOT_CAPS.active }, () => ''),
                passive: Array.from({ length: SEMESTER_SLOT_CAPS.passive }, () => ''),
                ultimate: null,
            };
        }
        const normalizedSlots = normalizeLoadoutSlots(loadout);
        return {
            active: normalizedSlots.active,
            passive: normalizedSlots.passive,
            ultimate: normalizedSlots.ultimate,
        };
    },
    getCombatEquippedTechIds: (loadoutId) => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === (loadoutId ?? state.selectedLoadoutId));
        if (!loadout) {
            return { active: [], passive: [], ultimate: null };
        }
        const snapshot = buildLoadoutSnapshotFromLoadout({
            loadout: {
                id: loadout.id,
                aiProfile: loadout.aiProfile,
                castingPolicy: loadout.castingPolicy,
                slots: normalizeLoadoutSlots(loadout),
            },
            realmIndex: getRealmIndex(),
            ...getBonusSlots(state),
        });
        return {
            active: snapshot.equipped.active,
            passive: snapshot.equipped.passive,
            ultimate: snapshot.equipped.ultimate,
        };
    },
})));
