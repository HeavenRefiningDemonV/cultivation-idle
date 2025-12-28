import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TrialAttemptSummary } from '../types';

export type TrialProgress = {
  attempts: number;
  sessionAttempts: number;
  cleared: boolean;
  lastAttemptAt: number | null;
  lastClearAt: number | null;
  attemptStartAt: number | null;
  lastAttemptSummary: TrialAttemptSummary | null;
};

interface TrialState {
  activeTrialSessionId: string | null;
  progressByTrialId: Record<string, TrialProgress>;
  getProgress: (trialId: string) => TrialProgress;
  beginTrialSession: (trialId: string, startedAt: number) => void;
  setAttemptStart: (trialId: string, startedAt: number) => void;
  recordFailure: (trialId: string) => void;
  recordAttemptSummary: (trialId: string, summary: TrialAttemptSummary) => void;
  markCleared: (trialId: string) => void;
  resetSession: (trialId: string) => void;
  resetTrial: (trialId: string) => void;
  hardResetTrials: () => void;
}

const createDefaultProgress = (): TrialProgress => ({
  attempts: 0,
  sessionAttempts: 0,
  cleared: false,
  lastAttemptAt: null,
  lastClearAt: null,
  attemptStartAt: null,
  lastAttemptSummary: null,
});

export const useTrialStore = create<TrialState>()(
  immer((set, get) => ({
    activeTrialSessionId: null,
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

    beginTrialSession: (trialId, startedAt) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.sessionAttempts = 0;
        progress.attemptStartAt = startedAt;
        state.activeTrialSessionId = trialId;
      });
    },

    setAttemptStart: (trialId, startedAt) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        state.progressByTrialId[trialId].attemptStartAt = startedAt;
      });
    },

    recordFailure: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.attempts += 1;
        progress.sessionAttempts += 1;
        progress.lastAttemptAt = Date.now();
        state.activeTrialSessionId = trialId;
      });
    },

    recordAttemptSummary: (trialId, summary) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        state.progressByTrialId[trialId].lastAttemptSummary = summary;
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
        progress.sessionAttempts = 0;
        progress.lastClearAt = Date.now();
        progress.attemptStartAt = null;
        progress.lastAttemptSummary = null;
        if (state.activeTrialSessionId === trialId) {
          state.activeTrialSessionId = null;
        }
      });
    },

    resetSession: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.sessionAttempts = 0;
        progress.attemptStartAt = null;
        if (state.activeTrialSessionId === trialId) {
          state.activeTrialSessionId = null;
        }
      });
    },

    resetTrial: (trialId) => {
      set((state) => {
        state.progressByTrialId[trialId] = createDefaultProgress();
        if (state.activeTrialSessionId === trialId) {
          state.activeTrialSessionId = null;
        }
      });
    },

    hardResetTrials: () => {
      set(() => ({
        activeTrialSessionId: null,
        progressByTrialId: {},
      }));
    },
  })),
);
