import type { LiveWorldModuleKey } from '../../../content/index.js';
import { useUIStore, type WorldBuildingKey } from '../../../stores/uiStore.js';
import type { StatusRouteTarget } from './statusDashboardSurface.js';
import type { StatusLedgerActionSurface } from './statusLedgerTypes.js';

export interface StatusLedgerActionResult {
  performed: boolean;
  reason: string | null;
}

function toWorldBuildingKey(moduleKey: LiveWorldModuleKey): WorldBuildingKey {
  switch (moduleKey) {
    case 'outskirts':
    case 'ruins':
    case 'gateTrial':
    case 'manualPavilion':
    case 'apothecary':
    case 'forge':
    case 'bounties':
    case 'expeditions':
      return moduleKey;
  }
}

export function performStatusRouteTarget(target: StatusRouteTarget): StatusLedgerActionResult {
  const ui = useUIStore.getState();

  if (target.kind === 'tab') {
    ui.setActiveTab(target.tab);
    return { performed: true, reason: null };
  }

  if (target.kind === 'world_module') {
    ui.setActiveTab('adventure');
    ui.openWorldBuildingModal({
      cityId: target.cityId,
      buildingKey: toWorldBuildingKey(target.moduleKey),
    });
    return { performed: true, reason: null };
  }

  return { performed: false, reason: target.reason };
}

export function performStatusLedgerAction(action: StatusLedgerActionSurface): StatusLedgerActionResult {
  if (action.disabled) {
    return {
      performed: false,
      reason: action.disabledReason ?? `${action.label} is not available yet.`,
    };
  }

  return performStatusRouteTarget(action.target);
}

