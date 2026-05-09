import {
  useGameStore,
  initializeGameStore,
  setPrestigeStoreGetter,
  setCombatStoreGetter,
  setInventoryStoreGetter as setGameInventoryStoreGetter,
} from '../stores/gameStore.js';
import { useCombatStore } from '../stores/combatStore.js';
import {
  usePrestigeStore,
  setInventoryStoreGetter as setPrestigeInventoryStoreGetter,
  setGameStoreGetter,
} from '../stores/prestigeStore.js';
import { useInventoryStore } from '../stores/inventoryStore.js';
import { useExpeditionStore } from '../stores/expeditionStore.js';
import { useManualSatchelStore } from '../stores/manualSatchelStore.js';
import { useCraftSessionStore } from '../stores/craftSessionStore.js';
import { SaveService } from '../services/save/SaveService.js';
import { cultivationService } from '../services/cultivationService.js';
import { useUIStore } from '../stores/uiStore.js';
import { useActivityStore } from '../stores/activityStore.js';
import { RewardService } from '../services/rewards/index.js';
import { COMBAT_ACTIVITY_TYPES } from '../types/activity.js';

/**
 * Game loop constants
 */
const CULTIVATION_TICK_INTERVAL = 1000;  // 1 second in milliseconds
const AUTOSAVE_INTERVAL = 60000;         // 60 seconds in milliseconds
const MAX_DELTA_TIME = 1000;             // Max 1 second delta to prevent time exploits
/**
 * Main game loop managing all game ticking and updates
 */
class GameLoop {
  private lastTick: number = Date.now();
  private rafId: number | null = null;
  private cultivationIntervalId: number | null = null;
  private autosaveIntervalId: number | null = null;
  private isRunning: boolean = false;

  /**
   * Start the game loop
   * Initializes RAF loop, cultivation tick, and autosave
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[GameLoop] Already running');
      return;
    }

    console.log('[GameLoop] Starting game loop...');

    this.isRunning = true;
    this.lastTick = Date.now();

    // Start RAF loop for smooth updates
    this.startRafLoop();

    // Start cultivation tick (1 second interval)
    this.startCultivationTick();

    // Start autosave (60 second interval)
    this.startAutosave();

    console.log('[GameLoop] Game loop started');
  }

  /**
   * Stop the game loop
   * Cleans up all intervals and RAF
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('[GameLoop] Already stopped');
      return;
    }

    console.log('[GameLoop] Stopping game loop...');

    this.isRunning = false;

    // Stop RAF loop
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Stop cultivation tick
    if (this.cultivationIntervalId !== null) {
      clearInterval(this.cultivationIntervalId);
      this.cultivationIntervalId = null;
    }

    // Stop autosave
    if (this.autosaveIntervalId !== null) {
      clearInterval(this.autosaveIntervalId);
      this.autosaveIntervalId = null;
    }

    console.log('[GameLoop] Game loop stopped');
  }

  /**
   * Start the RAF (requestAnimationFrame) loop
   */
  private startRafLoop(): void {
    const loop = () => {
      if (!this.isRunning) return;

      this.tick();
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Main tick function called by RAF (~60fps)
   * Updates all stores with delta time
   */
  private tick(): void {
    const now = Date.now();
    let deltaTime = now - this.lastTick;

    // Clamp delta time to prevent time exploits
    if (deltaTime > MAX_DELTA_TIME) {
      console.warn(`[GameLoop] Delta time clamped from ${deltaTime}ms to ${MAX_DELTA_TIME}ms`);
      deltaTime = MAX_DELTA_TIME;
    }

    // Prevent negative delta time
    if (deltaTime < 0) {
      console.warn('[GameLoop] Negative delta time detected, resetting');
      deltaTime = 0;
      this.lastTick = now;
      return;
    }

    // Update last tick time
    this.lastTick = now;

    // Update all stores
    try {
      // Update game store (HP regen, etc.)
      const gameState = useGameStore.getState();
      gameState.tick(deltaTime);

      cultivationService.tick(deltaTime);

      // Update combat store (attacks, cooldowns)
      const combatState = useCombatStore.getState();
      const activeActivity = useActivityStore.getState().active;
      const isCombatActivityActive = activeActivity
        ? COMBAT_ACTIVITY_TYPES.includes(activeActivity.type)
        : false;

      if (isCombatActivityActive) {
        combatState.tick(deltaTime);
      }
    } catch (error) {
      console.error('[GameLoop] Error in tick:', error);
    }
  }

  /**
   * Start cultivation tick interval
   * Called every 1 second to add Qi
   */
  private startCultivationTick(): void {
    this.cultivationIntervalId = window.setInterval(() => {
      this.cultivationTick();
    }, CULTIVATION_TICK_INTERVAL);
  }

  /**
   * Cultivation tick function
   * Adds Qi based on Qi/s every second
   */
  private cultivationTick(): void {
    try {
      // The actual Qi addition is handled in gameStore.tick()
      // This is just a heartbeat to ensure regular updates

      // We could add additional cultivation logic here in the future
      // For now, the gameStore.tick() handles Qi generation
      useExpeditionStore.getState().tick(Date.now());
      useManualSatchelStore.getState().tick(Date.now());
      useCraftSessionStore.getState().tick(Date.now());
    } catch (error) {
      console.error('[GameLoop] Error in cultivation tick:', error);
    }
  }

  /**
   * Start autosave interval
   * Saves game every 60 seconds
   */
  private startAutosave(): void {
    this.autosaveIntervalId = window.setInterval(() => {
      this.autosaveTick();
    }, AUTOSAVE_INTERVAL);
  }

  /**
   * Autosave tick function
   * Called every 60 seconds to save game
   */
  private autosaveTick(): void {
    try {
      const success = SaveService.save();
      if (success) {
        console.log('[GameLoop] Game autosaved');
      } else {
        console.warn('[GameLoop] Autosave failed');
      }
    } catch (error) {
      console.error('[GameLoop] Error in autosave:', error);
    }
  }

  /**
   * Check if game loop is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Singleton game loop instance
 */
export const gameLoop = new GameLoop();

/**
 * Initialize the game
 * Loads save data, applies offline progress, starts game loop
 *
 * @returns True if initialization successful, false otherwise
 */
export function initializeGame(): boolean {
  try {
    console.log('[GameLoop] Initializing game...');

    // Initialize game store (calculate derived values)
    initializeGameStore();

    // Wire cross-store getters to avoid circular initialization issues
    setGameStoreGetter(() => useGameStore.getState());
    setPrestigeStoreGetter(() => usePrestigeStore.getState());
    setCombatStoreGetter(() => useCombatStore.getState());
    setGameInventoryStoreGetter(() => useInventoryStore.getState());
    setPrestigeInventoryStoreGetter(() => useInventoryStore.getState());
    console.log('[GameLoop] Store dependencies wired');

    // Initialize prestige store upgrades
    usePrestigeStore.getState().initializeUpgrades();
    console.log('[GameLoop] Prestige store initialized');

    // Align prestige run timer with current run state
    usePrestigeStore.setState({ runStartTime: useGameStore.getState().runStartTime });

    // Generate spirit root if none exists
    const prestigeStore = usePrestigeStore.getState();
    if (!prestigeStore.spiritRoot) {
      prestigeStore.generateSpiritRoot();
      console.log('[GameLoop] Generated initial spirit root');
    }

    // Check if save exists
    const saveExists = SaveService.hasSave();

    if (saveExists) {
      console.log('[GameLoop] Save found, loading...');

      // Load save data
      const loadSuccess = SaveService.load();

      if (loadSuccess) {
        console.log('[GameLoop] Save loaded successfully');

        const offlineSummary = useUIStore.getState().lastOfflineSummary;
        if (offlineSummary) {
          const qiPart = offlineSummary.parts.find((part) => part.label.toLowerCase().includes('qi'));
          if (qiPart) {
            useUIStore.getState().addNotification('info', `Offline: ${qiPart.value}`, 5000);
          }
        }

        const now = Date.now();
        useGameStore.setState({ lastActiveTime: now, lastTickTime: now });
        useManualSatchelStore.getState().tick(now);
        SaveService.save();
      } else {
        console.warn('[GameLoop] Failed to load save, starting fresh');
        const loadFailure = SaveService.getLastLoadFailure();
        if (loadFailure) {
          useUIStore.getState().addNotification(
            'warning',
            `Save load failed (${loadFailure.code}). Started a fresh session.`,
            7000,
          );
        }
      }
    } else {
      console.log('[GameLoop] No save found, starting new game');

      // Add starter items for fresh runs only. Save subscriptions are wired after
      // bootstrap so this grant cannot create a half-initialized no-path save.
      const inventoryStore = useInventoryStore.getState();
      if (Object.keys(inventoryStore.items).length === 0) {
        RewardService.grantRewards(
          {
            currencies: { gold: '1000' },
            items: [
              { itemId: 'rusty_sword', qty: 1 },
              { itemId: 'worn_talisman', qty: 1 },
              { itemId: 'health_pill', qty: 5 },
              { itemId: 'spirit_stone', qty: 10 },
            ],
          },
          'Game start: starter pack',
        );
        console.log('[GameLoop] Added starter items to inventory');
      }
    }

    SaveService.initializeSubscriptions();

    // Start the game loop
    gameLoop.start();

    // Set up save on page unload
    setupBeforeUnload();
    setupActivityTracking();

    console.log('[GameLoop] Game initialized successfully');
    return true;
  } catch (error) {
    console.error('[GameLoop] Failed to initialize game:', error);
    return false;
  }
}

/**
 * Set up window.onbeforeunload to save game when player closes tab
 */
function setupBeforeUnload(): void {
  window.addEventListener('beforeunload', () => {
    console.log('[GameLoop] Page unloading, saving game...');

    try {
      useGameStore.setState({
        lastActiveTime: Date.now(),
        lastTickTime: Date.now(),
      });

      // Save the game
    const success = SaveService.save();

      if (success) {
        console.log('[GameLoop] Game saved on exit');
      } else {
        console.warn('[GameLoop] Failed to save on exit');
      }

      // Stop the game loop
      gameLoop.stop();
    } catch (error) {
      console.error('[GameLoop] Error saving on exit:', error);
    }

    // Note: Modern browsers ignore custom messages in beforeunload
  });
}

/**
 * Track when the page becomes hidden to accurately record last active time
 */
function setupActivityTracking(): void {
  const updateLastActive = () => {
    useGameStore.setState({
      lastActiveTime: Date.now(),
      lastTickTime: Date.now(),
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      updateLastActive();
    }
  });

  window.addEventListener('pagehide', updateLastActive);
}

/**
 * Clean shutdown of the game
 * Saves and stops the game loop
 */
export function shutdownGame(): void {
  console.log('[GameLoop] Shutting down game...');

  try {
    // Save the game
    SaveService.save();

    // Stop the game loop
    gameLoop.stop();

    console.log('[GameLoop] Game shut down successfully');
  } catch (error) {
    console.error('[GameLoop] Error during shutdown:', error);
  }
}

/**
 * Reset the game loop
 * Stops and restarts the loop
 */
export function resetGameLoop(): void {
  console.log('[GameLoop] Resetting game loop...');

  gameLoop.stop();
  gameLoop.start();

  console.log('[GameLoop] Game loop reset');
}
