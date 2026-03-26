import {
  saveGame as legacySaveGame,
  loadGame as legacyLoadGame,
  hasSave as legacyHasSave,
  deleteSave as legacyDeleteSave,
  deleteSaveAndHardReset as legacyDeleteSaveAndHardReset,
  exportSave as legacyExportSave,
  importSave as legacyImportSave,
  startAutosave as legacyStartAutosave,
  stopAutosave as legacyStopAutosave,
  getSaveInfo as legacyGetSaveInfo,
  consumeOfflineContext,
  getLastLoadMigrationReport,
} from '../../utils/saveload.js';
import { GameEvents } from '../events/GameEvents.js';
import { apply as applyOfflineCatchup } from '../time/OfflineCatchup.js';
import { GameClock } from '../time/GameClock.js';
import { useUIStore } from '../../stores/uiStore.js';
import { shouldShowOfflineProgressModal } from '../../systems/balance/offlineTargets.js';

function recordLastSave(timestamp: number) {
  try {
    useUIStore.getState().setLastSaveAt(timestamp);
  } catch (error) {
    console.warn('[SaveService] Unable to record last save time', error);
  }
}

function recordOfflineSummary(now: number): boolean {
  const context = consumeOfflineContext();
  if (!context) return false;
  const result = applyOfflineCatchup({ ...context, now });
  if (result.summary) {
    const qiPart = result.summary.parts.find((part) => part.kind === 'qi_gained');
    const queuePart = result.summary.parts.find((part) => part.kind === 'queued_actions');
    const expeditionPart = result.summary.parts.find((part) => part.kind === 'expeditions');
    GameEvents.emit({
      type: 'offline/applied',
      payload: {
        timestamp: now,
        rawOfflineSeconds: result.summary.offlineSeconds,
        effectiveOfflineSeconds: result.summary.offlineSeconds,
        effectiveEfficiency: result.summary.efficiency,
        wasCapped: result.summary.wasCapped,
        qiGained: qiPart?.value ?? '0',
        queuedActionsReady: Number(queuePart?.value ?? '0') || 0,
        expeditionsReady: Number(expeditionPart?.value ?? '0') || 0,
      },
    });
    try {
      const uiStore = useUIStore.getState();
      uiStore.setLastOfflineSummary(result.summary);
      if (shouldShowOfflineProgressModal(result.summary)) {
        uiStore.showOfflineProgress(result.summary);
      }
    } catch (error) {
      console.warn('[SaveService] Unable to store offline summary', error);
    }
    return true;
  }
  return false;
}

export const SaveService = {
  initializeSubscriptions() {
    GameEvents.on('rewards/granted', () => this.save());
    GameEvents.on('activity/changed', () => this.save());
    GameEvents.on('manuals/purchased', () => this.save());
    GameEvents.on('manuals/studied', () => this.save());
    GameEvents.on('techniques/equipped', () => this.save());
    GameEvents.on('heartlaw/selected', () => this.save());
  },
  save(): boolean {
    const ok = legacySaveGame();
    if (ok) {
      recordLastSave(GameClock.nowWall());
    }
    return ok;
  },
  load(): boolean {
    const ok = legacyLoadGame();
    if (ok) {
      const now = GameClock.nowWall();
      recordLastSave(now);
      const appliedOffline = recordOfflineSummary(now);
      if (appliedOffline) {
        const persisted = legacySaveGame();
        if (persisted) {
          recordLastSave(GameClock.nowWall());
        }
      }
    }
    return ok;
  },
  hasSave(): boolean {
    return legacyHasSave();
  },
  deleteSave(): boolean {
    return legacyDeleteSave();
  },
  deleteSaveAndHardReset(): void {
    legacyDeleteSaveAndHardReset();
  },
  exportSave(): string | null {
    return legacyExportSave();
  },
  importSave(base64String: string): boolean {
    return legacyImportSave(base64String);
  },
  getSaveInfo() {
    return legacyGetSaveInfo();
  },
  getLastMigrationReport() {
    return getLastLoadMigrationReport();
  },
  startAutosave(): number {
    return legacyStartAutosave();
  },
  stopAutosave(): void {
    legacyStopAutosave();
  },
};
