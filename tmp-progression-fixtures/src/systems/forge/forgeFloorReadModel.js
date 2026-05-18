const GATE_RECOMMENDATIONS = {
    1: { gateIndex: 1, weaponRefine: 3, accessoryRefine: 2, temperSuccesses: 1, runeCountRecommended: 0, runeCountLabel: 'No rune required yet' },
    2: { gateIndex: 2, weaponRefine: 5, accessoryRefine: 4, temperSuccesses: 2, runeCountRecommended: 0, runeCountLabel: 'No rune required yet' },
    3: { gateIndex: 3, weaponRefine: 7, accessoryRefine: 6, temperSuccesses: 3, runeCountRecommended: 1, runeCountLabel: '1 rune recommended' },
    4: { gateIndex: 4, weaponRefine: 9, accessoryRefine: 8, temperSuccesses: 4, runeCountRecommended: 2, runeCountLabel: '2 runes recommended' },
    5: { gateIndex: 5, weaponRefine: 10, accessoryRefine: 10, temperSuccesses: 5, runeCountRecommended: 3, runeCountLabel: '2–3 runes recommended' },
};
function getNextGateRecommendation(input) {
    const fallbackGateIndex = input.cityIndex === null || !Number.isFinite(input.cityIndex)
        ? null
        : input.cityIndex + 1;
    const gateIndex = input.currentGateIndex ?? fallbackGateIndex;
    if (gateIndex === null || !Number.isFinite(gateIndex))
        return null;
    const recommendation = GATE_RECOMMENDATIONS[Math.max(1, Math.min(5, gateIndex))] ?? null;
    if (!recommendation)
        return null;
    return {
        ...recommendation,
        gateLabel: input.gateLabel ?? undefined,
        source: input.gateContextSource ?? (input.currentGateIndex === null || input.currentGateIndex === undefined ? 'fallback-city' : undefined),
    };
}
function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}
export function collectSocketedRuneIds(unlockedTechs) {
    return Object.values(unlockedTechs).flatMap((entry) => (entry.runes ?? []).filter((runeId) => Boolean(runeId)));
}
export function buildForgeFloorReadModel(input) {
    const runeInventoryCount = sum(Object.values(input.inventoryRuneCounts));
    const runeSocketedCount = input.socketedRuneIds.length;
    const runeTotalCount = runeInventoryCount + runeSocketedCount;
    const runeUniqueCount = new Set([
        ...Object.keys(input.inventoryRuneCounts).filter((id) => input.inventoryRuneCounts[id] > 0),
        ...input.socketedRuneIds,
    ]).size;
    const temperSuccessTotal = sum(Object.values(input.temperSuccessesBySlot));
    return {
        weaponRefineFloor: input.weaponRefineFloor,
        accessoryRefineFloor: input.accessoryRefineFloor,
        temperSuccessTotal,
        temperSuccessesBySlot: input.temperSuccessesBySlot,
        runeInventoryCount,
        runeSocketedCount,
        runeTotalCount,
        runeUniqueCount,
        runeSummaryLabel: runeTotalCount <= 0
            ? 'No crafted runes yet'
            : `${runeTotalCount} crafted · ${runeSocketedCount} socketed · ${runeUniqueCount} families`,
        nextGateRecommendation: getNextGateRecommendation(input),
    };
}
