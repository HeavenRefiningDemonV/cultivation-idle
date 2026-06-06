import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore.js';
import { adaptProgressionAuthoredContent } from '../systems/progression/contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../systems/progression/contract/progressionContract.js';
import { progressionTimingTracker } from '../services/diagnostics/progressionTimingTracker.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { bumpVersion } from './versionCounters.js';
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
const bumpTrialProgressVersion = (state, trialId) => {
    state.progressVersion = bumpVersion(state.progressVersion);
    state.progressVersionByTrialId[trialId] = bumpVersion(state.progressVersionByTrialId[trialId]);
};
export const useTrialStore = create()(immer((set, get) => ({
    activeTrialSessionId: null,
    progressByTrialId: {},
    progressVersion: 0,
    progressVersionByTrialId: {},
    getProgress: (trialId) => {
        const existing = get().progressByTrialId[trialId];
        if (existing)
            return existing;
        const defaults = createDefaultTrialProgress();
        set((state) => {
            state.progressByTrialId[trialId] = defaults;
            bumpTrialProgressVersion(state, trialId);
        });
        return defaults;
    },
    beginTrialSession: (trialId, startedAt) => {
        const current = get().progressByTrialId[trialId];
        if (current
            && current.sessionAttempts === 0
            && current.attemptStartAt === startedAt
            && get().activeTrialSessionId === trialId) {
            return;
        }
        set((state) => {
            if (!state.progressByTrialId[trialId]) {
                state.progressByTrialId[trialId] = createDefaultTrialProgress();
            }
            const progress = state.progressByTrialId[trialId];
            progress.sessionAttempts = 0;
            progress.attemptStartAt = startedAt;
            state.activeTrialSessionId = trialId;
            bumpTrialProgressVersion(state, trialId);
        });
    },
    setAttemptStart: (trialId, startedAt) => {
        if (get().progressByTrialId[trialId]?.attemptStartAt === startedAt)
            return;
        set((state) => {
            if (!state.progressByTrialId[trialId]) {
                state.progressByTrialId[trialId] = createDefaultTrialProgress();
            }
            state.progressByTrialId[trialId].attemptStartAt = startedAt;
            bumpTrialProgressVersion(state, trialId);
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
            bumpTrialProgressVersion(state, trialId);
        });
    },
    recordAttemptSummary: (trialId, summary) => {
        set((state) => {
            if (!state.progressByTrialId[trialId]) {
                state.progressByTrialId[trialId] = createDefaultTrialProgress();
            }
            state.progressByTrialId[trialId].lastAttemptSummary = summary;
            bumpTrialProgressVersion(state, trialId);
        });
    },
    markCleared: (trialId) => {
        if (get().progressByTrialId[trialId]?.resolution === 'cleared')
            return;
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
            bumpTrialProgressVersion(state, trialId);
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
        const current = get().progressByTrialId[trialId];
        if (current?.resolution === 'bypassed' && current.bypassedAt === bypassedAt)
            return;
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
            bumpTrialProgressVersion(state, trialId);
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
        const current = get().progressByTrialId[trialId];
        if (!current && get().activeTrialSessionId !== trialId)
            return;
        if (current?.sessionAttempts === 0 && current.attemptStartAt === null && get().activeTrialSessionId !== trialId)
            return;
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
            bumpTrialProgressVersion(state, trialId);
        });
    },
    resetTrial: (trialId) => {
        set((state) => {
            state.progressByTrialId[trialId] = createDefaultTrialProgress();
            if (state.activeTrialSessionId === trialId) {
                state.activeTrialSessionId = null;
            }
            bumpTrialProgressVersion(state, trialId);
        });
    },
    hardResetTrials: () => {
        set(() => ({
            activeTrialSessionId: null,
            progressByTrialId: {},
            progressVersion: 0,
            progressVersionByTrialId: {},
        }));
    },
})));
