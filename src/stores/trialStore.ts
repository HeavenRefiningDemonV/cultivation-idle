import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TrialAttemptSummary } from '../types';

export type TrialResolution = 'none' | 'cleared' | 'bypassed';

export type TrialProgress = {
  attempts: number;
  sessionAttempts: number;
  eligibleFailures: number;
  resolution: TrialResolution;
  cleared: boolean;
  lastAttemptAt: number | null;
  lastClearAt: number | null;
  bypassedAt: number | null;
  attemptStartAt: number | null;
  lastAttemptSummary: TrialAttemptSummary | null;
};

interface TrialState {
  activeTrialSessionId: string | null;
  progressByTrialId: Record<string, TrialProgress>;
  getProgress: (trialId: string) => TrialProgress;
  beginTrialSession: (trialId: string, startedAt: number) => void;
  setAttemptStart: (trialId: string, startedAt: number) => void;
  recordFailure: (trialId: string, countsTowardFailSafe?: boolean) => void;
  recordAttemptSummary: (trialId: string, summary: TrialAttemptSummary) => void;
  markCleared: (trialId: string) => void;
  markBypassed: (trialId: string, bypassedAt?: number) => void;
  isResolved: (trialId: string) => boolean;
  resetSession: (trialId: string) => void;
  resetTrial: (trialId: string) => void;
  hardResetTrials: () => void;
}

export const createDefaultTrialProgress = (): TrialProgress => ({
  attempts: 0,
  sessionAttempts: 0,
  eligibleFailures: 0,
  resolution: 'none',
  cleared: false,
  lastAttemptAt: null,
  lastClearAt: null,
  bypassedAt: null,
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

      const defaults = createDefaultTrialProgress();
      set((state) => {
        state.progressByTrialId[trialId] = defaults;
      });
      return defaults;
    },

    beginTrialSession: (trialId, startedAt) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
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
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
        }

        state.progressByTrialId[trialId].attemptStartAt = startedAt;
      });
    },

    recordFailure: (trialId, countsTowardFailSafe = false) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.attempts += 1;
        progress.sessionAttempts += 1;
        progress.lastAttemptAt = Date.now();
        progress.attemptStartAt = null;
        if (countsTowardFailSafe) {
          progress.eligibleFailures += 1;
        }
        state.activeTrialSessionId = trialId;
      });
    },

    recordAttemptSummary: (trialId, summary) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
        }

        state.progressByTrialId[trialId].lastAttemptSummary = summary;
      });
    },

    markCleared: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.attempts += 1;
        progress.sessionAttempts += 1;
        progress.resolution = 'cleared';
        progress.cleared = true;
        progress.lastAttemptAt = Date.now();
        progress.lastClearAt = progress.lastAttemptAt;
        progress.attemptStartAt = null;
        progress.lastAttemptSummary = null;
        if (state.activeTrialSessionId === trialId) {
          state.activeTrialSessionId = null;
        }
      });
    },

    markBypassed: (trialId, bypassedAt = Date.now()) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
        }

        const progress = state.progressByTrialId[trialId];
        progress.resolution = 'bypassed';
        progress.cleared = false;
        progress.bypassedAt = bypassedAt;
        progress.attemptStartAt = null;
        if (state.activeTrialSessionId === trialId) {
          state.activeTrialSessionId = null;
        }
      });
    },

    isResolved: (trialId) => {
      const progress = get().progressByTrialId[trialId];
      if (!progress) return false;
      return progress.resolution === 'cleared' || progress.resolution === 'bypassed';
    },

    resetSession: (trialId) => {
      set((state) => {
        if (!state.progressByTrialId[trialId]) {
          state.progressByTrialId[trialId] = createDefaultTrialProgress();
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
        state.progressByTrialId[trialId] = createDefaultTrialProgress();
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
