import type { WorldBuildingKey, WorldBuildingModalIntent } from '../../../stores/uiStore.js';
import { formatWorldModuleLabel } from '../../../ui/text/playerFacingFormatters.js';

export type BackgroundVariant = 'manual-pavilion' | 'apothecary' | 'bounty-board' | 'inside-dungeon' | 'forge';
export type WorldModalShellFamily = 'prep-room' | 'support-board' | 'combat-path';
export type WorldModalShellMode = 'context-strip' | 'close-only';

export type WorldModalEntrySurface = {
  title: string;
  cityLabel: string;
  moduleLabel: string;
  contextReason: string | null;
  backgroundVariant: BackgroundVariant;
  shellFamily: WorldModalShellFamily;
  shellMode: WorldModalShellMode;
  showShellClose: boolean;
  showContextStrip: boolean;
};

function formatIntentReason(
  buildingKey: WorldBuildingKey | null | undefined,
  intent: WorldBuildingModalIntent,
): string | null {
  if (buildingKey !== 'apothecary' && buildingKey !== 'alchemy') {
    return null;
  }

  switch (intent?.apothecarySurface) {
    case 'brew':
      return 'Opened to Brew';
    case 'pouch':
      return 'Opened for Medicine Pouch';
    default:
      return null;
  }
}

export function resolveWorldModalEntrySurface(args: {
  buildingKey: WorldBuildingKey | null | undefined;
  cityName: string | null | undefined;
  intent: WorldBuildingModalIntent;
  controlledTitle?: string;
  isStoreMode: boolean;
}): WorldModalEntrySurface {
  const { buildingKey, cityName, intent, controlledTitle, isStoreMode } = args;
  const cityLabel = cityName ?? 'City';
  const moduleLabel = formatWorldModuleLabel(buildingKey);
  const title = isStoreMode ? `${cityLabel} — ${moduleLabel}` : controlledTitle || 'World Building';

  let backgroundVariant: BackgroundVariant = 'manual-pavilion';
  let shellFamily: WorldModalShellFamily = 'prep-room';
  let shellMode: WorldModalShellMode = 'context-strip';
  let showShellClose = true;

  switch (buildingKey) {
    case 'apothecary':
    case 'alchemy':
      backgroundVariant = 'apothecary';
      break;
    case 'bounties':
    case 'expeditions':
      backgroundVariant = 'bounty-board';
      shellFamily = 'support-board';
      break;
    case 'forge':
      backgroundVariant = 'forge';
      break;
    case 'outskirts':
    case 'gateTrial':
    case 'ruins':
      backgroundVariant = 'inside-dungeon';
      shellFamily = 'combat-path';
      shellMode = 'close-only';
      showShellClose = false;
      break;
    case 'manualPavilion':
    default:
      backgroundVariant = 'manual-pavilion';
      break;
  }

  return {
    title,
    cityLabel,
    moduleLabel,
    contextReason: formatIntentReason(buildingKey, intent),
    backgroundVariant,
    shellFamily,
    shellMode,
    showShellClose,
    showContextStrip: shellMode === 'context-strip',
  };
}
