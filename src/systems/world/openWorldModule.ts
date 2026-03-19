import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useActivityStore } from '../../stores/activityStore';
import { useCombatStore } from '../../stores/combatStore';
import { SEMESTER_SLICE_CONTRACT } from '../progression/contract/semesterSlice.js';
import {
  getWorldTravelBlockMessage,
  getWorldTravelGuard,
} from './travelContract.js';

export type WorldModuleKey = WorldBuildingKey | string;

export type OpenWorldModuleArgs = {
  cityId: string;
  moduleKey: WorldModuleKey;
  open?: boolean;
  source?: string;
};

export const COMBAT_MODULE_KEYS = new Set<WorldModuleKey>(['outskirts', 'gateTrial', 'ruins']);

export function isCombatModule(moduleKey: string): boolean {
  return COMBAT_MODULE_KEYS.has(moduleKey);
}

export function openWorldModule({ cityId, moduleKey, open = true, source: _source }: OpenWorldModuleArgs): void {
  const uiStore = useUIStore.getState();
  const cityStore = useCityStore.getState();
  const contentStore = useContentStore.getState();
  const activityStore = useActivityStore.getState();
  const combatStore = useCombatStore.getState();

  const city = contentStore.maps.citiesById[cityId];
  if (!city || !city.modules.includes(moduleKey)) return;

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
  cityStore.setSelectedModule(cityId, moduleKey);
  uiStore.closeWorldBuildingModal();

  if (open === false) {
    return;
  }

  uiStore.openWorldBuildingModal({ cityId, buildingKey: moduleKey as WorldBuildingKey });
}
