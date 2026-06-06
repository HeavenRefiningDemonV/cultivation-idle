import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import { getCityUnlockForRealm, getContentCapRealm, getProgressionContract, } from '../contract/index.js';
import { getLiveRealmNameById } from './liveRealmProjection.js';
const getContract = (content) => {
    if (!content)
        return null;
    try {
        return getProgressionContract(adaptProgressionAuthoredContent(content));
    }
    catch (error) {
        console.warn('[CityProgression] Failed to load progression contract', error);
        return null;
    }
};
const sortUnlocksByRealm = (contract, unlocks) => [...unlocks].sort((a, b) => {
    const realmDelta = (contract.majorRealms[a.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER) -
        (contract.majorRealms[b.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER);
    if (realmDelta !== 0)
        return realmDelta;
    return a.cityId.localeCompare(b.cityId);
});
export const getCityUnlockForRealmEntry = (contract, majorRealmId) => getCityUnlockForRealm(contract, majorRealmId);
export const getUnlockedCitiesForEnteredRealms = (contract, enteredRealmIds) => {
    const entered = new Set(enteredRealmIds);
    return sortUnlocksByRealm(contract, contract.cityUnlocks.filter((unlock) => entered.has(unlock.unlockOnRealmEntry))).map((unlock) => unlock.cityId);
};
export const isCityProgressionCapRealm = (contract, majorRealmId) => getContentCapRealm(contract) === majorRealmId && getCityUnlockForRealmEntry(contract, majorRealmId) === null;
export const getCityUnlockRequirementText = (contract, cityId) => {
    const unlock = contract.cityUnlocks.find((entry) => entry.cityId === cityId);
    if (!unlock)
        return null;
    return `Reach ${getLiveRealmNameById(unlock.unlockOnRealmEntry)}`;
};
export const syncCityStateToRealmEntry = ({ contract, majorRealmId, unlockedCityIds, }) => {
    const targetRealmIndex = contract.majorRealms[majorRealmId]?.index ?? -1;
    const unlockedByRealm = sortUnlocksByRealm(contract, contract.cityUnlocks.filter((unlock) => (contract.majorRealms[unlock.unlockOnRealmEntry]?.index ?? Number.MAX_SAFE_INTEGER) <= targetRealmIndex));
    const merged = new Set(unlockedCityIds);
    const newlyUnlockedCityIds = [];
    for (const unlock of unlockedByRealm) {
        if (merged.has(unlock.cityId))
            continue;
        merged.add(unlock.cityId);
        newlyUnlockedCityIds.push(unlock.cityId);
    }
    return {
        unlockedCityIds: unlockedByRealm.map((unlock) => unlock.cityId),
        newlyUnlockedCityIds,
        currentCityId: newlyUnlockedCityIds.at(-1) ?? null,
        cityUnlock: getCityUnlockForRealmEntry(contract, majorRealmId),
        isCapRealm: isCityProgressionCapRealm(contract, majorRealmId),
    };
};
export const getRuntimeCityUnlockForRealmEntry = (content, majorRealmId) => {
    const contract = getContract(content);
    if (!contract)
        return null;
    return getCityUnlockForRealmEntry(contract, majorRealmId);
};
export const getRuntimeUnlockedCitiesForEnteredRealms = (content, enteredRealmIds) => {
    const contract = getContract(content);
    if (!contract)
        return [];
    return getUnlockedCitiesForEnteredRealms(contract, enteredRealmIds);
};
export const isRuntimeCityProgressionCapRealm = (content, majorRealmId) => {
    const contract = getContract(content);
    if (!contract)
        return false;
    return isCityProgressionCapRealm(contract, majorRealmId);
};
export const syncRuntimeCityStateToRealmEntry = (content, majorRealmId, unlockedCityIds) => {
    const contract = getContract(content);
    if (!contract) {
        return {
            unlockedCityIds: [...unlockedCityIds],
            newlyUnlockedCityIds: [],
            currentCityId: null,
            cityUnlock: null,
            isCapRealm: false,
        };
    }
    return syncCityStateToRealmEntry({ contract, majorRealmId, unlockedCityIds });
};
