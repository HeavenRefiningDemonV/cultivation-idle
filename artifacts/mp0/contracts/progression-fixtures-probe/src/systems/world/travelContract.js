import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
const COMBAT_ACTIVITY_TYPES = new Set(['outskirts', 'trial', 'ruins']);
const LIVE_CITY_ID_SET = new Set(SEMESTER_SLICE_CONTRACT.liveCityIds);
const byAscendingCityIndex = (left, right) => (left.index ?? 0) - (right.index ?? 0);
export function buildWorldCitySelectorEntries({ cities, currentCityId, unlockedCityIds, requirementTextByCityId, }) {
    const liveCities = cities
        .filter((city) => LIVE_CITY_ID_SET.has(city.id))
        .sort(byAscendingCityIndex);
    const unlockedCityIdSet = new Set(unlockedCityIds);
    const currentEntry = liveCities.find((city) => city.id === currentCityId) ?? null;
    const otherUnlocked = liveCities.filter((city) => city.id !== currentCityId && unlockedCityIdSet.has(city.id));
    const locked = liveCities.filter((city) => city.id !== currentCityId && !unlockedCityIdSet.has(city.id));
    return [currentEntry, ...otherUnlocked, ...locked]
        .filter((city) => Boolean(city))
        .map((city) => {
        const isUnlocked = unlockedCityIdSet.has(city.id);
        return {
            city,
            isUnlocked,
            isCurrent: city.id === currentCityId,
            disabled: !isUnlocked,
            requirementText: requirementTextByCityId[city.id] ?? null,
        };
    });
}
export function resolveFallbackCurrentCityId({ cities, currentCityId, unlockedCityIds, }) {
    const validLiveCities = cities
        .filter((city) => LIVE_CITY_ID_SET.has(city.id))
        .sort(byAscendingCityIndex);
    const validLiveCityIdSet = new Set(validLiveCities.map((city) => city.id));
    const unlockedValidLiveCities = validLiveCities.filter((city) => unlockedCityIds.includes(city.id));
    if (currentCityId && validLiveCityIdSet.has(currentCityId) && unlockedValidLiveCities.some((city) => city.id === currentCityId)) {
        return currentCityId;
    }
    return unlockedValidLiveCities.at(-1)?.id ?? validLiveCities[0]?.id ?? null;
}
export function getDefaultModuleForWorldCity(city) {
    if (city.modules.includes('outskirts'))
        return 'outskirts';
    return city.modules[0] ?? null;
}
export function getWorldTravelGuard({ targetCityId, currentCityId, unlockedCityIds, liveCityIds, inCombat, activeActivityType, combatPresentationMode, }) {
    if (!targetCityId) {
        return { allowed: false, reason: 'invalid-city' };
    }
    const liveCityIdSet = new Set(liveCityIds);
    if (!liveCityIdSet.has(targetCityId)) {
        return { allowed: false, reason: 'not-in-live-slice' };
    }
    if (!unlockedCityIds.includes(targetCityId)) {
        return { allowed: false, reason: 'city-locked' };
    }
    if (targetCityId === currentCityId) {
        return { allowed: true, reason: 'none' };
    }
    if (inCombat) {
        return { allowed: false, reason: 'active-combat' };
    }
    if (activeActivityType && COMBAT_ACTIVITY_TYPES.has(activeActivityType)) {
        return { allowed: false, reason: 'combat-activity' };
    }
    if (combatPresentationMode !== 'hidden') {
        return { allowed: false, reason: 'combat-presentation' };
    }
    return { allowed: true, reason: 'none' };
}
export function getWorldTravelBlockMessage(reason) {
    switch (reason) {
        case 'city-locked':
            return 'That city is still locked.';
        case 'active-combat':
            return 'Finish the current fight before traveling.';
        case 'combat-activity':
            return 'Leave the current combat activity before traveling.';
        case 'combat-presentation':
            return 'Close the combat view before traveling.';
        case 'not-in-live-slice':
            return 'That city is not in the current semester.';
        case 'invalid-city':
            return 'That city is unavailable.';
        case 'none':
        default:
            return '';
    }
}
