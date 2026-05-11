import type { GameTab, WorldBuildingKey } from '../../stores/uiStore.js';
import type { PavilionRouteActionKind, PavilionRouteButtonSurface } from './pavilionTypes.js';

export interface PavilionRouteContext {
  currentCityId: string | null;
  cityModules: readonly string[];
  setActiveTab?: (tab: GameTab | string) => void;
  openWorldBuildingModal?: (args: { cityId: string; buildingKey: WorldBuildingKey | string; intent?: unknown }) => void;
  focusSearch?: () => void;
  selectEntry?: (entryId: string) => void;
  targetEntryId?: string;
}

const ROUTE_MAP: Record<string, { action: PavilionRouteActionKind; tab?: GameTab; building?: WorldBuildingKey }> = {
  'Route to Cultivation': { action: 'routeCultivation', tab: 'cultivation' },
  'Route to World': { action: 'routeWorld', tab: 'adventure' },
  'Route to Gate Trial': { action: 'routeGateTrial', tab: 'adventure', building: 'gateTrial' },
  'Route to Apothecary': { action: 'routeApothecary', tab: 'adventure', building: 'apothecary' },
  'Route to Forge': { action: 'routeForge', tab: 'adventure', building: 'forge' },
  'Route to Manual Pavilion': { action: 'routeManualPavilion', tab: 'adventure', building: 'manualPavilion' },
  'Route to Ruins': { action: 'routeRuins', tab: 'adventure', building: 'ruins' },
  'Route to Bounty Board': { action: 'routeBountyBoard', tab: 'adventure', building: 'bounties' },
  'Route to Expeditions': { action: 'routeExpeditions', tab: 'adventure', building: 'expeditions' },
  'Route to Techniques': { action: 'routeTechniques', tab: 'techniques' },
  'Route to Prestige': { action: 'routePrestige', tab: 'prestige' },
  'Open Life Profile': { action: 'openLifeProfile', tab: 'status' },
  'Ask the Records': { action: 'askRecords' },
  'Search the Records': { action: 'focusSearch' },
};

function buttonId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function resolvePavilionRouteButton(
  label: string,
  context: PavilionRouteContext,
): PavilionRouteButtonSurface {
  const route = ROUTE_MAP[label] ?? { action: 'none' as const };
  const missingCity = Boolean(route.building && !context.currentCityId);
  const missingModule = Boolean(route.building && !context.cityModules.includes(route.building));
  const enabled = route.action !== 'none' && !missingCity && !missingModule;
  return {
    id: buttonId(label),
    label,
    action: route.action,
    enabled,
    targetTab: route.tab,
    worldBuildingKey: route.building,
    targetEntryId: route.action === 'askRecords' || route.action === 'selectEntry'
      ? context.targetEntryId
      : undefined,
    disabledReason: enabled
      ? undefined
      : missingCity
        ? 'No current city is available for this route.'
        : missingModule
          ? `${label.replace('Route to ', '')} is unavailable in the current city.`
          : 'This route is not available.',
  };
}

export function executePavilionRouteAction(
  button: PavilionRouteButtonSurface,
  context: PavilionRouteContext,
): { ok: boolean; reason?: string } {
  if (!button.enabled) {
    return { ok: false, reason: button.disabledReason ?? 'Route unavailable.' };
  }

  if (button.targetTab) {
    context.setActiveTab?.(button.targetTab);
  }

  if (button.worldBuildingKey && context.currentCityId) {
    context.openWorldBuildingModal?.({
      cityId: context.currentCityId,
      buildingKey: button.worldBuildingKey,
      intent: button.worldBuildingKey === 'gateTrial'
        ? { gateTrialExactMode: 'live' }
        : button.worldBuildingKey === 'apothecary'
          ? { apothecarySurface: 'buy', apothecaryFocus: 'buy' }
          : undefined,
    });
  }

  if (button.action === 'focusSearch') {
    context.focusSearch?.();
  }

  if ((button.action === 'askRecords' || button.action === 'selectEntry') && button.targetEntryId) {
    context.selectEntry?.(button.targetEntryId);
  }

  return { ok: true };
}

