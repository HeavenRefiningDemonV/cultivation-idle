import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Zone progress data
 */
export interface ZoneProgress {
  enemiesDefeated: number;          // Total enemies killed in zone
  enemyKills: Record<string, number>; // Kills per enemy type
  bossDefeated: boolean;             // Boss killed
  completed: boolean;                // Zone fully completed
  firstClearTime?: number;           // Timestamp of first completion
}

/**
 * Zone state interface
 */
export interface ZoneState {
  // Zone tracking
  unlockedZones: string[];           // List of unlocked zone IDs
  currentZone: string | null;        // Currently active zone
  zoneProgress: Record<string, ZoneProgress>; // Progress per zone

  // Actions
  unlockZone: (zoneId: string) => void;
  enterZone: (zoneId: string) => void;
  exitZone: () => void;
  recordEnemyDefeat: (zoneId: string, enemyId: string) => void;
  recordBossDefeat: (zoneId: string, realmIndex: number) => void;
  isBossAvailable: (zoneId: string) => boolean;
  isZoneUnlocked: (zoneId: string) => boolean;
  isZoneCompleted: (zoneId: string) => boolean;
  getZoneProgress: (zoneId: string) => ZoneProgress;
  getTotalEnemiesDefeated: (zoneId: string) => number;
  resetZoneProgress: (zoneId: string) => void;
}

/**
 * Default zone progress
 */
const createDefaultZoneProgress = (): ZoneProgress => ({
  enemiesDefeated: 0,
  enemyKills: {},
  bossDefeated: false,
  completed: false,
});

/**
 * Initial unlocked zones (first zone is always unlocked)
 */
const INITIAL_UNLOCKED_ZONES = ['training_forest'];

/**
 * Enemies required to unlock boss
 */
const BOSS_UNLOCK_THRESHOLD = 10;

/**
 * Zone unlock requirements (zone ID -> previous zone that must be completed)
 */
export const ZONE_UNLOCK_REQUIREMENTS: Record<string, string> = {
  training_forest: '', // Always unlocked
  spirit_cavern: 'training_forest',
  mystic_mountains: 'spirit_cavern',
};

export const ZONE_REALM_REQUIREMENTS: Record<string, number> = {
  training_forest: 0,
  spirit_cavern: 1,
  mystic_mountains: 2,
};

/**
 * Zone store for tracking progression and unlocks
 */
export const useZoneStore = create<ZoneState>()(
  immer((set, get) => ({
    // Initial state
    unlockedZones: INITIAL_UNLOCKED_ZONES,
    currentZone: null,
    zoneProgress: {},

    /**
     * Unlock a zone
     */
    unlockZone: (zoneId: string) => {
      const state = get();

      if (state.unlockedZones.includes(zoneId)) {
        console.log(`[ZoneStore] Zone ${zoneId} already unlocked`);
        return;
      }

      set((state) => {
        state.unlockedZones.push(zoneId);

        // Initialize zone progress if not exists
        if (!state.zoneProgress[zoneId]) {
          state.zoneProgress[zoneId] = createDefaultZoneProgress();
        }
      });

      console.log(`[ZoneStore] Zone ${zoneId} unlocked`);
    },

    /**
     * Enter a zone
     */
    enterZone: (zoneId: string) => {
      const state = get();

      if (!state.unlockedZones.includes(zoneId)) {
        console.warn(`[ZoneStore] Cannot enter locked zone: ${zoneId}`);
        return;
      }

      set((state) => {
        state.currentZone = zoneId;

        // Initialize zone progress if not exists
        if (!state.zoneProgress[zoneId]) {
          state.zoneProgress[zoneId] = createDefaultZoneProgress();
        }
      });

      console.log(`[ZoneStore] Entered zone: ${zoneId}`);
    },

    /**
     * Exit current zone
     */
    exitZone: () => {
      const currentZone = get().currentZone;

      set((state) => {
        state.currentZone = null;
      });

      console.log(`[ZoneStore] Exited zone: ${currentZone}`);
    },

    /**
     * Record an enemy defeat
     */
    recordEnemyDefeat: (zoneId: string, enemyId: string) => {
      set((state) => {
        // Initialize zone progress if not exists
        if (!state.zoneProgress[zoneId]) {
          state.zoneProgress[zoneId] = createDefaultZoneProgress();
        }

        const progress = state.zoneProgress[zoneId];

        // Increment total enemies defeated
        progress.enemiesDefeated++;

        // Increment specific enemy kills
        if (!progress.enemyKills[enemyId]) {
          progress.enemyKills[enemyId] = 0;
        }
        progress.enemyKills[enemyId]++;
      });

      const totalKills = get().zoneProgress[zoneId]?.enemiesDefeated || 0;
      console.log(`[ZoneStore] Enemy defeated in ${zoneId}: ${enemyId} (Total: ${totalKills})`);

      // Check if boss is now available
      if (totalKills === BOSS_UNLOCK_THRESHOLD) {
        console.log(`[ZoneStore] Boss unlocked in ${zoneId}! (${BOSS_UNLOCK_THRESHOLD} enemies defeated)`);
      }
    },

    /**
     * Record a boss defeat
     */
    recordBossDefeat: (zoneId: string, realmIndex: number) => {
      set((state) => {
        // Initialize zone progress if not exists
        if (!state.zoneProgress[zoneId]) {
          state.zoneProgress[zoneId] = createDefaultZoneProgress();
        }

        const progress = state.zoneProgress[zoneId];

        // Mark boss as defeated
        progress.bossDefeated = true;

        // Mark zone as completed
        if (!progress.completed) {
          progress.completed = true;
          progress.firstClearTime = Date.now();
        }
      });

      console.log(`[ZoneStore] Boss defeated in ${zoneId}! Zone completed.`);

      // Unlock next zone
      const nextZoneId = Object.keys(ZONE_UNLOCK_REQUIREMENTS).find(
        (key) => ZONE_UNLOCK_REQUIREMENTS[key] === zoneId
      );

      if (nextZoneId) {
        const requiredRealm = ZONE_REALM_REQUIREMENTS[nextZoneId] ?? 0;
        const currentRealmIndex = realmIndex;

        if (currentRealmIndex >= requiredRealm) {
          get().unlockZone(nextZoneId);
        } else {
          console.log(
            `[ZoneStore] ${nextZoneId} requires realm ${requiredRealm} before unlocking.`
          );
        }
      }
    },

    /**
     * Check if boss is available in a zone
     * Requires 10 enemy kills first
     */
    isBossAvailable: (zoneId: string) => {
      const state = get();
      const progress = state.zoneProgress[zoneId];

      if (!progress) {
        return false;
      }

      // Boss is available if:
      // 1. Not already defeated
      // 2. Enough enemies killed (10+)
      return !progress.bossDefeated && progress.enemiesDefeated >= BOSS_UNLOCK_THRESHOLD;
    },

    /**
     * Check if zone is unlocked
     */
    isZoneUnlocked: (zoneId: string) => {
      return get().unlockedZones.includes(zoneId);
    },

    /**
     * Check if zone is completed
     */
    isZoneCompleted: (zoneId: string) => {
      const progress = get().zoneProgress[zoneId];
      return progress?.completed || false;
    },

    /**
     * Get zone progress
     */
    getZoneProgress: (zoneId: string) => {
      const state = get();
      return state.zoneProgress[zoneId] || createDefaultZoneProgress();
    },

    /**
     * Get total enemies defeated in zone
     */
    getTotalEnemiesDefeated: (zoneId: string) => {
      const progress = get().zoneProgress[zoneId];
      return progress?.enemiesDefeated || 0;
    },

    /**
     * Reset zone progress (for prestige or testing)
     */
    resetZoneProgress: (zoneId: string) => {
      set((state) => {
        state.zoneProgress[zoneId] = createDefaultZoneProgress();
      });

      console.log(`[ZoneStore] Zone progress reset: ${zoneId}`);
    },
  }))
);
