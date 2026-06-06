import { SEMESTER_0_CITY_UNLOCKS } from '../systems/progression/contract/cityUnlocks.js';
import { getLiveRealmByIndex, syncRuntimeCityStateToRealmEntry } from '../systems/progression/runtime/index.js';
import { LIVE_CITY_MODULE_ORDER } from '../systems/world/liveWorldSchema.js';
import { normalizeAcknowledgedArrivalCityIds } from '../systems/world/cityArrivalContract.js';
const DEFAULT_CITY_FLAGS = {
    outskirtsBossDefeated: false,
    gateTrialCleared: false,
    ruinsCleared: false,
};
const FALLBACK_CITY_MODULES = Object.fromEntries(SEMESTER_0_CITY_UNLOCKS.map((unlock) => [unlock.cityId, [...LIVE_CITY_MODULE_ORDER]]));
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const getDefaultModule = (modules) => {
    if (modules.includes('outskirts'))
        return 'outskirts';
    return modules[0] ?? null;
};
const getCitySources = (content) => {
    if (content?.cities?.length) {
        return [...content.cities].sort((a, b) => a.index - b.index);
    }
    return SEMESTER_0_CITY_UNLOCKS.map((unlock, index) => ({
        id: unlock.cityId,
        index,
        modules: [...(FALLBACK_CITY_MODULES[unlock.cityId] ?? LIVE_CITY_MODULE_ORDER)],
    }));
};
const getUnlockedCityIdsForRealm = (content, realmId, existingUnlockedCityIds) => {
    if (!content) {
        const targetRealmIndex = SEMESTER_0_CITY_UNLOCKS.findIndex((unlock) => unlock.unlockOnRealmEntry === realmId);
        if (targetRealmIndex < 0) {
            if (realmId === 'spirit_severing') {
                return SEMESTER_0_CITY_UNLOCKS.map((unlock) => unlock.cityId);
            }
            return existingUnlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) === index);
        }
        return SEMESTER_0_CITY_UNLOCKS.slice(0, targetRealmIndex + 1).map((unlock) => unlock.cityId);
    }
    const sync = syncRuntimeCityStateToRealmEntry(content, realmId, existingUnlockedCityIds);
    if (sync.unlockedCityIds.length > 0) {
        return sync.unlockedCityIds;
    }
    return existingUnlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) === index);
};
export const normalizeCitySaveState = ({ content, realmIndex, cityState, }) => {
    const citySources = getCitySources(content);
    const validCityIds = new Set(citySources.map((city) => city.id));
    const incoming = isRecord(cityState) ? cityState : {};
    const incomingUnlocked = Array.isArray(incoming.unlockedCityIds)
        ? incoming.unlockedCityIds.filter((cityId) => typeof cityId === 'string' && validCityIds.has(cityId))
        : [];
    const realmId = getLiveRealmByIndex(realmIndex).id;
    const normalizedUnlockedCityIds = getUnlockedCityIdsForRealm(content, realmId, incomingUnlocked)
        .filter((cityId) => validCityIds.has(cityId))
        .filter((cityId, index, values) => values.indexOf(cityId) === index);
    const unlockedCityIds = normalizedUnlockedCityIds.length > 0
        ? normalizedUnlockedCityIds
        : citySources[0]
            ? [citySources[0].id]
            : [];
    const acknowledgedArrivalCityIds = normalizeAcknowledgedArrivalCityIds({
        incoming: incoming.acknowledgedArrivalCityIds,
        unlockedCityIds,
        validCityIds: citySources.map((city) => city.id),
        fieldWasPresent: Object.prototype.hasOwnProperty.call(incoming, 'acknowledgedArrivalCityIds'),
    });
    const selectedModuleByCityInput = isRecord(incoming.selectedModuleByCity)
        ? incoming.selectedModuleByCity
        : {};
    const cityFlagsByIdInput = isRecord(incoming.cityFlagsById) ? incoming.cityFlagsById : {};
    const selectedModuleByCity = Object.fromEntries(unlockedCityIds.flatMap((cityId) => {
        const city = citySources.find((entry) => entry.id === cityId);
        const modules = Array.isArray(city?.modules) ? city.modules : [...(FALLBACK_CITY_MODULES[cityId] ?? LIVE_CITY_MODULE_ORDER)];
        const existing = selectedModuleByCityInput[cityId];
        if (typeof existing === 'string' && modules.includes(existing)) {
            return [[cityId, existing]];
        }
        const fallback = getDefaultModule(modules);
        return fallback ? [[cityId, fallback]] : [];
    }));
    const cityFlagsById = Object.fromEntries(unlockedCityIds.map((cityId) => {
        const existing = isRecord(cityFlagsByIdInput[cityId]) ? cityFlagsByIdInput[cityId] : {};
        return [
            cityId,
            {
                outskirtsBossDefeated: existing.outskirtsBossDefeated === true,
                gateTrialCleared: existing.gateTrialCleared === true,
                ruinsCleared: existing.ruinsCleared === true,
            },
        ];
    }));
    const highestUnlockedCityId = unlockedCityIds.at(-1) ?? citySources[0]?.id ?? null;
    const existingCurrentCityId = typeof incoming.currentCityId === 'string' && unlockedCityIds.includes(incoming.currentCityId)
        ? incoming.currentCityId
        : null;
    return {
        currentCityId: existingCurrentCityId ?? highestUnlockedCityId,
        unlockedCityIds,
        selectedModuleByCity,
        cityFlagsById: Object.keys(cityFlagsById).length > 0
            ? cityFlagsById
            : highestUnlockedCityId
                ? { [highestUnlockedCityId]: { ...DEFAULT_CITY_FLAGS } }
                : {},
        initializedFromContent: typeof incoming.initializedFromContent === 'boolean' ? incoming.initializedFromContent : true,
        acknowledgedArrivalCityIds,
    };
};
