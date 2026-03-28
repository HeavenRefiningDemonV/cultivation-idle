export const CITY_ARRIVAL_LESSON_BY_ID = {
    city_pinewind_hamlet: 'Learn the loop.',
    city_stonecrag_town: 'Forge begins to matter.',
    city_spirit_cavern_city: 'Build correction starts to matter.',
    city_lotusford: 'Survival prep and reagents matter.',
    city_ironpeak_bastion: 'Final convergence city.',
};
export const CITY_ARRIVAL_QUICK_OPEN_ORDER = ['outskirts', 'ruins', 'gateTrial'];
export const CITY_ARRIVAL_QUICK_OPEN_LABELS = {
    outskirts: 'Open Outskirts',
    ruins: 'Open Ruins',
    gateTrial: 'Open Gate Trial',
};
export function getCityArrivalLesson(cityId) {
    return CITY_ARRIVAL_LESSON_BY_ID[cityId] ?? null;
}
export function getCityArrivalQuickOpenModules(modules) {
    if (!Array.isArray(modules) || modules.length === 0)
        return [];
    const available = new Set(modules.filter((moduleKey) => typeof moduleKey === 'string' && moduleKey.length > 0));
    return CITY_ARRIVAL_QUICK_OPEN_ORDER.filter((moduleKey) => available.has(moduleKey));
}
export function getCityArrivalQuickOpenLabel(moduleKey) {
    return CITY_ARRIVAL_QUICK_OPEN_LABELS[moduleKey] ?? null;
}
export function normalizeAcknowledgedArrivalCityIds(args) {
    const { incoming, unlockedCityIds, validCityIds, fieldWasPresent } = args;
    const canonicalUnlocked = unlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) == index);
    const validUnlocked = canonicalUnlocked.filter((cityId) => validCityIds.includes(cityId));
    if (!fieldWasPresent) {
        return [...validUnlocked];
    }
    const incomingIds = Array.isArray(incoming)
        ? incoming.filter((cityId) => typeof cityId === 'string')
        : [];
    const incomingSet = new Set(incomingIds.filter((cityId) => validUnlocked.includes(cityId)));
    return validUnlocked.filter((cityId) => incomingSet.has(cityId));
}
export function getQueuedCityArrivalCandidate(args) {
    const { unlockedCityIds, acknowledgedArrivalCityIds, citiesById, preferredCityId } = args;
    const unlocked = unlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) === index && cityId in citiesById);
    const acknowledged = new Set(acknowledgedArrivalCityIds);
    if (preferredCityId && unlocked.includes(preferredCityId) && !acknowledged.has(preferredCityId)) {
        return preferredCityId;
    }
    const candidates = unlocked
        .filter((cityId) => !acknowledged.has(cityId))
        .sort((left, right) => (citiesById[left]?.index ?? -1) - (citiesById[right]?.index ?? -1));
    return candidates.at(-1) ?? null;
}
