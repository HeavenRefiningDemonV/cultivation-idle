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
import { PERF_LABELS, incrementCounter, recordMeasure, startTimer } from '../services/performance/index.js';
import { SimulationScheduler, type ScheduledJobRunContext } from '../services/time/SimulationScheduler.js';
import { trackProgressionGateAvailabilityNow } from '../services/diagnostics/progressionGateAvailability.js';

/**
 * Game loop constants
 */
const CULTIVATION_TICK_INTERVAL = 1000;  // 1 second in milliseconds
const AUTOSAVE_INTERVAL = 60000;         // 60 seconds in milliseconds
const AUTHORITATIVE_CULTIVATION_INTERVAL = 250;
const COMBAT_FIXED_STEP_INTERVAL = 100;
const PROGRESSION_DIAGNOSTICS_INTERVAL = 1000;
export type SimulationJobDependencies = {
  gameTick: (elapsedMs: number) => void;
  cultivationTick: (elapsedMs: number) => void;
  combatTick: (elapsedMs: number) => void;
  queueTick: (nowWall: number) => void;
  progressionDiagnosticsTick: (nowWall: number) => void;
  autosaveTick: () => boolean;
  nowWall: () => number;
  isCombatActivityActive: () => boolean;
};

export type GameLoopDependencies = SimulationJobDependencies & {
  scheduler: SimulationScheduler;
  requestAnimationFrame: (callback: () => void) => number;
  cancelAnimationFrame: (id: number) => void;
};

export function isCombatActivityActiveForScheduler(): boolean {
  const activeActivity = useActivityStore.getState().active;
  return activeActivity ? COMBAT_ACTIVITY_TYPES.includes(activeActivity.type) : false;
}

function defaultQueueTick(nowWall: number): void {
  const endTick = startTimer(PERF_LABELS.gameLoopOneSecondJobs);
  try {
    useExpeditionStore.getState().tick(nowWall);
    useManualSatchelStore.getState().tick(nowWall);
    useCraftSessionStore.getState().tick(nowWall);
  } catch (error) {
    console.error('[GameLoop] Error in queues-and-expeditions tick:', error);
  } finally {
    endTick();
  }
}

function defaultAutosaveTick(): boolean {
  const endTick = startTimer(PERF_LABELS.gameLoopAutoSaveInterval);
  try {
    incrementCounter(PERF_LABELS.gameLoopAutoSaveInterval);
    const success = SaveService.save('autosave');
    if (success) {
      console.log('[GameLoop] Game autosaved');
    } else {
      console.warn('[GameLoop] Autosave failed');
    }
    return success;
  } catch (error) {
    console.error('[GameLoop] Error in autosave:', error);
    return false;
  } finally {
    endTick();
  }
}

function createDefaultGameLoopDependencies(): GameLoopDependencies {
  return {
    scheduler: new SimulationScheduler(),
    requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
    cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
    gameTick: (elapsedMs) => {
      const endTick = startTimer(PERF_LABELS.gameLoopTick);
      try {
        recordMeasure(PERF_LABELS.gameLoopTickDeltaMs, elapsedMs);
        useGameStore.getState().tick(elapsedMs);
      } catch (error) {
        console.error('[GameLoop] Error in game store tick:', error);
      } finally {
        endTick();
      }
    },
    cultivationTick: (elapsedMs) => {
      try {
        cultivationService.tick(elapsedMs);
      } catch (error) {
        console.error('[GameLoop] Error in cultivation service tick:', error);
      }
    },
    combatTick: (elapsedMs) => {
      try {
        useCombatStore.getState().tick(elapsedMs);
      } catch (error) {
        console.error('[GameLoop] Error in combat tick:', error);
      }
    },
    queueTick: defaultQueueTick,
    progressionDiagnosticsTick: trackProgressionGateAvailabilityNow,
    autosaveTick: defaultAutosaveTick,
    nowWall: () => Date.now(),
    isCombatActivityActive: isCombatActivityActiveForScheduler,
  };
}

export function registerSimulationSchedulerJobs(
  scheduler: SimulationScheduler,
  deps: SimulationJobDependencies,
): void {
  scheduler.clearJobs();

  scheduler.register({
    name: 'cultivation-authoritative',
    intervalMs: AUTHORITATIVE_CULTIVATION_INTERVAL,
    maxCatchupMs: 1000,
    maxStepsPerDrain: 4,
    runWhenHidden: false,
    priority: 'critical',
    run: ({ elapsedMs }: ScheduledJobRunContext) => {
      deps.gameTick(elapsedMs);
      deps.cultivationTick(elapsedMs);
    },
  });

  scheduler.register({
    name: 'combat-fixed-step',
    intervalMs: COMBAT_FIXED_STEP_INTERVAL,
    maxCatchupMs: 250,
    maxStepsPerDrain: 2,
    runWhenHidden: false,
    priority: 'critical',
    enabled: deps.isCombatActivityActive,
    run: ({ elapsedMs }: ScheduledJobRunContext) => {
      deps.combatTick(elapsedMs);
    },
  });

  scheduler.register({
    name: 'queues-and-expeditions',
    intervalMs: CULTIVATION_TICK_INTERVAL,
    maxCatchupMs: CULTIVATION_TICK_INTERVAL,
    maxStepsPerDrain: 1,
    runWhenHidden: false,
    priority: 'normal',
    run: ({ nowWall }: ScheduledJobRunContext) => {
      deps.queueTick(nowWall);
    },
  });

  scheduler.register({
    name: 'progression-diagnostics',
    intervalMs: PROGRESSION_DIAGNOSTICS_INTERVAL,
    maxCatchupMs: PROGRESSION_DIAGNOSTICS_INTERVAL,
    maxStepsPerDrain: 1,
    runWhenHidden: false,
    priority: 'background',
    run: ({ nowWall }: ScheduledJobRunContext) => {
      deps.progressionDiagnosticsTick(nowWall);
    },
  });

  scheduler.register({
    name: 'autosave',
    intervalMs: AUTOSAVE_INTERVAL,
    maxCatchupMs: AUTOSAVE_INTERVAL,
    maxStepsPerDrain: 1,
    runWhenHidden: false,
    priority: 'background',
    run: () => {
      deps.autosaveTick();
    },
  });
}

/**
 * Main game loop managing app lifecycle, visual rAF, and scheduled simulation jobs.
 */
export class GameLoop {
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private readonly deps: GameLoopDependencies;

  constructor(deps: GameLoopDependencies = createDefaultGameLoopDependencies()) {
    this.deps = deps;
  }

  public start(): void {
    if (this.isRunning) {
      console.warn('[GameLoop] Already running');
      return;
    }

    console.log('[GameLoop] Starting game loop...');
    this.isRunning = true;
    registerSimulationSchedulerJobs(this.deps.scheduler, this.deps);
    this.deps.scheduler.start();
    this.startRafLoop();
    console.log('[GameLoop] Game loop started');
  }

  public stop(): void {
    if (!this.isRunning) {
      console.warn('[GameLoop] Already stopped');
      return;
    }

    console.log('[GameLoop] Stopping game loop...');
    this.isRunning = false;

    if (this.rafId !== null) {
      this.deps.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.deps.scheduler.stop();
    this.deps.scheduler.clearJobs();
    console.log('[GameLoop] Game loop stopped');
  }

  private startRafLoop(): void {
    const loop = () => {
      if (!this.isRunning) return;
      incrementCounter(PERF_LABELS.gameLoopRafCallback);
      this.rafId = this.deps.requestAnimationFrame(loop);
    };

    this.rafId = this.deps.requestAnimationFrame(loop);
  }

  public setHidden(hidden: boolean): void {
    this.deps.scheduler.setHidden(hidden);
  }

  public getScheduler(): SimulationScheduler {
    return this.deps.scheduler;
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

export function createGameLoop(deps: GameLoopDependencies): GameLoop {
  return new GameLoop(deps);
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
        SaveService.save('offline-summary-bootstrap');
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
      const success = SaveService.save('beforeunload');

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
    gameLoop.setHidden(document.hidden);
  });

  window.addEventListener('pagehide', () => {
    updateLastActive();
    gameLoop.setHidden(true);
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
    SaveService.save('shutdown');

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
