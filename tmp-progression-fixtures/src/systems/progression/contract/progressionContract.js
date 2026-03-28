import { DEFERRED_SYSTEMS } from './deferredContent.js';
import { toTransitionId } from './gateTransitions.js';
import { OFFLINE_PROGRESSION_CONTRACT } from './offlineContract.js';
import { createPrestigeClassificationHooks } from './prestigeContract.js';
import { normalizeMajorRealmId } from './realmMap.js';
import { createResetClassificationHooks } from './resetContract.js';
import { SEMESTER_SLICE_CONTRACT } from './semesterSlice.js';
const GATE_ITEM_ALIASES = {
    foundation_pill: 'gate_foundation_pill',
    core_catalyst: 'gate_core_catalyst',
    core_stabilizer: 'gate_core_stabilizer',
    soul_condensate: 'gate_soul_condensate',
};
const normalizeGateItemId = (value) => {
    if (value.startsWith('gate_'))
        return value;
    return GATE_ITEM_ALIASES[value] ?? null;
};
const readFromRealm = (trial) => {
    if (!trial.eligibilityRule || typeof trial.eligibilityRule === 'string')
        return null;
    return normalizeMajorRealmId(trial.eligibilityRule.fromMajorRealm ?? '');
};
export const buildProgressionContract = (content) => {
    const majorRealms = content.economy.majorRealms.reduce((acc, realm) => {
        const normalized = normalizeMajorRealmId(realm.id);
        if (!normalized)
            return acc;
        acc[normalized] = { id: normalized, index: realm.index };
        return acc;
    }, {});
    const gateTransitions = content.trials
        .flatMap((trial) => {
        const fromRealmId = readFromRealm(trial);
        const toRealmId = normalizeMajorRealmId(trial.gatesToMajorRealm ?? '');
        const gateItemId = normalizeGateItemId(trial.gateItemId);
        if (!fromRealmId || !toRealmId || !gateItemId)
            return [];
        return [{
                id: toTransitionId(fromRealmId, toRealmId),
                fromRealmId,
                toRealmId,
                trialId: trial.id,
                gateItemId,
                cityId: trial.cityId,
            }];
    });
    const cityUnlocks = content.cities
        .flatMap((city) => {
        const unlockOnRealmEntry = normalizeMajorRealmId(city.unlockMajorRealm);
        if (!unlockOnRealmEntry)
            return [];
        return [{
                cityId: city.id,
                unlockOnRealmEntry,
            }];
    });
    return {
        semesterSlice: SEMESTER_SLICE_CONTRACT,
        majorRealms,
        gateTransitions,
        cityUnlocks,
        contentCap: { realmId: 'spirit_severing', state: 'end_of_slice' },
        deferredSystems: DEFERRED_SYSTEMS,
        pathTruth: { canonicalField: 'selectedPath', legacyAliases: ['lifePath'] },
        offline: OFFLINE_PROGRESSION_CONTRACT,
        prestigeHooks: createPrestigeClassificationHooks(),
        resetHooks: createResetClassificationHooks(),
        aliases: {
            gateItems: Object.entries(GATE_ITEM_ALIASES).map(([alias, canonical]) => ({ canonical, aliases: [alias] })),
            failSafeFieldAliases: [{ canonical: 'failSafe', aliases: ['failSafePurchase'] }],
        },
    };
};
let singleton = null;
export const getProgressionContract = (content) => {
    if (!singleton) {
        if (!content) {
            throw new Error('Progression contract has not been initialized. Provide authored content once.');
        }
        singleton = buildProgressionContract(content);
    }
    return singleton;
};
export const getMajorRealmIds = (contract) => Object.keys(contract.majorRealms);
export const getMajorRealmById = (contract, id) => contract.majorRealms[id] ?? null;
export const getTransitionByFromRealm = (contract, fromRealmId) => contract.gateTransitions.find((t) => t.fromRealmId === fromRealmId) ?? null;
export const getTransitionByToRealm = (contract, toRealmId) => contract.gateTransitions.find((t) => t.toRealmId === toRealmId) ?? null;
export const getTransitionByTrialId = (contract, trialId) => contract.gateTransitions.find((t) => t.trialId === trialId) ?? null;
export const getGateItemForTransition = (contract, query) => {
    const match = contract.gateTransitions.find((transition) => {
        if (query.transitionId)
            return transition.id === query.transitionId;
        if (query.fromRealmId)
            return transition.fromRealmId === query.fromRealmId;
        if (query.toRealmId)
            return transition.toRealmId === query.toRealmId;
        return false;
    });
    return match?.gateItemId ?? null;
};
export const getCityUnlockForRealm = (contract, majorRealmId) => contract.cityUnlocks.find((unlock) => unlock.unlockOnRealmEntry === majorRealmId) ?? null;
export const getContentCapRealm = (contract) => contract.contentCap.realmId;
export const isRealmInLiveSlice = (contract, majorRealmId) => contract.semesterSlice.liveMajorRealms.includes(majorRealmId);
export const isDeferredSystem = (contract, systemId) => contract.deferredSystems.includes(systemId);
export const getOfflineProgressionContract = (contract) => contract.offline;
export const getResetClassificationHooks = (contract) => contract.resetHooks;
export const getPrestigeClassificationHooks = (contract) => contract.prestigeHooks;
export const normalizeGateItemAlias = (value) => normalizeGateItemId(value);
export const getPathTruthContract = (contract) => contract.pathTruth;
