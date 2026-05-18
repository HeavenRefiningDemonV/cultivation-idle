import type { WorldBuildingKey } from '../../stores/uiStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type { CombatAftermathRouteSurface, RunCompassActionTarget } from './types.js';

function routeTarget(target: RunCompassActionTarget | null): void {
  if (!target) return;
  const ui = useUIStore.getState();
  if (target.kind === 'tab') {
    ui.setActiveTab(target.tab);
    ui.closeWorldBuildingModal();
    return;
  }

  ui.setActiveTab('adventure');
  ui.openWorldBuildingModal({
    cityId: target.cityId,
    buildingKey: target.moduleKey as WorldBuildingKey,
    intent: target.moduleKey === 'gateTrial'
      ? { gateTrialExactMode: 'live' }
      : target.moduleKey === 'ruins'
        ? { ruinsExactMode: 'live' }
        : null,
  });
}

export function routeCombatAftermathTarget(route: CombatAftermathRouteSurface | null): void {
  if (!route?.enabled) return;
  routeTarget(route.target);
}
