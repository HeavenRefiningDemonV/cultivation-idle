import { useGameStore, initializeGameStore, setPrestigeStoreGetter } from '../stores/gameStore';
import { useCombatStore } from '../stores/combatStore';
import { usePrestigeStore, setInventoryStoreGetter } from '../stores/prestigeStore';
import { useTechniqueStore, setTechniqueStoreDependencies } from '../stores/techniqueStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { saveGame, loadGame, hasSave } from '../utils/saveload';
import { applyOfflineProgress } from './offline';
import { useUIStore } from '../stores/uiStore';

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

      // Update combat store (attacks, cooldowns)
      const combatState = useCombatStore.getState();
      combatState.tick(deltaTime);

      // Update technique store (intent regen, auto-cast)
      const techniqueState = useTechniqueStore.getState();
      techniqueState.updateTechniques(deltaTime);
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
      const success = saveGame();
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

    // Initialize prestige store upgrades
    usePrestigeStore.getState().initializeUpgrades();
    console.log('[GameLoop] Prestige store initialized');

    // Register prestige store with game store
    setPrestigeStoreGetter(() => usePrestigeStore.getState());

    // Align prestige run timer with current run state
    usePrestigeStore.setState({ runStartTime: useGameStore.getState().runStartTime });

    // Initialize technique store
    useTechniqueStore.getState().initializeTechniques();
    console.log('[GameLoop] Technique store initialized');

    // Set up technique store dependencies
    setTechniqueStoreDependencies(
      () => useCombatStore.getState(),
      () => useGameStore.getState()
    );
    console.log('[GameLoop] Technique store dependencies set');

    // Set up prestige store dependency on inventory store
    setInventoryStoreGetter(() => useInventoryStore.getState());
    console.log('[GameLoop] Prestige store dependencies set');

    // Generate spirit root if none exists
    const prestigeStore = usePrestigeStore.getState();
    if (!prestigeStore.spiritRoot) {
      prestigeStore.generateSpiritRoot();
      console.log('[GameLoop] Generated initial spirit root');
    }

    // Add starter items for testing (only if inventory is empty)
    const inventoryStore = useInventoryStore.getState();
    if (inventoryStore.items.length === 0) {
      inventoryStore.addItem('rusty_sword', 1);
      inventoryStore.addItem('worn_talisman', 1);
      inventoryStore.addItem('health_pill', 5);
      inventoryStore.addItem('spirit_stone', 10);
      inventoryStore.addGold('1000');
      console.log('[GameLoop] Added starter items to inventory');
    }

    // Check if save exists
    const saveExists = hasSave();

    if (saveExists) {
      console.log('[GameLoop] Save found, loading...');

      // Load save data
      const loadSuccess = loadGame();

      if (loadSuccess) {
        console.log('[GameLoop] Save loaded successfully');

        // Apply offline progress
        const offlineProgress = applyOfflineProgress();

        if (offlineProgress) {
          console.log('[GameLoop] Offline progress applied:');
          console.log(`  - Duration: ${offlineProgress.offlineDuration}`);
          console.log(`  - Qi gained: ${offlineProgress.qiGained}`);
          console.log(`  - Efficiency: ${offlineProgress.efficiency * 100}%`);
          if (offlineProgress.wasCapped) {
            console.log('  - Offline time was capped at 12 hours');
          }
          if (offlineProgress.offlineSeconds >= 5 * 60) {
            try {
              useUIStore.getState().showOfflineProgress(offlineProgress);
            } catch (error) {
              console.warn('[GameLoop] Unable to show offline progress modal', error);
            }
          }
        } else {
          console.log('[GameLoop] No offline progress to apply');
        }
      } else {
        console.warn('[GameLoop] Failed to load save, starting fresh');
      }
    } else {
      console.log('[GameLoop] No save found, starting new game');
    }

    // Start the game loop
    gameLoop.start();

    // Set up save on page unload
    setupBeforeUnload();
    setupVisibilityTracking();

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
      const now = Date.now();
      useGameStore.setState({ lastActiveTime: now, lastTickTime: now });

      // Save the game
      const success = saveGame();

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
 * Track tab visibility to keep last active time accurate
 */
function setupVisibilityTracking(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const now = Date.now();
      useGameStore.setState({ lastActiveTime: now, lastTickTime: now });
      saveGame();
    } else {
      const now = Date.now();
      useGameStore.setState({ lastActiveTime: now, lastTickTime: now });
    }
  });
}

/**
 * Clean shutdown of the game
 * Saves and stops the game loop
 */
export function shutdownGame(): void {
  console.log('[GameLoop] Shutting down game...');

  try {
    // Save the game
    saveGame();

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
