import type { WorldBuildingKey, WorldBuildingModalIntent } from '../../../stores/uiStore.js';
import { formatWorldModuleLabel } from '../../../ui/text/playerFacingFormatters.js';

export type BackgroundVariant = 'manual-pavilion' | 'apothecary' | 'apothecary-exact' | 'bounty-board' | 'inside-dungeon' | 'forge' | 'forge-exact' | 'outskirts-exact' | 'ruins-exact' | 'gate-trial-exact';
export type WorldModalShellFamily = 'prep-room' | 'apothecary-scenic' | 'support-board' | 'combat-path' | 'forge-scenic' | 'outskirts-scenic' | 'ruins-scenic' | 'gate-trial-scenic';
export type WorldModalShellMode = 'context-strip' | 'close-only' | 'screen-owned';

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

  switch (intent?.apothecaryFocus ?? intent?.apothecarySurface) {
    case 'prescription':
      return 'Opened to Prescription';
    case 'brew':
      return 'Opened to Brew';
    case 'pouch':
      return 'Opened for Medicine Pouch';
    case 'source':
      return 'Opened to Source';
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
      backgroundVariant = 'apothecary-exact';
      shellFamily = 'apothecary-scenic';
      shellMode = 'screen-owned';
      showShellClose = false;
      break;
    case 'bounties':
    case 'expeditions':
      backgroundVariant = 'bounty-board';
      shellFamily = 'support-board';
      break;
    case 'forge':
      if (intent?.forgeExactMode === 'legacy') {
        backgroundVariant = 'forge';
        break;
      }
      backgroundVariant = 'forge-exact';
      shellFamily = 'forge-scenic';
      shellMode = 'screen-owned';
      showShellClose = false;
      break;
    case 'outskirts':
      backgroundVariant = 'outskirts-exact';
      shellFamily = 'outskirts-scenic';
      shellMode = 'screen-owned';
      showShellClose = false;
      break;
    case 'gateTrial':
      if (intent?.gateTrialExactMode === 'fixture') {
        backgroundVariant = 'gate-trial-exact';
        shellFamily = 'gate-trial-scenic';
        shellMode = 'screen-owned';
        showShellClose = false;
        break;
      }

      backgroundVariant = 'inside-dungeon';
      shellFamily = 'combat-path';
      shellMode = 'close-only';
      showShellClose = false;
      break;
    case 'ruins':
      backgroundVariant = 'ruins-exact';
      shellFamily = 'ruins-scenic';
      shellMode = 'screen-owned';
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
