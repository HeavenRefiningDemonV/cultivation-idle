import { useGameStore } from '../../stores/gameStore.js';
import { BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, useTechniqueStore } from '../../stores/techniqueStore.js';
import { resolveLoadoutProgressionSnapshot, } from './loadoutProgressionContract.js';
const DISPLAYED_ACTIVE_SLOTS = 4;
const DISPLAYED_PASSIVE_SLOTS = 3;
const normalizeSlotArray = (slots, length) => {
    const safe = Array.isArray(slots) ? slots.slice(0, length) : [];
    while (safe.length < length) {
        safe.push('');
    }
    return safe;
};
const normalizeUltimateSlot = (ultimate) => {
    return typeof ultimate === 'string' ? ultimate : null;
};
export function buildLoadoutSnapshotFromLoadout(input) {
    const progression = resolveLoadoutProgressionSnapshot({
        realmIndex: input.realmIndex,
        activeBonusSlots: input.activeBonusSlots,
        passiveBonusSlots: input.passiveBonusSlots,
    });
    const activeSlots = normalizeSlotArray(input.loadout.slots.active, DISPLAYED_ACTIVE_SLOTS);
    const passiveSlots = normalizeSlotArray(input.loadout.slots.passive, DISPLAYED_PASSIVE_SLOTS);
    const ultimateSlot = normalizeUltimateSlot(input.loadout.slots.ultimate);
    const equippedActive = activeSlots
        .slice(0, progression.unlocked.active)
        .filter((techId) => Boolean(techId));
    const equippedPassive = passiveSlots
        .slice(0, progression.unlocked.passive)
        .filter((techId) => Boolean(techId));
    const equippedUltimate = progression.unlocked.ultimate && ultimateSlot ? ultimateSlot : null;
    const emptyUnlockedSlots = [];
    for (let slotIndex = 0; slotIndex < progression.unlocked.active; slotIndex += 1) {
        if (!activeSlots[slotIndex]) {
            emptyUnlockedSlots.push({ slotType: 'active', slotIndex });
        }
    }
    for (let slotIndex = 0; slotIndex < progression.unlocked.passive; slotIndex += 1) {
        if (!passiveSlots[slotIndex]) {
            emptyUnlockedSlots.push({ slotType: 'passive', slotIndex });
        }
    }
    if (progression.unlocked.ultimate && !ultimateSlot) {
        emptyUnlockedSlots.push({ slotType: 'ultimate', slotIndex: 0 });
    }
    const parkedLockedAssignments = [];
    for (let slotIndex = progression.unlocked.active; slotIndex < DISPLAYED_ACTIVE_SLOTS; slotIndex += 1) {
        const techId = activeSlots[slotIndex];
        if (techId)
            parkedLockedAssignments.push({ slotType: 'active', slotIndex, techId });
    }
    for (let slotIndex = progression.unlocked.passive; slotIndex < DISPLAYED_PASSIVE_SLOTS; slotIndex += 1) {
        const techId = passiveSlots[slotIndex];
        if (techId)
            parkedLockedAssignments.push({ slotType: 'passive', slotIndex, techId });
    }
    if (!progression.unlocked.ultimate && ultimateSlot) {
        parkedLockedAssignments.push({ slotType: 'ultimate', slotIndex: 0, techId: ultimateSlot });
    }
    return {
        loadoutId: input.loadout.id,
        aiProfile: input.loadout.aiProfile,
        castingPolicy: input.loadout.castingPolicy,
        displayed: { ...progression.displayed },
        unlocked: { ...progression.unlocked },
        equipped: {
            active: equippedActive,
            passive: equippedPassive,
            ultimate: equippedUltimate,
        },
        filled: {
            active: equippedActive.length,
            passive: equippedPassive.length,
            ultimate: equippedUltimate ? 1 : 0,
        },
        emptyUnlockedCount: emptyUnlockedSlots.length,
        emptyUnlockedSlots,
        parkedLockedAssignments,
    };
}
export function buildLoadoutSnapshot(loadoutId) {
    const techniqueState = useTechniqueStore.getState();
    const gameState = useGameStore.getState();
    const activeBonusSlots = Math.max(0, Math.floor(techniqueState.activeSlots) - BASE_ACTIVE_SLOTS);
    const passiveBonusSlots = Math.max(0, Math.floor(techniqueState.passiveSlots) - BASE_PASSIVE_SLOTS);
    const requested = loadoutId
        ? techniqueState.loadouts.find((loadout) => loadout.id === loadoutId)
        : undefined;
    const selected = techniqueState.loadouts.find((loadout) => loadout.id === techniqueState.selectedLoadoutId);
    const fallback = techniqueState.loadouts[0];
    const resolvedLoadout = requested ?? selected ?? fallback ?? {
        id: loadoutId ?? 'default',
        aiProfile: 'balanced',
        castingPolicy: 'balanced',
        slots: { active: [], passive: [], ultimate: null },
    };
    return buildLoadoutSnapshotFromLoadout({
        loadout: resolvedLoadout,
        realmIndex: gameState.realm.index,
        activeBonusSlots,
        passiveBonusSlots,
    });
}
