import { useUIStore } from '../../../stores/uiStore.js';
import { openWorldModule } from '../../world/openWorldModule.js';
import type { DaoMandateRoute } from './daoMandateTypes.js';

export interface PerformDaoMandateRouteResult {
  performed: boolean;
  reason: string | null;
}

const WORLD_ROUTE_OPEN_FAILURE_REASON =
  'Route could not be opened. The target may be locked, unavailable, or blocked by the current activity.';

export function performDaoMandateRouteAction(route: DaoMandateRoute): PerformDaoMandateRouteResult {
  if (route.blocked) {
    return { performed: false, reason: route.blockedReason ?? 'Route is blocked.' };
  }
  if (!route.target) {
    return { performed: false, reason: 'Route target is unavailable.' };
  }

  if (route.target.kind === 'tab') {
    useUIStore.getState().setActiveTab(route.target.tab);
    return { performed: true, reason: null };
  }

  if (route.target.kind === 'world_module') {
    openWorldModule({
      cityId: route.target.cityId,
      moduleKey: route.target.moduleKey,
      source: 'dao-mandate',
    });
    const ui = useUIStore.getState();
    const opened =
      ui.activeTab === 'adventure' &&
      ui.showWorldBuildingModal &&
      ui.worldBuildingModalCityId === route.target.cityId &&
      ui.worldBuildingModalKey === route.target.moduleKey;

    return opened
      ? { performed: true, reason: null }
      : { performed: false, reason: WORLD_ROUTE_OPEN_FAILURE_REASON };
  }

  const _exhaustive: never = route.target;
  return { performed: false, reason: `Unknown route target: ${String(_exhaustive)}` };
}
