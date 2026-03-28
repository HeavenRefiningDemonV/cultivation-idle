import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { adaptProgressionAuthoredContent } from '../systems/progression/contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../systems/progression/contract/progressionContract.js';
import { progressionTimingTracker } from '../services/diagnostics/progressionTimingTracker.js';
import { GameEvents } from '../services/events/GameEvents.js';
export const createDefaultTrialProgress = () => ({
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
export const normalizeTrialProgress = (progress) => {
    if (!progress) {
        return createDefaultTrialProgress();
    }
    const resolution = progress.resolution ?? (progress.cleared ? 'cleared' : 'none');
    const attempts = typeof progress.attempts === 'number' ? progress.attempts : 0;
    return {
        attempts,
        sessionAttempts: typeof progress.sessionAttempts === 'number' ? progress.sessionAttempts : 0,
        eligibleFailures: typeof progress.eligibleFailures === 'number'
            ? progress.eligibleFailures
            : resolution === 'none'
                ? attempts
                : 0,
        resolution,
        cleared: resolution === 'cleared',
        lastAttemptAt: progress.lastAttemptAt ?? null,
        lastClearAt: progress.lastClearAt ?? null,
        bypassedAt: typeof progress.bypassedAt === 'number'
            ? progress.bypassedAt
            : resolution === 'bypassed'
                ? progress.lastAttemptAt ?? progress.lastClearAt ?? null
                : null,
        attemptStartAt: progress.attemptStartAt ?? null,
        lastAttemptSummary: progress.lastAttemptSummary
            ? { ...progress.lastAttemptSummary, suggestions: [...progress.lastAttemptSummary.suggestions] }
            : null,
    };
};
export const useTrialStore = create()(immer((set, get) => ({
    activeTrialSessionId: null,
    progressByTrialId: {},
    getProgress: (trialId) => {
        const existing = get().progressByTrialId[trialId];
        if (existing)
            return existing;
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
        const timestamp = Date.now();
        set((state) => {
            if (!state.progressByTrialId[trialId]) {
                state.progressByTrialId[trialId] = createDefaultTrialProgress();
            }
            const progress = state.progressByTrialId[trialId];
            progress.attempts += 1;
            progress.sessionAttempts += 1;
            progress.resolution = 'cleared';
            progress.cleared = true;
            progress.lastAttemptAt = timestamp;
            progress.lastClearAt = progress.lastAttemptAt;
            progress.attemptStartAt = null;
            progress.lastAttemptSummary = null;
            if (state.activeTrialSessionId === trialId) {
                state.activeTrialSessionId = null;
            }
        });
        const content = useContentStore.getState().raw;
        if (content) {
            const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
            const transition = getTransitionByTrialId(contract, trialId);
            if (transition) {
                const gateIndex = (contract.majorRealms[transition.fromRealmId]?.index ?? 0) + 1;
                progressionTimingTracker.emitGateResolved({
                    runStartTime: progressionTimingTracker.getActiveRunStartTime(),
                    timestamp,
                    trialId,
                    fromRealmId: transition.fromRealmId,
                    toRealmId: transition.toRealmId,
                    gateIndex,
                    cityId: transition.cityId ?? null,
                    resolution: 'cleared',
                });
            }
        }
    },
    markBypassed: (trialId, bypassedAt = Date.now()) => {
        let gateIndex = 0;
        set((state) => {
            if (!state.progressByTrialId[trialId]) {
                state.progressByTrialId[trialId] = createDefaultTrialProgress();
            }
            const progress = state.progressByTrialId[trialId];
            progress.resolution = 'bypassed';
            progress.cleared = false;
            progress.bypassedAt = bypassedAt;
            progress.attemptStartAt = null;
            progress.lastAttemptSummary = null;
            if (state.activeTrialSessionId === trialId) {
                state.activeTrialSessionId = null;
            }
        });
        const content = useContentStore.getState().raw;
        if (content) {
            const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
            const transition = getTransitionByTrialId(contract, trialId);
            if (transition) {
                gateIndex = (contract.majorRealms[transition.fromRealmId]?.index ?? 0) + 1;
                progressionTimingTracker.emitGateResolved({
                    runStartTime: progressionTimingTracker.getActiveRunStartTime(),
                    timestamp: bypassedAt,
                    trialId,
                    fromRealmId: transition.fromRealmId,
                    toRealmId: transition.toRealmId,
                    gateIndex,
                    cityId: transition.cityId ?? null,
                    resolution: 'bypassed',
                });
            }
        }
        GameEvents.emit({
            type: 'trials/attempt_resolved',
            payload: {
                timestamp: bypassedAt,
                trialId,
                gateIndex,
                attemptId: `${trialId}:${bypassedAt}`,
                outcome: 'bypassed',
                durationSec: 0,
                countsTowardFailSafe: true,
                eligibleFailCountAfterAttempt: get().getProgress(trialId).eligibleFailures,
            },
        });
    },
    isResolved: (trialId) => {
        const progress = get().progressByTrialId[trialId];
        if (!progress)
            return false;
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
})));
