import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import { getGateItemForTransition, getProgressionContract, getTransitionByTrialId, } from '../contract/progressionContract.js';
import { getLiveRealmByIndex } from './liveRealmProjection.js';
const DEFAULT_GATE_ITEM_QTY = 1;
const getContract = (content) => {
    if (!content)
        return null;
    try {
        return getProgressionContract(adaptProgressionAuthoredContent(content));
    }
    catch (error) {
        console.warn('[GateResolver] Failed to load progression contract', error);
        return null;
    }
};
export const getGateTransitionItemIdForRealmIndex = (content, fromRealmIndex) => {
    const contract = getContract(content);
    const fromRealmId = getLiveRealmByIndex(fromRealmIndex).id;
    if (contract) {
        const resolved = getGateItemForTransition(contract, { fromRealmId });
        if (resolved)
            return resolved;
    }
    return null;
};
export const getTrialGateItemId = (content, trial) => {
    if (!trial)
        return null;
    const contract = getContract(content);
    if (contract) {
        const transition = getTransitionByTrialId(contract, trial.id);
        if (transition?.gateItemId)
            return transition.gateItemId;
    }
    return trial.gateItemId ?? null;
};
export const getTrialGateRewardBundle = (content, trial) => {
    const gateItemId = getTrialGateItemId(content, trial);
    if (!gateItemId)
        return {};
    return { items: [{ itemId: gateItemId, qty: DEFAULT_GATE_ITEM_QTY }] };
};
export const hasRequiredGateProof = (content, fromRealmIndex, getItemCount) => {
    const gateItemId = getGateTransitionItemIdForRealmIndex(content, fromRealmIndex);
    if (!gateItemId)
        return true;
    return getItemCount(gateItemId) > 0;
};
