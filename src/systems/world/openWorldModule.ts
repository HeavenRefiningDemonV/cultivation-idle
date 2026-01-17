import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';

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

  uiStore.setActiveTab('adventure');

  const city = contentStore.maps.citiesById[cityId];
  if (!city || !city.modules.includes(moduleKey)) return;

  if (cityStore.currentCityId !== cityId) {
    cityStore.setCurrentCity(cityId);
  }

  cityStore.setSelectedModule(cityId, moduleKey);

  // Close any world building modal before opening a new module UI
  uiStore.closeWorldBuildingModal();

  if (open === false) {
    return;
  }

  if (isCombatModule(moduleKey)) {
    uiStore.openWorldBuildingModal({ cityId, buildingKey: moduleKey as WorldBuildingKey });
    return;
  }

  uiStore.openWorldBuildingModal({ cityId, buildingKey: moduleKey as WorldBuildingKey });
}
