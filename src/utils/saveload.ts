import CryptoJS from 'crypto-js';
import type { SaveData } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCombatStore } from '../stores/combatStore';
import { useTechniqueStore } from '../stores/techniqueStore';
import { useZoneStore } from '../stores/zoneStore';
import { useDungeonStore } from '../stores/dungeonStore';
import { usePrestigeStore } from '../stores/prestigeStore';
import { useUIStore } from '../stores/uiStore';
import { useCityStore } from '../stores/cityStore';
import { useTrialStore } from '../stores/trialStore';
import { useRuinsStore } from '../stores/ruinsStore';
import { useShopStore } from '../stores/shopStore';
import { useTechCollectionStore } from '../stores/techCollectionStore';
import { getDayKey } from './dayKey';

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
  const prestigeState = usePrestigeStore.getState();
  const cityState = useCityStore.getState();
  const trialState = useTrialStore.getState();
  const ruinsState = useRuinsStore.getState();
  const shopState = useShopStore.getState();
  const techCollectionState = useTechCollectionStore.getState();

  const saveData: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),

    gameState: {
      realm: gameState.realm,
      qi: gameState.qi,
      spiritRoot: prestigeState.spiritRoot,
      selectedPath: gameState.selectedPath,
      lifePath: gameState.lifePath,
      focusMode: gameState.focusMode,
      pathPerks: gameState.pathPerks,
      totalAuras: gameState.totalAuras,
      upgradeTiers: gameState.upgradeTiers,
      pityState: gameState.pityState,
      playerLuck: gameState.playerLuck,
      lastTickTime: gameState.lastTickTime,
      lastActiveTime: gameState.lastActiveTime,
      runStartTime: gameState.runStartTime,
    },

    prestigeState: {
      totalAP: prestigeState.totalAP,
      lifetimeAP: prestigeState.lifetimeAP,
      currentRunAP: prestigeState.currentRunAP,
      prestigeCount: prestigeState.prestigeCount,
      prestigeRuns: prestigeState.prestigeRuns,
      upgrades: prestigeState.upgrades,
      highestRealmReached: prestigeState.highestRealmReached,
      runStartTime: prestigeState.runStartTime,
      rerollCount: prestigeState.rerollCount,
      spiritRoot: prestigeState.spiritRoot,
    },

    inventoryState: {
      currencies: { ...inventoryState.currencies },
      items: { ...inventoryState.items },
    },

    combatSettings: {
      autoAttack: combatState.autoAttack,
      autoCombatAI: combatState.autoCombatAI,
    },

    zoneState: {
      unlockedZones: zoneState.unlockedZones,
      zoneProgress: zoneState.zoneProgress,
    },

    cityState: {
      currentCityId: cityState.currentCityId,
      unlockedCityIds: [...cityState.unlockedCityIds],
      selectedModuleByCity: { ...cityState.selectedModuleByCity },
      cityFlagsById: { ...cityState.cityFlagsById },
      initializedFromContent: cityState.initializedFromContent,
    },

    techniqueState: {
      loadouts: techniqueState.loadouts,
      selectedLoadoutId: techniqueState.selectedLoadoutId,
    },

    trialState: {
      progressByTrialId: { ...trialState.progressByTrialId },
    },

    ruinsState: {
      progressByRuinId: { ...ruinsState.progressByRuinId },
      autoRepeatDefault: ruinsState.autoRepeatDefault,
    },

    shopState: {
      dayKey: shopState.dayKey,
      purchasedToday: Object.fromEntries(
        Object.entries(shopState.purchasedToday).map(([shopId, entries]) => [
          shopId,
          { ...entries },
        ]),
      ),
    },

    techCollectionState: {
      unlockedTechs: { ...techCollectionState.unlockedTechs },
      fragments: { ...techCollectionState.fragments },
      rngSeed: techCollectionState.rngSeed,
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
    if ('spiritRoot' in gs && gs.spiritRoot !== undefined) {
      const sr = (gs as { spiritRoot?: unknown }).spiritRoot as
        | { grade?: unknown; element?: unknown; purity?: unknown }
        | null;
      if (
        sr !== null &&
        (!sr || typeof sr.grade !== 'number' || typeof sr.element !== 'string' || typeof sr.purity !== 'number')
      ) {
        return false;
      }
    }
    if (
      'lifePath' in gs &&
      (gs as { lifePath?: unknown }).lifePath !== null &&
      (gs as { lifePath?: unknown }).lifePath !== undefined &&
      typeof (gs as { lifePath?: unknown }).lifePath !== 'string'
    ) {
      return false;
    }
    if ('lastTickTime' in gs && typeof gs.lastTickTime !== 'number') return false;
    if ('lastActiveTime' in gs && typeof gs.lastActiveTime !== 'number') return false;
    if ('runStartTime' in gs && typeof gs.runStartTime !== 'number') return false;

    if ('prestigeState' in record && record.prestigeState) {
      const ps = record.prestigeState as Record<string, unknown>;

      const numbersValid =
        typeof ps.totalAP === 'number' &&
        typeof ps.lifetimeAP === 'number' &&
        typeof ps.currentRunAP === 'number' &&
        typeof ps.prestigeCount === 'number' &&
        typeof ps.highestRealmReached === 'number' &&
        typeof ps.runStartTime === 'number' &&
        typeof ps.rerollCount === 'number';

      if (!numbersValid) return false;

      if (!Array.isArray((ps as { prestigeRuns?: unknown }).prestigeRuns)) return false;
      if (typeof ps.upgrades !== 'object' || ps.upgrades === null) return false;

      if ('spiritRoot' in ps && ps.spiritRoot !== undefined) {
        const sr = (ps as { spiritRoot?: unknown }).spiritRoot as
          | { grade?: unknown; element?: unknown; purity?: unknown }
          | null;
        if (
          sr !== null &&
          (!sr || typeof sr.grade !== 'number' || typeof sr.element !== 'string' || typeof sr.purity !== 'number')
        ) {
          return false;
        }
      }
    }

    const is = record.inventoryState as Record<string, unknown>;
    const itemsValue = (is as { items?: unknown }).items;
    const itemsValid =
      (typeof itemsValue === 'object' && itemsValue !== null) || Array.isArray(itemsValue);
    if (!itemsValid) return false;

    const currenciesValue = (is as { currencies?: unknown }).currencies as
      | { gold?: unknown; spiritStones?: unknown; merit?: unknown }
      | undefined;
    const currenciesValid =
      currenciesValue === undefined ||
      (typeof currenciesValue === 'object' &&
        currenciesValue !== null &&
        typeof currenciesValue.gold === 'string' &&
        typeof currenciesValue.spiritStones === 'string' &&
        typeof currenciesValue.merit === 'string');
    if (!currenciesValid) return false;

    const cs = record.combatSettings as Record<string, unknown>;
    if (typeof cs.autoAttack !== 'boolean' || typeof cs.autoCombatAI !== 'boolean') return false;

    // Zone state validation (optional for backward compatibility)
    if ('zoneState' in record && record.zoneState) {
      const zs = record.zoneState as Record<string, unknown>;
      if (!Array.isArray((zs as { unlockedZones?: unknown }).unlockedZones) || typeof zs.zoneProgress !== 'object') return false;
    }

    if ('cityState' in record && record.cityState) {
      const cs = record.cityState as Record<string, unknown>;
      const invalid =
        (cs.currentCityId !== null && typeof cs.currentCityId !== 'string') ||
        !Array.isArray((cs as { unlockedCityIds?: unknown }).unlockedCityIds) ||
        typeof cs.selectedModuleByCity !== 'object' ||
        cs.selectedModuleByCity === null ||
        typeof cs.cityFlagsById !== 'object' ||
        cs.cityFlagsById === null;

      if (invalid) {
        console.warn('[SaveLoad] cityState invalid in save, ignoring section');
      }
    }

    if ('techniqueState' in record && record.techniqueState) {
      const ts = record.techniqueState as Record<string, unknown>;
      if (typeof ts.selectedLoadoutId !== 'string') return false;
      if (!Array.isArray((ts as { loadouts?: unknown }).loadouts)) return false;

      const loadouts = (ts as { loadouts: any[] }).loadouts;
      for (const loadout of loadouts) {
        if (!loadout || typeof loadout !== 'object') return false;
        const typed = loadout as Record<string, unknown>;
        if (typeof typed.id !== 'string' || typeof typed.name !== 'string') return false;
        if (typeof typed.aiProfile !== 'string') return false;
        const slots = typed.slots as Record<string, unknown>;
        if (!slots || typeof slots !== 'object') return false;
        if (!Array.isArray(slots.active) || !Array.isArray(slots.passive)) return false;
        if ('ultimate' in slots && slots.ultimate !== null && typeof slots.ultimate !== 'string')
          return false;
      }
    }

    if ('trialState' in record && record.trialState) {
      const ts = record.trialState as Record<string, unknown>;
      if (typeof ts.progressByTrialId !== 'object' || ts.progressByTrialId === null) return false;

      const progressById = ts.progressByTrialId as Record<string, unknown>;
      for (const value of Object.values(progressById)) {
        if (!value || typeof value !== 'object') return false;
        const progress = value as Record<string, unknown>;

        if (
          typeof progress.attempts !== 'number' ||
          typeof progress.cleared !== 'boolean' ||
          ('lastAttemptAt' in progress && progress.lastAttemptAt !== null && typeof progress.lastAttemptAt !== 'number') ||
          ('lastClearAt' in progress && progress.lastClearAt !== null && typeof progress.lastClearAt !== 'number')
        ) {
          return false;
        }
      }
    }

    if ('ruinsState' in record && record.ruinsState) {
      const rs = record.ruinsState as Record<string, unknown>;
      if (typeof rs.progressByRuinId !== 'object' || rs.progressByRuinId === null) return false;
      if (
        'autoRepeatDefault' in rs &&
        (rs as { autoRepeatDefault?: unknown }).autoRepeatDefault !== undefined &&
        typeof (rs as { autoRepeatDefault?: unknown }).autoRepeatDefault !== 'boolean'
      ) {
        return false;
      }

      const progressById = rs.progressByRuinId as Record<string, unknown>;
      for (const value of Object.values(progressById)) {
        if (!value || typeof value !== 'object') return false;
        const progress = value as Record<string, unknown>;
        if (
          typeof progress.totalRuns !== 'number' ||
          typeof progress.totalRoomsCleared !== 'number' ||
          typeof progress.bossKills !== 'number'
        ) {
          return false;
        }

        if ('bestRunSeconds' in progress && progress.bestRunSeconds !== undefined && typeof progress.bestRunSeconds !== 'number') {
          return false;
        }

        if ('lastRun' in progress && progress.lastRun !== undefined) {
          const lr = progress.lastRun as any;
          if (
            !lr ||
            typeof lr.endedAt !== 'number' ||
            typeof lr.victory !== 'boolean' ||
            typeof lr.roomsCleared !== 'number' ||
            typeof lr.seconds !== 'number'
          ) {
            return false;
          }
        }
      }
    }

    if ('shopState' in record && record.shopState) {
      const ss = record.shopState as Record<string, unknown>;
      if (typeof ss.dayKey !== 'string') return false;
      if (typeof ss.purchasedToday !== 'object' || ss.purchasedToday === null) return false;
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
    const prestigeStore = usePrestigeStore.getState();
    const gameStore = useGameStore.getState();

    // Restore spirit root (fallback to reroll for old saves)
    const spiritRoot = saveData.prestigeState?.spiritRoot ?? saveData.gameState.spiritRoot;
    if (spiritRoot && typeof spiritRoot.grade === 'number' && spiritRoot.element) {
      usePrestigeStore.setState({ spiritRoot, rerollCount: saveData.prestigeState?.rerollCount ?? 0 });
    } else {
      prestigeStore.generateSpiritRoot();
    }

    if (saveData.prestigeState) {
      const prestigeState = saveData.prestigeState;
      usePrestigeStore.setState((state) => {
        state.totalAP = prestigeState.totalAP;
        state.lifetimeAP = prestigeState.lifetimeAP;
        state.currentRunAP = prestigeState.currentRunAP;
        state.prestigeCount = prestigeState.prestigeCount;
        state.prestigeRuns = prestigeState.prestigeRuns || [];
        state.upgrades = { ...state.upgrades, ...(prestigeState.upgrades || {}) };
        state.highestRealmReached = prestigeState.highestRealmReached;
        state.runStartTime = prestigeState.runStartTime;
        state.rerollCount = prestigeState.rerollCount;
      });
    }

    // Apply to game store
    useGameStore.setState({
      realm: saveData.gameState.realm,
      qi: saveData.gameState.qi,
      selectedPath: saveData.gameState.selectedPath,
      lifePath: saveData.gameState.lifePath ?? null,
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
      lastTickTime: saveData.gameState.lastTickTime || Date.now(),
      lastActiveTime: saveData.gameState.lastActiveTime || Date.now(),
      runStartTime: saveData.gameState.runStartTime || prestigeStore.runStartTime,
    });

    // Apply to inventory store
    useInventoryStore.setState((state) => {
      const savedItems = saveData.inventoryState.items as unknown;
      const nextItems: Record<string, number> = {};

      if (Array.isArray(savedItems)) {
        for (const entry of savedItems as Array<{ itemId?: string; quantity?: number }>) {
          if (!entry || typeof entry.itemId !== 'string') continue;
          const qty = Math.floor(entry.quantity ?? 0);
          if (Number.isNaN(qty) || qty <= 0) continue;
          nextItems[entry.itemId] = (nextItems[entry.itemId] || 0) + qty;
        }
      } else if (savedItems && typeof savedItems === 'object') {
        Object.entries(savedItems as Record<string, unknown>).forEach(([itemId, qty]) => {
          if (typeof itemId !== 'string') return;
          const amount = Math.floor(typeof qty === 'number' ? qty : 0);
          if (Number.isNaN(amount) || amount <= 0) return;
          nextItems[itemId] = amount;
        });
      }

      const savedCurrencies = (saveData.inventoryState as { currencies?: Record<string, unknown> }).currencies;
      const gold =
        typeof savedCurrencies?.gold === 'string'
          ? savedCurrencies.gold
          : typeof (saveData.inventoryState as { gold?: unknown }).gold === 'string'
            ? (saveData.inventoryState as { gold?: string }).gold!
            : '0';
      const spiritStones =
        typeof savedCurrencies?.spiritStones === 'string'
          ? savedCurrencies.spiritStones
          : typeof (saveData.inventoryState as { spiritStones?: unknown }).spiritStones === 'string'
            ? (saveData.inventoryState as { spiritStones?: string }).spiritStones!
            : '0';
      const merit =
        typeof savedCurrencies?.merit === 'string'
          ? savedCurrencies.merit
          : typeof (saveData.inventoryState as { merit?: unknown }).merit === 'string'
            ? (saveData.inventoryState as { merit?: string }).merit!
            : '0';

      state.currencies = {
        gold,
        spiritStones,
        merit,
      };
      state.items = nextItems;
      state.gold = gold;
      state.spiritStones = spiritStones;
      state.merit = merit;
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
      useTechniqueStore.setState((state) => ({
        loadouts: saveData.techniqueState.loadouts ?? state.loadouts,
        selectedLoadoutId: saveData.techniqueState.selectedLoadoutId || state.selectedLoadoutId,
      }));
    }

    if (saveData.trialState?.progressByTrialId) {
      useTrialStore.setState({
        progressByTrialId: saveData.trialState.progressByTrialId,
      });
    }

    if (saveData.ruinsState?.progressByRuinId) {
      useRuinsStore.setState({
        progressByRuinId: saveData.ruinsState.progressByRuinId,
        autoRepeatDefault: saveData.ruinsState.autoRepeatDefault ?? true,
        activeRun: null,
      });
    }

    const shopState =
      saveData.shopState ?? ({ dayKey: getDayKey(), purchasedToday: {} } as SaveData['shopState']);
    if (shopState) {
      useShopStore.getState().hydrate(shopState);
    }

    const collectionState = saveData.techCollectionState ?? {
      unlockedTechs: {},
      fragments: {},
      rngSeed: undefined,
    };
    useTechCollectionStore.getState().hydrate(collectionState);

    // Recalculate derived values after hydration
    gameStore.calculateQiPerSecond();
    gameStore.calculatePlayerStats();

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

    useInventoryStore.getState().hardResetInventory();

    useCombatStore.setState({
      autoAttack: false,
      autoCombatAI: false,
    });

    useCityStore.getState().hardResetCity();

    useTrialStore.getState().hardResetTrials();

    useRuinsStore.getState().hardResetRuins();

    useShopStore.getState().hardResetShop();

    try {
      useTechCollectionStore.getState().hardReset();
    } catch (error) {
      console.warn('[deleteSave] Failed to reset technique collection', error);
    }

    console.log('[SaveLoad] All saves deleted and game reset');
    return true;
  } catch (error) {
    console.error('[SaveLoad] Delete save failed:', error);
    return false;
  }
}

/**
 * Delete all save data and fully reset the game to a fresh install state.
 */
export function deleteSaveAndHardReset(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_A_KEY);
    localStorage.removeItem(BACKUP_B_KEY);
    localStorage.removeItem(BACKUP_C_KEY);
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to remove save keys', error);
  }

  try {
    useGameStore.getState().hardResetGameState();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset game state', error);
  }

  try {
    useInventoryStore.getState().hardResetInventory();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset inventory', error);
  }

  try {
    useCombatStore.getState().hardResetCombat();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset combat', error);
  }

  try {
    useCityStore.getState().hardResetCity();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset city state', error);
  }

  try {
    useTrialStore.getState().hardResetTrials();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset trial state', error);
  }

  try {
    useRuinsStore.getState().hardResetRuins();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset ruins state', error);
  }

  try {
    useShopStore.getState().hardResetShop();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset shop state', error);
  }

  try {
    useZoneStore.getState().hardResetZones();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset zones', error);
  }

  try {
    useDungeonStore.getState().hardResetDungeons();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset dungeons', error);
  }

  try {
    useTechniqueStore.getState().resetLoadouts();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset technique loadouts', error);
  }

  try {
    useTechCollectionStore.getState().hardReset();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset technique collection', error);
  }

  try {
    usePrestigeStore.getState().hardResetPrestige();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset prestige', error);
  }

  try {
    useUIStore.getState().hardResetUI();
  } catch (error) {
    console.warn('[deleteSaveAndHardReset] Failed to reset UI state', error);
  }

  window.location.reload();
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
