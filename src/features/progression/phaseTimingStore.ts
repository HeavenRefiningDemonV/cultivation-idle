import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CurrentBranchPhase } from './currentBranchPhaseMap';

interface PhaseTimingState {
  runStartedAt: number;
  firstDungeonUnlockedAt: number | null;
  firstDungeonClearedAt: number | null;
  firstPrestigeViableAt: number | null;
  phaseEnteredAt: Partial<Record<CurrentBranchPhase['id'], number>>;
  zoneUnlockedAt: Record<string, number>;
  dungeonUnlockedAt: Record<string, number>;

  markZoneUnlocked: (zoneId: string) => void;
  markDungeonUnlocked: (dungeonId: string) => void;
  markDungeonCleared: () => void;
  markPrestigeViable: () => void;
  markPhaseEntered: (phaseId: CurrentBranchPhase['id']) => void;
  resetRunTiming: () => void;
  getTimingSnapshot: () => Omit<PhaseTimingState, 'markZoneUnlocked' | 'markDungeonUnlocked' | 'markDungeonCleared' | 'markPrestigeViable' | 'markPhaseEntered' | 'resetRunTiming' | 'getTimingSnapshot'>;
}

const createInitialTimingState = () => ({
  runStartedAt: Date.now(),
  firstDungeonUnlockedAt: null as number | null,
  firstDungeonClearedAt: null as number | null,
  firstPrestigeViableAt: null as number | null,
  phaseEnteredAt: {} as Partial<Record<CurrentBranchPhase['id'], number>>,
  zoneUnlockedAt: {} as Record<string, number>,
  dungeonUnlockedAt: {} as Record<string, number>,
});

export const usePhaseTimingStore = create<PhaseTimingState>()(
  immer((set, get) => ({
    ...createInitialTimingState(),

    markZoneUnlocked: (zoneId) => {
      set((state) => {
        if (!state.zoneUnlockedAt[zoneId]) {
          state.zoneUnlockedAt[zoneId] = Date.now() - state.runStartedAt;
        }
      });
    },

    markDungeonUnlocked: (dungeonId) => {
      set((state) => {
        if (!state.dungeonUnlockedAt[dungeonId]) {
          const elapsed = Date.now() - state.runStartedAt;
          state.dungeonUnlockedAt[dungeonId] = elapsed;
          if (state.firstDungeonUnlockedAt === null) {
            state.firstDungeonUnlockedAt = elapsed;
          }
        }
      });
    },

    markDungeonCleared: () => {
      set((state) => {
        if (state.firstDungeonClearedAt === null) {
          state.firstDungeonClearedAt = Date.now() - state.runStartedAt;
        }
      });
    },

    markPrestigeViable: () => {
      set((state) => {
        if (state.firstPrestigeViableAt === null) {
          state.firstPrestigeViableAt = Date.now() - state.runStartedAt;
        }
      });
    },

    markPhaseEntered: (phaseId) => {
      set((state) => {
        if (!state.phaseEnteredAt[phaseId]) {
          state.phaseEnteredAt[phaseId] = Date.now() - state.runStartedAt;
        }
      });
    },

    resetRunTiming: () => {
      set((state) => {
        Object.assign(state, createInitialTimingState());
      });
    },

    getTimingSnapshot: () => {
      const state = get();
      return {
        runStartedAt: state.runStartedAt,
        firstDungeonUnlockedAt: state.firstDungeonUnlockedAt,
        firstDungeonClearedAt: state.firstDungeonClearedAt,
        firstPrestigeViableAt: state.firstPrestigeViableAt,
        phaseEnteredAt: state.phaseEnteredAt,
        zoneUnlockedAt: state.zoneUnlockedAt,
        dungeonUnlockedAt: state.dungeonUnlockedAt,
      };
    },
  }))
);
