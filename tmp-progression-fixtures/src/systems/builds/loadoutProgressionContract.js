import { clampRealmIndexToSemesterSlice, getLiveRealmByIndex } from '../progression/runtime/index.js';
const ACTIVE_SLOT_LIMIT = 4;
const PASSIVE_SLOT_LIMIT = 3;
const ULTIMATE_SLOT_INDEX = 0;
const normalizeBonusSlots = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(0, Math.floor(value ?? 0));
};
const createRequirement = (realmIndex) => {
    const realm = getLiveRealmByIndex(realmIndex);
    return {
        majorRealmId: realm.id,
        realmIndex: realm.index,
        realmName: realm.name,
        reasonText: `Unlocks at: ${realm.name}`,
    };
};
const findUnlockRequirement = (input) => {
    const { slotType, slotIndex, activeBonusSlots, passiveBonusSlots } = input;
    if (slotType === 'ultimate') {
        const rowIndex = SEMESTER_SLOT_PROGRESSION.findIndex((row) => row.ultimate);
        return rowIndex >= 0 ? createRequirement(rowIndex) : null;
    }
    const targetCount = slotIndex + 1;
    const rowIndex = SEMESTER_SLOT_PROGRESSION.findIndex((row) => {
        const unlockedCount = slotType === 'active'
            ? Math.min(SEMESTER_SLOT_CAPS.active, row.active + activeBonusSlots)
            : Math.min(SEMESTER_SLOT_CAPS.passive, row.passive + passiveBonusSlots);
        return unlockedCount >= targetCount;
    });
    return rowIndex >= 0 ? createRequirement(rowIndex) : null;
};
export const LOADOUT_PROGRESSION_ORDER = Object.freeze([
    'qi_condensation',
    'foundation_establishment',
    'core_formation',
    'nascent_soul',
    'soul_formation',
    'spirit_severing',
]);
export const SEMESTER_SLOT_PROGRESSION = Object.freeze([
    Object.freeze({ majorRealmId: 'qi_condensation', active: 2, passive: 1, ultimate: false }),
    Object.freeze({ majorRealmId: 'foundation_establishment', active: 3, passive: 1, ultimate: false }),
    Object.freeze({ majorRealmId: 'core_formation', active: 3, passive: 2, ultimate: false }),
    Object.freeze({ majorRealmId: 'nascent_soul', active: 4, passive: 2, ultimate: false }),
    Object.freeze({ majorRealmId: 'soul_formation', active: 4, passive: 2, ultimate: true }),
    Object.freeze({ majorRealmId: 'spirit_severing', active: 4, passive: 3, ultimate: true }),
]);
export const SEMESTER_SLOT_CAPS = Object.freeze({
    active: ACTIVE_SLOT_LIMIT,
    passive: PASSIVE_SLOT_LIMIT,
});
export function getLoadoutProgressionForRealm(majorRealmId) {
    return SEMESTER_SLOT_PROGRESSION.find((row) => row.majorRealmId === majorRealmId)
        ?? SEMESTER_SLOT_PROGRESSION[0];
}
export function getLoadoutProgressionForRealmIndex(realmIndex) {
    const clampedRealmIndex = clampRealmIndexToSemesterSlice(realmIndex);
    return getLoadoutProgressionForRealm(getLiveRealmByIndex(clampedRealmIndex).id);
}
export function resolveLoadoutProgressionSnapshot(input) {
    const realmIndex = clampRealmIndexToSemesterSlice(input?.realmIndex ?? 0);
    const activeBonusSlots = normalizeBonusSlots(input?.activeBonusSlots);
    const passiveBonusSlots = normalizeBonusSlots(input?.passiveBonusSlots);
    const row = getLoadoutProgressionForRealmIndex(realmIndex);
    const unlocked = {
        active: Math.min(SEMESTER_SLOT_CAPS.active, row.active + activeBonusSlots),
        passive: Math.min(SEMESTER_SLOT_CAPS.passive, row.passive + passiveBonusSlots),
        ultimate: row.ultimate,
    };
    const activeRequirements = Array.from({ length: ACTIVE_SLOT_LIMIT }, (_, slotIndex) => {
        if (slotIndex < unlocked.active)
            return [slotIndex, null];
        return [
            slotIndex,
            findUnlockRequirement({
                slotType: 'active',
                slotIndex,
                activeBonusSlots,
                passiveBonusSlots,
            }),
        ];
    });
    const passiveRequirements = Array.from({ length: PASSIVE_SLOT_LIMIT }, (_, slotIndex) => {
        if (slotIndex < unlocked.passive)
            return [slotIndex, null];
        return [
            slotIndex,
            findUnlockRequirement({
                slotType: 'passive',
                slotIndex,
                activeBonusSlots,
                passiveBonusSlots,
            }),
        ];
    });
    return {
        displayed: { active: SEMESTER_SLOT_CAPS.active, passive: SEMESTER_SLOT_CAPS.passive },
        unlocked,
        unlockRequirements: {
            active: Object.fromEntries(activeRequirements),
            passive: Object.fromEntries(passiveRequirements),
            ultimate: unlocked.ultimate
                ? null
                : findUnlockRequirement({
                    slotType: 'ultimate',
                    slotIndex: ULTIMATE_SLOT_INDEX,
                    activeBonusSlots,
                    passiveBonusSlots,
                }),
        },
    };
}
export function getSlotUnlockRequirementForProgression(input) {
    const activeBonusSlots = normalizeBonusSlots(input.activeBonusSlots);
    const passiveBonusSlots = normalizeBonusSlots(input.passiveBonusSlots);
    const slotIndex = Number.isFinite(input.slotIndex) ? Math.floor(input.slotIndex) : -1;
    const isValid = ((input.slotType === 'active' && slotIndex >= 0 && slotIndex < ACTIVE_SLOT_LIMIT)
        || (input.slotType === 'passive' && slotIndex >= 0 && slotIndex < PASSIVE_SLOT_LIMIT)
        || (input.slotType === 'ultimate' && slotIndex === ULTIMATE_SLOT_INDEX));
    if (!isValid)
        return null;
    if (typeof input.currentRealmIndex === 'number') {
        const snapshot = resolveLoadoutProgressionSnapshot({
            realmIndex: input.currentRealmIndex,
            activeBonusSlots,
            passiveBonusSlots,
        });
        if (input.slotType === 'ultimate') {
            return snapshot.unlocked.ultimate ? null : snapshot.unlockRequirements.ultimate;
        }
        return snapshot.unlockRequirements[input.slotType][slotIndex] ?? null;
    }
    const earliestRequirement = findUnlockRequirement({
        slotType: input.slotType,
        slotIndex,
        activeBonusSlots,
        passiveBonusSlots,
    });
    if (!earliestRequirement)
        return null;
    const startingSnapshot = resolveLoadoutProgressionSnapshot({
        realmIndex: 0,
        activeBonusSlots,
        passiveBonusSlots,
    });
    if (input.slotType === 'ultimate') {
        return startingSnapshot.unlocked.ultimate ? null : earliestRequirement;
    }
    return slotIndex < startingSnapshot.unlocked[input.slotType] ? null : earliestRequirement;
}
