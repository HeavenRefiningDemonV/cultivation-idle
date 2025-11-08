import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface DungeonProgress {
  dungeonId: string;
  firstClearCompleted: boolean;
  totalClears: number;
  bestTime: number;
  fastestKill: number;
}

interface DungeonState {
  dungeonProgress: Record<string, DungeonProgress>;
  currentDungeon: string | null;
  unlockedDungeons: Record<string, boolean>;

  startDungeon: (dungeonId: string) => void;
  completeDungeon: (dungeonId: string, time: number) => void;
  isFirstClear: (dungeonId: string) => boolean;
  getTotalClears: (dungeonId: string) => number;
  unlockDungeon: (dungeonId: string) => void;
  isDungeonUnlocked: (dungeonId: string) => boolean;
  exitDungeon: () => void;
}

export const useDungeonStore = create<DungeonState>()(
  immer((set, get) => ({
    dungeonProgress: {},
    currentDungeon: null,
    unlockedDungeons: {
      novice_clearing: true, // First dungeon is unlocked by default
    },

    startDungeon: (dungeonId: string) => {
      set((state) => {
        state.currentDungeon = dungeonId;

        // Initialize progress if it doesn't exist
        if (!state.dungeonProgress[dungeonId]) {
          state.dungeonProgress[dungeonId] = {
            dungeonId,
            firstClearCompleted: false,
            totalClears: 0,
            bestTime: Infinity,
            fastestKill: Infinity,
          };
        }
      });
    },

    completeDungeon: (dungeonId: string, time: number) => {
      set((state) => {
        const progress = state.dungeonProgress[dungeonId];

        if (progress) {
          progress.totalClears += 1;

          // Update best time if this is faster
          if (time < progress.bestTime) {
            progress.bestTime = time;
          }

          // Mark first clear as completed
          if (!progress.firstClearCompleted) {
            progress.firstClearCompleted = true;
          }
        }

        // Exit dungeon after completion
        state.currentDungeon = null;
      });
    },

    isFirstClear: (dungeonId: string) => {
      const progress = get().dungeonProgress[dungeonId];
      return !progress || !progress.firstClearCompleted;
    },

    getTotalClears: (dungeonId: string) => {
      const progress = get().dungeonProgress[dungeonId];
      return progress ? progress.totalClears : 0;
    },

    unlockDungeon: (dungeonId: string) => {
      set((state) => {
        state.unlockedDungeons[dungeonId] = true;
      });
    },

    isDungeonUnlocked: (dungeonId: string) => {
      return get().unlockedDungeons[dungeonId] || false;
    },

    exitDungeon: () => {
      set((state) => {
        state.currentDungeon = null;
      });
    },
  }))
);
