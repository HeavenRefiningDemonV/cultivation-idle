import CryptoJS from 'crypto-js';
import { readOfflineTimestampSnapshot } from '../../../src/save/offlineTimestampNormalization.js';
import { SaveService } from '../../../src/services/save/SaveService.js';
import { useActivityStore } from '../../../src/stores/activityStore.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useCombatStore } from '../../../src/stores/combatStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../../src/stores/prestigeStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { useUIStore } from '../../../src/stores/uiStore.js';
import { exportSave } from '../../../src/utils/saveload.js';

const TEST_SAVE_ENCRYPTION_KEY = 'cultivation-idle-secret-2025';

function decodeExportedSave(exported: string): Record<string, unknown> {
  const encrypted = atob(exported);
  const decrypted = CryptoJS.AES.decrypt(encrypted, TEST_SAVE_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error('Failed to decrypt exported save in reload snapshot helper.');
  const json = atob(decrypted);
  return JSON.parse(json) as Record<string, unknown>;
}

export interface ReloadSnapshot {
  realmId: string;
  realmIndex: number;
  currentCityId: string | null;
  unlockedCityIds: string[];
  selectedPath: string | null;
  trialSessionActive: boolean;
  projectedAp: number;
  canPrestige: boolean;
  lastOfflineSummaryPresent: boolean;
  offlineTimestampSnapshot: ReturnType<typeof readOfflineTimestampSnapshot>;
  currentChapterExhaustedAcknowledgedThisLife: boolean;
  activeActivityType: string | null;
  combatActive: boolean;
  hasCombatContext: boolean;
  lastLoadFailureCode: string | null;
  noFakeCitySix: boolean;
}

export function buildReloadSnapshot(): ReloadSnapshot {
  const game = useGameStore.getState();
  const city = useCityStore.getState();
  const ui = useUIStore.getState();
  const activity = useActivityStore.getState();
  const combat = useCombatStore.getState();
  const trial = useTrialStore.getState();
  const prestige = usePrestigeStore.getState();

  const exported = exportSave();
  let offlineTimestampSnapshot: ReturnType<typeof readOfflineTimestampSnapshot> = {
    metaLastActiveAtMs: null,
    gameLastActiveTime: null,
    gameLastTickTime: null,
  };

  if (exported) {
    const json = decodeExportedSave(exported);
    offlineTimestampSnapshot = readOfflineTimestampSnapshot(json);
  }

  const lastLoadFailure = SaveService.getLastLoadFailure();

  return {
    realmId: game.realm.name,
    realmIndex: game.realm.index,
    currentCityId: city.currentCityId,
    unlockedCityIds: [...city.unlockedCityIds],
    selectedPath: game.selectedPath,
    trialSessionActive: Boolean(trial.activeTrialSessionId),
    projectedAp: prestige.getApBreakdown().potentialGain,
    canPrestige: prestige.canPrestige(),
    lastOfflineSummaryPresent: ui.lastOfflineSummary !== null,
    offlineTimestampSnapshot,
    currentChapterExhaustedAcknowledgedThisLife: ui.currentChapterExhaustedAcknowledgedThisLife,
    activeActivityType: activity.active?.type ?? null,
    combatActive: combat.inCombat,
    hasCombatContext: combat.combatContext?.type != null,
    lastLoadFailureCode: lastLoadFailure?.code ?? null,
    noFakeCitySix: !city.unlockedCityIds.includes('city_six'),
  };
}
