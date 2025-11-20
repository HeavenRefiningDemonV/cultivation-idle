import CryptoJS from 'crypto-js';
import type { SaveData } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCombatStore } from '../stores/combatStore';
import { useTechniqueStore } from '../stores/techniqueStore';
import { useZoneStore } from '../stores/zoneStore';

/**
 * Save system constants
 */
const SAVE_VERSION = '1.0.0';
const SAVE_KEY = 'cultivation-idle-save-v3';
const BACKUP_A_KEY = 'cultivation-idle-save-v3-backup-A';
const BACKUP_B_KEY = 'cultivation-idle-save-v3-backup-B';
const BACKUP_C_KEY = 'cultivation-idle-save-v3-backup-C';

/**
 * Encryption key - in production, this could be more sophisticated
 * For an idle game, basic obfuscation is usually sufficient
 */
const ENCRYPTION_KEY = 'cultivation-idle-secret-2025';

/**
 * Gather current game state from all stores
 */
function gatherGameState(): SaveData {
  const gameState = useGameStore.getState();
  const inventoryState = useInventoryStore.getState();
  const combatState = useCombatStore.getState();
  const zoneState = useZoneStore.getState();
  const techniqueState = useTechniqueStore.getState();

  const saveData: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),

    gameState: {
      realm: gameState.realm,
      qi: gameState.qi,
      selectedPath: gameState.selectedPath,
      focusMode: gameState.focusMode,
      pathPerks: gameState.pathPerks,
      totalAuras: gameState.totalAuras,
      upgradeTiers: gameState.upgradeTiers,
      pityState: gameState.pityState,
      playerLuck: gameState.playerLuck,
      lastTickTime: gameState.lastTickTime,
      lastActiveTime: gameState.lastActiveTime,
    },

    inventoryState: {
      items: inventoryState.items,
      equippedWeapon: inventoryState.equippedWeapon,
      equippedAccessory: inventoryState.equippedAccessory,
      gold: inventoryState.gold,
      maxSlots: inventoryState.maxSlots,
    },

    combatSettings: {
      autoAttack: combatState.autoAttack,
      autoCombatAI: combatState.autoCombatAI,
    },

    zoneState: {
      unlockedZones: zoneState.unlockedZones,
      zoneProgress: zoneState.zoneProgress,
    },

    techniqueState: {
      currentIntent: techniqueState.currentIntent,
      maxIntent: techniqueState.maxIntent,
      intentRegenRate: techniqueState.intentRegenRate,
      techniques: techniqueState.techniques,
    },
  };

  return saveData;
}

/**
 * Validate save data structure
 */
function validateSaveData(data: unknown): data is SaveData {
  try {
    if (!data || typeof data !== 'object') return false;
    const record = data as Record<string, unknown>;
    if (!('version' in record) || !('timestamp' in record)) return false;
    if (!('gameState' in record) || !('inventoryState' in record) || !('combatSettings' in record)) return false;

    // Basic structure validation
    const gs = record.gameState as Record<string, unknown>;
    if (!('realm' in gs) || typeof gs.qi !== 'string') return false;
    if ('lastActiveTime' in gs && typeof gs.lastActiveTime !== 'number') return false;
    if ('lastTickTime' in gs && typeof gs.lastTickTime !== 'number') return false;

    const is = record.inventoryState as Record<string, unknown>;
    if (!Array.isArray((is as { items?: unknown }).items) || typeof is.gold !== 'string') return false;

    const cs = record.combatSettings as Record<string, unknown>;
    if (typeof cs.autoAttack !== 'boolean' || typeof cs.autoCombatAI !== 'boolean') return false;

    // Zone state validation (optional for backward compatibility)
    if ('zoneState' in record && record.zoneState) {
      const zs = record.zoneState as Record<string, unknown>;
      if (!Array.isArray((zs as { unlockedZones?: unknown }).unlockedZones) || typeof zs.zoneProgress !== 'object') return false;
    }

    if ('techniqueState' in record && record.techniqueState) {
      const ts = record.techniqueState as Record<string, unknown>;
      if (typeof ts.currentIntent !== 'string' || typeof ts.maxIntent !== 'string') return false;
      if (typeof ts.intentRegenRate !== 'string' || typeof ts.techniques !== 'object') return false;
    }

    return true;
  } catch (error) {
    console.error('Save data validation error:', error);
    return false;
  }
}

/**
 * Encrypt save data
 */
function encryptSaveData(data: SaveData): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt save data');
  }
}

/**
 * Decrypt save data
 */
function decryptSaveData(encrypted: string): SaveData | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!jsonString) {
      console.error('Decryption produced empty string');
      return null;
    }

    const data = JSON.parse(jsonString);

    if (!validateSaveData(data)) {
      console.error('Decrypted data failed validation');
      return null;
    }

    return data as SaveData;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Rotate backup saves (C → B → A → main)
 */
function rotateBackups(): void {
  try {
    // Get current saves
    const mainSave = localStorage.getItem(SAVE_KEY);
    const backupA = localStorage.getItem(BACKUP_A_KEY);
    const backupB = localStorage.getItem(BACKUP_B_KEY);

    // Rotate: C ← B ← A ← main
    if (backupB) {
      localStorage.setItem(BACKUP_C_KEY, backupB);
    }
    if (backupA) {
      localStorage.setItem(BACKUP_B_KEY, backupA);
    }
    if (mainSave) {
      localStorage.setItem(BACKUP_A_KEY, mainSave);
    }
  } catch (error) {
    console.error('Backup rotation error:', error);
    // Don't throw - backup rotation failing shouldn't prevent saving
  }
}

/**
 * Save game to localStorage
 * Returns true if successful, false otherwise
 */
export function saveGame(): boolean {
  try {
    console.log('[SaveLoad] Saving game...');

    // Gather state
    const saveData = gatherGameState();

    // Encrypt
    const encrypted = encryptSaveData(saveData);

    // Rotate backups before saving
    rotateBackups();

    // Save to main slot
    localStorage.setItem(SAVE_KEY, encrypted);

    console.log('[SaveLoad] Game saved successfully at', new Date(saveData.timestamp).toLocaleString());
    return true;
  } catch (error) {
    console.error('[SaveLoad] Save failed:', error);
    return false;
  }
}

/**
 * Apply save data to stores
 */
function applySaveData(saveData: SaveData): void {
  try {
    // Apply to game store
    const gameStore = useGameStore.getState();
    useGameStore.setState({
      realm: saveData.gameState.realm,
      qi: saveData.gameState.qi,
      selectedPath: saveData.gameState.selectedPath,
      focusMode: saveData.gameState.focusMode,
      pathPerks: saveData.gameState.pathPerks || [],
      totalAuras: saveData.gameState.totalAuras,
      upgradeTiers: saveData.gameState.upgradeTiers,
      pityState: saveData.gameState.pityState || {
        killsSinceUncommon: 0,
        killsSinceRare: 0,
        killsSinceEpic: 0,
        killsSinceLegendary: 0,
      },
      playerLuck: saveData.gameState.playerLuck || 0,
      lastTickTime: saveData.gameState.lastTickTime || saveData.timestamp,
      lastActiveTime: saveData.gameState.lastActiveTime || saveData.timestamp,
    });

    // Recalculate derived values
    gameStore.calculateQiPerSecond();
    gameStore.calculatePlayerStats();

    // Apply to inventory store
    useInventoryStore.setState({
      items: saveData.inventoryState.items,
      equippedWeapon: saveData.inventoryState.equippedWeapon,
      equippedAccessory: saveData.inventoryState.equippedAccessory,
      gold: saveData.inventoryState.gold,
      maxSlots: saveData.inventoryState.maxSlots,
    });

    // Apply combat settings
    useCombatStore.setState({
      autoAttack: saveData.combatSettings.autoAttack,
      autoCombatAI: saveData.combatSettings.autoCombatAI,
    });

    // Apply zone state (if exists)
    if (saveData.zoneState) {
      useZoneStore.setState({
        unlockedZones: saveData.zoneState.unlockedZones,
        zoneProgress: saveData.zoneState.zoneProgress,
      });
    }

    if (saveData.techniqueState) {
      useTechniqueStore.setState({
        currentIntent: saveData.techniqueState.currentIntent,
        maxIntent: saveData.techniqueState.maxIntent,
        intentRegenRate: saveData.techniqueState.intentRegenRate,
        techniques: saveData.techniqueState.techniques,
      });
    }

    const selectedPath = saveData.gameState.selectedPath;
    if (selectedPath) {
      try {
        const techniqueStore = useTechniqueStore.getState();
        techniqueStore.unlockTechniqueByPathAndTier(selectedPath, 1);

        if (saveData.gameState.realm.index >= 1) {
          techniqueStore.unlockTechniqueByPathAndTier(selectedPath, 2);
        }

        if (saveData.gameState.realm.index >= 2) {
          techniqueStore.unlockTechniqueByPathAndTier(selectedPath, 3);
        }
      } catch {
        // Technique store unavailable during load
      }
    }

    console.log('[SaveLoad] Save data applied successfully');
  } catch (error) {
    console.error('[SaveLoad] Error applying save data:', error);
    throw error;
  }
}

/**
 * Load game from localStorage
 * Tries main save, then backups A, B, C in order
 * Returns true if successful, false otherwise
 */
export function loadGame(): boolean {
  try {
    console.log('[SaveLoad] Loading game...');

    const saveKeys = [SAVE_KEY, BACKUP_A_KEY, BACKUP_B_KEY, BACKUP_C_KEY];
    let saveData: SaveData | null = null;
    let loadedFrom: string | null = null;

    // Try each save slot in order
    for (const key of saveKeys) {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        console.log(`[SaveLoad] No save found at ${key}`);
        continue;
      }

      console.log(`[SaveLoad] Attempting to load from ${key}...`);
      saveData = decryptSaveData(encrypted);

      if (saveData) {
        loadedFrom = key;
        break;
      } else {
        console.warn(`[SaveLoad] Failed to decrypt save from ${key}`);
      }
    }

    if (!saveData) {
      console.log('[SaveLoad] No valid save found');
      return false;
    }

    // Apply save data to stores
    applySaveData(saveData);

    // If we loaded from a backup, save it to main slot
    if (loadedFrom !== SAVE_KEY) {
      console.log(`[SaveLoad] Loaded from backup ${loadedFrom}, saving to main slot`);
      saveGame();
    }

    console.log('[SaveLoad] Game loaded successfully from', loadedFrom);
    console.log('[SaveLoad] Save timestamp:', new Date(saveData.timestamp).toLocaleString());
    return true;
  } catch (error) {
    console.error('[SaveLoad] Load failed:', error);
    return false;
  }
}

/**
 * Delete all saves and reset game
 * Returns true if successful, false otherwise
 */
export function deleteSave(): boolean {
  try {
    console.log('[SaveLoad] Deleting all saves...');

    // Remove all save slots
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_A_KEY);
    localStorage.removeItem(BACKUP_B_KEY);
    localStorage.removeItem(BACKUP_C_KEY);

    // Reset all stores to initial state
    const gameStore = useGameStore.getState();
    gameStore.resetRun();

    useInventoryStore.setState({
      items: [],
      equippedWeapon: null,
      equippedAccessory: null,
      gold: '0',
      maxSlots: 20,
    });

    useCombatStore.setState({
      autoAttack: false,
      autoCombatAI: false,
    });

    console.log('[SaveLoad] All saves deleted and game reset');
    return true;
  } catch (error) {
    console.error('[SaveLoad] Delete save failed:', error);
    return false;
  }
}

/**
 * Export save as base64 string (for manual backup)
 * Returns base64 string or null on error
 */
export function exportSave(): string | null {
  try {
    console.log('[SaveLoad] Exporting save...');

    const saveData = gatherGameState();
    const jsonString = JSON.stringify(saveData);

    // Double encoding: JSON → base64 → encrypt → base64
    // This makes it copy-paste friendly
    const base64Json = btoa(jsonString);
    const encrypted = CryptoJS.AES.encrypt(base64Json, ENCRYPTION_KEY).toString();
    const exportString = btoa(encrypted);

    console.log('[SaveLoad] Save exported successfully');
    return exportString;
  } catch (error) {
    console.error('[SaveLoad] Export failed:', error);
    return null;
  }
}

/**
 * Import save from base64 string
 * Returns true if successful, false otherwise
 */
export function importSave(base64String: string): boolean {
  try {
    console.log('[SaveLoad] Importing save...');

    if (!base64String || typeof base64String !== 'string') {
      console.error('[SaveLoad] Invalid import string');
      return false;
    }

    // Reverse the export encoding
    const encrypted = atob(base64String);
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const base64Json = decrypted.toString(CryptoJS.enc.Utf8);

    if (!base64Json) {
      console.error('[SaveLoad] Decryption failed');
      return false;
    }

    const jsonString = atob(base64Json);
    const saveData = JSON.parse(jsonString);

    if (!validateSaveData(saveData)) {
      console.error('[SaveLoad] Imported data failed validation');
      return false;
    }

    // Apply the imported data
    applySaveData(saveData as SaveData);

    // Save to localStorage
    saveGame();

    console.log('[SaveLoad] Save imported successfully');
    return true;
  } catch (error) {
    console.error('[SaveLoad] Import failed:', error);
    return false;
  }
}

/**
 * Autosave interval ID (stored globally to allow stopping)
 */
let autosaveIntervalId: number | null = null;

/**
 * Start autosave timer
 * Saves every 60 seconds
 * Returns the interval ID
 */
export function startAutosave(): number {
  // Stop existing autosave if running
  if (autosaveIntervalId !== null) {
    stopAutosave();
  }

  console.log('[SaveLoad] Starting autosave (every 60 seconds)');

  // Save immediately
  saveGame();

  // Set up autosave interval
  autosaveIntervalId = window.setInterval(() => {
    console.log('[SaveLoad] Autosave triggered');
    saveGame();
  }, 60000); // 60 seconds

  return autosaveIntervalId;
}

/**
 * Stop autosave timer
 */
export function stopAutosave(): void {
  if (autosaveIntervalId !== null) {
    console.log('[SaveLoad] Stopping autosave');
    window.clearInterval(autosaveIntervalId);
    autosaveIntervalId = null;
  }
}

/**
 * Check if a save exists
 * Returns true if any save slot has data
 */
export function hasSave(): boolean {
  try {
    const mainSave = localStorage.getItem(SAVE_KEY);
    const backupA = localStorage.getItem(BACKUP_A_KEY);
    const backupB = localStorage.getItem(BACKUP_B_KEY);
    const backupC = localStorage.getItem(BACKUP_C_KEY);

    return !!(mainSave || backupA || backupB || backupC);
  } catch (error) {
    console.error('[SaveLoad] Error checking for saves:', error);
    return false;
  }
}

/**
 * Get save information without loading it
 * Returns save metadata or null if no save exists
 */
export function getSaveInfo(): { timestamp: number; version: string } | null {
  try {
    const encrypted = localStorage.getItem(SAVE_KEY);
    if (!encrypted) return null;

    const saveData = decryptSaveData(encrypted);
    if (!saveData) return null;

    return {
      timestamp: saveData.timestamp,
      version: saveData.version,
    };
  } catch (error) {
    console.error('[SaveLoad] Error getting save info:', error);
    return null;
  }
}
