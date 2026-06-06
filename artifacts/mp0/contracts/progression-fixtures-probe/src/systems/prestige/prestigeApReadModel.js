import { REALMS } from '../../constants/index.js';
import { PRESTIGE_TARGETS } from '../balance/prestigeTargets.js';
const clampRealmIndex = (index) => Math.max(0, Math.min(REALMS.length - 1, Math.floor(index)));
const asRealmId = (index) => REALMS[clampRealmIndex(index)]?.majorRealm ?? REALMS[0].majorRealm;
const resolveCheckpoint = (realmIndex) => {
    if (realmIndex <= 1)
        return 'foundation_entry';
    if (realmIndex === 2)
        return 'core_entry';
    if (realmIndex === 3)
        return 'nascent_entry';
    if (realmIndex === 4)
        return 'soul_entry';
    return 'spirit_severing_entry';
};
export function countResolvedSemesterGateTrials(args) {
    const liveTrialIds = new Set(args.liveTrialIds);
    return Object.entries(args.progressByTrialId).reduce((count, [trialId, progress]) => {
        if (!liveTrialIds.has(trialId))
            return count;
        return progress.resolution === 'cleared' || progress.resolution === 'bypassed' ? count + 1 : count;
    }, 0);
}
export function extractLiveTrialIds(trialsPayload) {
    if (Array.isArray(trialsPayload)) {
        return trialsPayload
            .map((entry) => (entry && typeof entry === 'object' && typeof entry.id === 'string'
            ? entry.id
            : null))
            .filter((id) => Boolean(id));
    }
    if (trialsPayload && typeof trialsPayload === 'object' && Array.isArray(trialsPayload.trials)) {
        return extractLiveTrialIds(trialsPayload.trials);
    }
    return [];
}
export function buildPrestigeProgressionSnapshot(input) {
    const currentRealmIndex = clampRealmIndex(input.currentRealmIndex);
    const highestRealmIndex = clampRealmIndex(Math.max(input.highestRealmReached, currentRealmIndex));
    const currentRealmSubstages = REALMS[currentRealmIndex]?.substages ?? 1;
    const substageAtHighestRealm = highestRealmIndex === currentRealmIndex
        ? Math.max(1, Math.min(currentRealmSubstages, Math.floor(input.currentSubstage || 1)))
        : 1;
    return {
        highestRealmIndex,
        highestRealmId: asRealmId(highestRealmIndex),
        currentRealmIndex,
        currentSubstage: substageAtHighestRealm,
        resolvedGateCount: Math.max(0, Math.floor(input.resolvedGateCount || 0)),
        atContentCap: highestRealmIndex >= REALMS.length - 1 || asRealmId(highestRealmIndex) === PRESTIGE_TARGETS.unlock.contentCapRealmId,
    };
}
export function calculatePrestigeApForecast(snapshot) {
    const unlockEligible = snapshot.highestRealmIndex >= PRESTIGE_TARGETS.unlock.unlockRealmIndex;
    const checkpoint = resolveCheckpoint(snapshot.highestRealmIndex);
    if (!unlockEligible && PRESTIGE_TARGETS.apComponents.zeroBeforeUnlock) {
        return {
            unlockEligible,
            checkpoint,
            components: { realmBase: 0, substageBonus: 0, resolvedGateBonus: 0 },
            totalAp: 0,
            snapshot,
        };
    }
    const realmBase = PRESTIGE_TARGETS.apComponents.realmBaseByRealmIndex[snapshot.highestRealmIndex] ?? 0;
    const maxSubstageBonus = PRESTIGE_TARGETS.apComponents.maxSubstageBonusByRealmIndex[snapshot.highestRealmIndex] ?? 0;
    const substages = REALMS[snapshot.highestRealmIndex]?.substages ?? 1;
    const substageProgress = Math.max(0, (snapshot.currentSubstage - 1) / Math.max(1, substages - 1));
    const substageBonus = Math.max(0, Math.floor(substageProgress * maxSubstageBonus));
    const resolvedGateBonus = Math.min(PRESTIGE_TARGETS.apComponents.maxResolvedGateCount, snapshot.resolvedGateCount) * PRESTIGE_TARGETS.apComponents.resolvedGateBonusPerGate;
    return {
        unlockEligible,
        checkpoint,
        components: { realmBase, substageBonus, resolvedGateBonus },
        totalAp: Math.max(0, Math.floor(realmBase + substageBonus + resolvedGateBonus)),
        snapshot,
    };
}
export function buildPrestigeApBreakdownRows(forecast) {
    if (!forecast.unlockEligible) {
        return [{
                key: 'too_early',
                label: 'Too early for Reincarnation',
                value: 0,
                hint: `Reach ${PRESTIGE_TARGETS.unlock.unlockRealmId.replace(/_/g, ' ')} to begin earning AP.`,
            }];
    }
    return [
        { key: 'realm', label: 'Realm advancement', value: forecast.components.realmBase, hint: 'Realm milestones grant Ascension Points.' },
        { key: 'substage', label: 'Substage progress', value: forecast.components.substageBonus, hint: 'Current-realm substage progress adds bonus AP.' },
        { key: 'gates', label: 'Resolved gate trials', value: forecast.components.resolvedGateBonus, hint: 'Only cleared or bypassed gate trials count.' },
    ];
}
export function resolvePrestigeAdvisorLabel(forecast) {
    if (!forecast.unlockEligible)
        return 'Too Early';
    if (forecast.snapshot.atContentCap)
        return 'Recommended';
    return 'Viable';
}
