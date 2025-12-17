import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type TrialProgress = {
  attempts: number;
  cleared: boolean;
  lastAttemptAt: number | null;
  lastClearAt: number | null;
};

interface TrialState {
  progressByTrialId: Record<string, TrialProgress>;
  getProgress: (trialId: string) => TrialProgress;
  recordFailure: (trialId: string) => void;
  markCleared: (trialId: string) => void;
  resetTrial: (trialId: string) => void;
  hardResetTrials: () => void;
}

const createDefaultProgress = (): TrialProgress => ({
  attempts: 0,
  cleared: false,
  lastAttemptAt: null,
  lastClearAt: null,
});

export const useTrialStore = create<TrialState>()(
  immer((set, get) => ({
    progressByTrialId: {},

    getProgress: (trialId) => {
      const existing = get().progressByTrialId[trialId];
      if (existing) return existing;

      const defaults = createDefaultProgress();
      set((state) => {
        state.progressByTrialId[trialId] = defaults;
      });
      return defaults;
    },

    recordFailure: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.attempts += 1;
        progress.lastAttemptAt = Date.now();
      });
    },

    markCleared: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.cleared = true;
        progress.attempts = 0;
        progress.lastClearAt = Date.now();
      });
    },

    resetTrial: (trialId) => {
      set((state) => {
        state.progressByTrialId[trialId] = createDefaultProgress();
      });
    },

    hardResetTrials: () => {
      set(() => ({
        progressByTrialId: {},
      }));
    },
  })),
);
