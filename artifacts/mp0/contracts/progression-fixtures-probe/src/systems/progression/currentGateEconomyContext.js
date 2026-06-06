import { getLiveRealmByIndex, getNextLiveRealm, isAtSemesterCap } from './runtime/liveRealmProjection.js';
function compactRealmGateLabel(name) {
    const compact = (name ?? 'Current')
        .replace(/\bEstablishment\b/giu, '')
        .replace(/\s+/gu, ' ')
        .trim();
    return `${compact || 'Current'} Gate`;
}
function fromRealmIdForTrial(trial) {
    const rule = trial.eligibilityRule;
    if (!rule || typeof rule === 'string')
        return null;
    const fromMajorRealm = rule.fromMajorRealm;
    return typeof fromMajorRealm === 'string' ? fromMajorRealm : null;
}
export function buildCurrentGateEconomyContext(input) {
    const currentRealm = getLiveRealmByIndex(input.realmIndex);
    const nextRealm = getNextLiveRealm(input.realmIndex);
    const isContentCap = isAtSemesterCap(input.realmIndex) || !nextRealm;
    const currentRealmConfig = input.content.economy.majorRealms.find((realm) => realm.id === currentRealm.id) ?? null;
    const nextRealmConfig = nextRealm
        ? input.content.economy.majorRealms.find((realm) => realm.id === nextRealm.id) ?? null
        : null;
    const trial = input.content.trials.find((entry) => fromRealmIdForTrial(entry) === currentRealm.id) ?? null;
    const contextCityId = trial?.cityId ?? input.cityId ?? null;
    const contextCity = contextCityId ? input.content.cities.find((city) => city.id === contextCityId) ?? null : null;
    if (isContentCap) {
        return {
            gateId: null,
            transitionId: null,
            fromRealm: currentRealmConfig?.name ?? currentRealm.name,
            toRealm: null,
            gateLabel: 'Content Cap',
            gateIndex: null,
            cityId: contextCityId,
            cityIndex: contextCity?.index ?? null,
            isContentCap: true,
            source: input.source ?? 'progression-contract',
        };
    }
    return {
        gateId: trial?.id ?? null,
        transitionId: trial?.gatesToMajorRealm ? `${currentRealm.id}_to_${trial.gatesToMajorRealm}` : null,
        fromRealm: currentRealmConfig?.name ?? currentRealm.name,
        toRealm: nextRealmConfig?.name ?? nextRealm?.name ?? null,
        gateLabel: compactRealmGateLabel(nextRealmConfig?.name ?? nextRealm?.name),
        gateIndex: currentRealm.index + 1,
        cityId: contextCityId,
        cityIndex: contextCity?.index ?? null,
        isContentCap: false,
        source: input.source ?? 'progression-contract',
    };
}
