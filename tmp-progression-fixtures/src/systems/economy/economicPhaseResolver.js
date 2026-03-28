import { adaptProgressionAuthoredContent, getProgressionContract } from '../progression/contract/index.js';
import { getLiveRealmById, getLiveRealmByIndex, isAtSemesterCap } from '../progression/runtime/liveRealmProjection.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { CITY_PACKAGE_REGISTRY_BY_ID } from '../world/cityPackageRegistry.js';
import { clampEconomicGateIndex } from './economicConstants.js';
import { getPrepBudgetByCurrentRealmId } from './prepBudgetRegistry.js';
function sortTransitions(transitions) {
    return [...transitions].sort((left, right) => getLiveRealmById(left.fromRealmId).index - getLiveRealmById(right.fromRealmId).index);
}
function isResolved(progress) {
    return progress?.resolution === 'cleared' || progress?.resolution === 'bypassed';
}
export function buildEconomicPhaseSnapshotFromState(input) {
    const { content } = input;
    if (!content) {
        throw new Error('[EconomicPhaseResolver] Content is required');
    }
    const contract = getProgressionContract(adaptProgressionAuthoredContent(content));
    const orderedTransitions = sortTransitions(contract.gateTransitions);
    const currentCityId = (input.currentCityId ?? input.unlockedCityIds?.[0] ?? content.cities[0]?.id ?? null);
    const currentCityIndex = currentCityId ? content.cities.find((city) => city.id === currentCityId)?.index ?? 0 : 0;
    const currentRealm = getLiveRealmByIndex(input.currentRealmIndex);
    const currentGateTransition = orderedTransitions.find((transition) => transition.fromRealmId === currentRealm.id) ?? null;
    const nextUnresolvedGateTransition = orderedTransitions.find((transition) => !isResolved(input.trialProgressById?.[transition.trialId])) ?? null;
    const atContentCap = isAtSemesterCap(input.currentRealmIndex) && nextUnresolvedGateTransition === null;
    const currentGateIndex = clampEconomicGateIndex(currentGateTransition
        ? getLiveRealmById(currentGateTransition.fromRealmId).index + 1
        : nextUnresolvedGateTransition
            ? getLiveRealmById(nextUnresolvedGateTransition.fromRealmId).index + 1
            : 5);
    const registryEntry = currentCityId ? CITY_PACKAGE_REGISTRY_BY_ID[currentCityId] ?? null : null;
    const currentGateTransitionId = currentGateTransition ? getPrepBudgetByCurrentRealmId(currentGateTransition.fromRealmId)?.transitionId ?? null : null;
    const nextUnresolvedTransitionId = nextUnresolvedGateTransition
        ? getPrepBudgetByCurrentRealmId(nextUnresolvedGateTransition.fromRealmId)?.transitionId ?? null
        : null;
    return {
        currentCityId,
        currentCityIndex,
        currentSelectedPath: input.selectedPath ?? null,
        currentRealmId: currentRealm.id,
        currentRealmIndex: currentRealm.index,
        currentGateIndex,
        currentGateResolved: currentGateTransition ? isResolved(input.trialProgressById?.[currentGateTransition.trialId]) : atContentCap,
        currentGateTransition,
        currentGateTransitionId,
        nextUnresolvedGateTransition,
        nextUnresolvedTransitionId,
        atContentCap,
        cityLesson: registryEntry?.lesson ?? '',
        citySupportIdentity: registryEntry?.leadSupportIdentity ?? null,
    };
}
export function buildLiveEconomicPhaseSnapshot() {
    const cityState = useCityStore.getState();
    const gameState = useGameStore.getState();
    const trialState = useTrialStore.getState();
    const contentState = useContentStore.getState();
    return buildEconomicPhaseSnapshotFromState({
        content: contentState.raw,
        currentCityId: cityState.currentCityId,
        unlockedCityIds: cityState.unlockedCityIds,
        currentRealmIndex: gameState.realm.index,
        selectedPath: gameState.selectedPath,
        trialProgressById: trialState.progressByTrialId,
    });
}
