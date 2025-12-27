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
  getLastLoadedSaveSnapshot,
} from '../../utils/saveload';
import { GameEvents } from '../events/GameEvents';
import { apply as applyOfflineCatchup } from '../time/OfflineCatchup';
import { GameClock } from '../time/GameClock';
import { useUIStore } from '../../stores/uiStore';
import type { SaveData } from '../../types';

function recordLastSave(timestamp: number) {
  try {
    useUIStore.getState().setLastSaveAt(timestamp);
  } catch (error) {
    console.warn('[SaveService] Unable to record last save time', error);
  }
}

function recordOfflineSummary(save: SaveData | null) {
  if (!save) return;
  const result = applyOfflineCatchup(save, GameClock.nowWall());
  if (result.summary) {
    try {
      useUIStore.getState().setLastOfflineSummary(result.summary);
    } catch (error) {
      console.warn('[SaveService] Unable to store offline summary', error);
    }
  }
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
      recordLastSave(GameClock.nowWall());
      recordOfflineSummary(getLastLoadedSaveSnapshot());
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
  startAutosave(): number {
    return legacyStartAutosave();
  },
  stopAutosave(): void {
    legacyStopAutosave();
  },
};
