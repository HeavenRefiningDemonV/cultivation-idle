const matchesKeyFamily = (key, families) => families.some((family) => key === family || key.startsWith(`${family}.`));
const PERMANENT_KEY_FAMILIES = [
    'prestigeState.totalAP',
    'prestigeState.lifetimeAP',
    'prestigeState.prestigeCount',
    'prestigeState.purchasesById',
    'prestigeState.prestigeRuns',
];
const PER_LIFE_KEY_FAMILIES = [
    'gameState.realm',
    'gameState.qi',
    'gameState.selectedPath',
    'gameState.pathPerks',
    'cityState.unlockedCityIds',
    'cityState.currentCityId',
    'trialState.progressByTrialId',
    'ruinsState.progressByRuinId',
    'inventoryState.items',
    'inventoryState.currencies',
    'equipmentState',
    'buffState',
    'bountyState',
    'activityState',
    'outskirtsState',
    'shopState',
    'zoneState',
    'manualSatchelState',
    'techCollectionState',
    'professionState.alchemyQueue',
    'professionState.talismanQueue',
    'professionState.forgeQueue',
    'expeditionState.active',
    'manualPavilionState.stockByPavilionId',
];
const HYBRID_KEY_FAMILIES = [
    'cultivationState.unlockedHeartLawIds',
    'heartLawState.unlockedHeartLawIds',
    'techniqueState.loadouts',
    'medicinePouchState.slots',
    'craftSessionState.modeByStation',
    'expeditionState.slots',
    'masteryRetentionCarryOver',
];
export const createResetClassificationHooks = () => ({
    classifyKey: (key) => {
        if (matchesKeyFamily(key, PERMANENT_KEY_FAMILIES))
            return 'permanent';
        if (matchesKeyFamily(key, PER_LIFE_KEY_FAMILIES))
            return 'per_life';
        if (matchesKeyFamily(key, HYBRID_KEY_FAMILIES))
            return 'hybrid';
        const normalized = key.toLowerCase();
        if (normalized.includes('retention') || normalized.includes('carryover'))
            return 'hybrid';
        if (normalized.includes('prestige') && (normalized.includes('totalap') || normalized.includes('lifetimeap')))
            return 'permanent';
        return 'unknown';
    },
});
