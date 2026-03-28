import { useUIStore } from '../../stores/uiStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import { inspectWorldFacingModuleTarget } from './liveWorldLeakAudit.js';
import { getWorldTravelBlockMessage, getWorldTravelGuard, } from './travelContract.js';
export const COMBAT_MODULE_KEYS = new Set(['outskirts', 'gateTrial', 'ruins']);
export function isCombatModule(moduleKey) {
    return COMBAT_MODULE_KEYS.has(moduleKey);
}
export function openWorldModule({ cityId, moduleKey, open = true, intent }) {
    const uiStore = useUIStore.getState();
    const cityStore = useCityStore.getState();
    const contentStore = useContentStore.getState();
    const activityStore = useActivityStore.getState();
    const combatStore = useCombatStore.getState();
    const normalizedModuleKey = moduleKey;
    const targetAudit = inspectWorldFacingModuleTarget(normalizedModuleKey);
    if (!targetAudit.ok) {
        uiStore.addNotification('warning', 'That module is not available here.');
        return;
    }
    const city = contentStore.maps.citiesById[cityId];
    if (!city || !city.modules.includes(normalizedModuleKey))
        return;
    const travelGuard = getWorldTravelGuard({
        targetCityId: cityId,
        currentCityId: cityStore.currentCityId,
        unlockedCityIds: cityStore.unlockedCityIds,
        liveCityIds: SEMESTER_SLICE_CONTRACT.liveCityIds,
        inCombat: combatStore.inCombat,
        activeActivityType: activityStore.active?.type,
        combatPresentationMode: uiStore.combatPresentation.mode,
    });
    if (!travelGuard.allowed) {
        const message = getWorldTravelBlockMessage(travelGuard.reason);
        if (message) {
            uiStore.addNotification('warning', message);
        }
        return;
    }
    if (cityStore.currentCityId !== cityId) {
        cityStore.setCurrentCity(cityId);
        if (useCityStore.getState().currentCityId !== cityId) {
            return;
        }
    }
    uiStore.setActiveTab('adventure');
    cityStore.setSelectedModule(cityId, normalizedModuleKey);
    uiStore.closeWorldBuildingModal();
    if (open === false) {
        return;
    }
    uiStore.openWorldBuildingModal({ cityId, buildingKey: normalizedModuleKey, intent });
}
