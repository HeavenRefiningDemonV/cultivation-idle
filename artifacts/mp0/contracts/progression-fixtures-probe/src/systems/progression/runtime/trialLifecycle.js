import { REALMS } from '../../../constants/index.js';
import { greaterThanOrEqualTo } from '../../../utils/numbers.js';
import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import { getProgressionContract, getTransitionByTrialId } from '../contract/progressionContract.js';
import { clampRealmIndexToSemesterSlice, getLiveRealmByIndex } from './liveRealmProjection.js';
import { getTrialGateItemId } from './gateResolver.js';
const getContract = (content) => {
    if (!content)
        return null;
    try {
        return getProgressionContract(adaptProgressionAuthoredContent(content));
    }
    catch (error) {
        console.warn('[TrialLifecycle] Failed to load progression contract', error);
        return null;
    }
};
export const resolveTrialFailSafeConfig = (trial) => {
    return {
        threshold: Math.max(1, Math.floor(trial?.failSafe?.thresholdAttempts ?? 3)),
        cost: trial?.failSafe?.cost ?? null,
    };
};
const describeReason = (code, resolution) => {
    switch (code) {
        case 'missing_trial':
            return 'Trial definition unavailable.';
        case 'missing_transition':
            return 'Trial transition is unavailable.';
        case 'resolved':
            return resolution === 'bypassed' ? 'Trial already resolved via bypass.' : 'Trial already cleared.';
        case 'wrong_realm_edge':
            return 'Trial locked for a different realm edge.';
        case 'not_final_substage':
            return 'Not at final substage yet.';
        case 'insufficient_qi':
            return 'Insufficient Qi for breakthrough readiness.';
        case 'missing_required_item':
            return 'Missing required item.';
        case 'available':
            return 'Ready to challenge.';
    }
};
export const getTrialLifecycleSnapshot = ({ content, trial, progress, realm, qi, breakthroughRequirement, requiredItemSatisfied, }) => {
    const contract = getContract(content);
    const transition = trial && contract ? getTransitionByTrialId(contract, trial.id) : null;
    const resolution = progress?.resolution ?? (progress?.cleared ? 'cleared' : 'none');
    const gateItemId = getTrialGateItemId(content, trial);
    const currentRealmIndex = clampRealmIndexToSemesterSlice(realm.index);
    const currentRealm = REALMS[currentRealmIndex] ?? REALMS[0];
    const currentRealmId = getLiveRealmByIndex(currentRealmIndex).id;
    const atCorrectRealmEdge = Boolean(transition && transition.fromRealmId === currentRealmId);
    const atFinalSubstage = realm.substage >= currentRealm.substages;
    const qiReady = greaterThanOrEqualTo(qi, breakthroughRequirement);
    const isResolved = resolution === 'cleared' || resolution === 'bypassed';
    const { threshold, cost } = resolveTrialFailSafeConfig(trial);
    const eligibleFailures = progress?.eligibleFailures ?? 0;
    let state = 'locked';
    let reasonCode = 'missing_trial';
    if (!trial) {
        reasonCode = 'missing_trial';
    }
    else if (!transition) {
        reasonCode = 'missing_transition';
    }
    else if (isResolved) {
        state = resolution;
        reasonCode = 'resolved';
    }
    else if (!atCorrectRealmEdge) {
        reasonCode = 'wrong_realm_edge';
    }
    else if (!atFinalSubstage) {
        reasonCode = 'not_final_substage';
    }
    else if (!qiReady) {
        reasonCode = 'insufficient_qi';
    }
    else if (!requiredItemSatisfied) {
        reasonCode = 'missing_required_item';
    }
    else {
        state = 'available';
        reasonCode = 'available';
    }
    const canStart = state === 'available';
    const canPurchase = state === 'available' && eligibleFailures >= threshold;
    const failSafeStatus = isResolved ? 'resolved' : canPurchase ? 'available' : 'locked';
    const failSafeBlockedReasonCode = isResolved
        ? 'resolved'
        : state === 'available'
            ? null
            : reasonCode === 'available'
                ? null
                : reasonCode;
    const failSafeBlockedReason = isResolved
        ? describeReason('resolved', resolution)
        : canPurchase
            ? null
            : state === 'available'
                ? `Safety Net unlocks after ${threshold} eligible defeats.`
                : failSafeBlockedReasonCode
                    ? describeReason(failSafeBlockedReasonCode, resolution)
                    : null;
    return {
        state,
        canStart,
        isResolved,
        resolution,
        reasonCode,
        reason: describeReason(reasonCode, resolution),
        gateItemId,
        requiredItemId: trial?.requiredItemId ?? null,
        countsTowardFailSafeOnStart: canStart,
        failSafe: {
            threshold,
            eligibleFailures,
            remainingEligibleFailures: Math.max(0, threshold - eligibleFailures),
            cost,
            status: failSafeStatus,
            canPurchase,
            blockedReasonCode: failSafeBlockedReasonCode,
            blockedReason: failSafeBlockedReason,
        },
    };
};
export const isTrialResolved = (snapshot) => snapshot.isResolved;
