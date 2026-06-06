import { add } from '../../utils/numbers.js';
import { adaptProgressionAuthoredContent, getProgressionContract, getTransitionByTrialId } from '../progression/contract/index.js';
import { getLiveRealmById } from '../progression/runtime/liveRealmProjection.js';
import { clampSupportReserveGateIndex } from './supportCurrencyTargets.js';
const GATE_FAILURE_MERIT_POLICY = {
    1: { gateIndex: 1, eligibleDefeatMerit: 2, minimumMeritReserveLow: 4, minimumMeritReserveHigh: 6 },
    2: { gateIndex: 2, eligibleDefeatMerit: 3, minimumMeritReserveLow: 6, minimumMeritReserveHigh: 8 },
    3: { gateIndex: 3, eligibleDefeatMerit: 4, minimumMeritReserveLow: 8, minimumMeritReserveHigh: 10 },
    4: { gateIndex: 4, eligibleDefeatMerit: 5, minimumMeritReserveLow: 10, minimumMeritReserveHigh: 12 },
    5: { gateIndex: 5, eligibleDefeatMerit: 7, minimumMeritReserveLow: 14, minimumMeritReserveHigh: 16 },
};
export function getGateFailureMeritPolicyByGateIndex(gateIndex) {
    return GATE_FAILURE_MERIT_POLICY[clampSupportReserveGateIndex(gateIndex)];
}
export function getAllGateFailureMeritPolicies() {
    return Object.values(GATE_FAILURE_MERIT_POLICY);
}
export function resolveGateIndexForTrial(content, trial) {
    if (content && trial) {
        try {
            const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
            const transition = getTransitionByTrialId(contract, trial.id);
            if (transition) {
                return clampSupportReserveGateIndex(getLiveRealmById(transition.fromRealmId).index + 1);
            }
        }
        catch (error) {
            console.warn('[GateFailureMeritPolicy] Falling back to city-based gate index', error);
        }
        const cityIndex = content.cities.find((city) => city.id === trial.cityId)?.index;
        if (typeof cityIndex === 'number') {
            return clampSupportReserveGateIndex(cityIndex + 1);
        }
    }
    return 1;
}
export function getGateFailureMeritPolicyForTrial(content, trial) {
    return getGateFailureMeritPolicyByGateIndex(resolveGateIndexForTrial(content, trial));
}
export function projectMeritAfterEligibleDefeats(currentMerit, gateIndex, eligibleDefeatCount) {
    const policy = getGateFailureMeritPolicyByGateIndex(gateIndex);
    return add(currentMerit, String(policy.eligibleDefeatMerit * Math.max(0, Math.floor(eligibleDefeatCount)))).toString();
}
