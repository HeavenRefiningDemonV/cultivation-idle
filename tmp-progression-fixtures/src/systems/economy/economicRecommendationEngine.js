import { buildLiveEconomicRuntimeSnapshot, buildEconomicRuntimeSnapshotFromState } from './economicSnapshot.js';
import { evaluateEconomicShortfalls } from './economicShortfallEvaluator.js';
import { resolveMissingMaterialRoutes } from './missingMaterialRouteResolver.js';
import { buildModuleRecommendationSummaries } from './moduleRecommendationSummaries.js';
function mapRouteTypeToActionKind(routeType) {
    switch (routeType) {
        case 'apothecary_buy':
            return 'buy';
        case 'apothecary_brew':
            return 'brew';
        case 'outskirts':
            return 'farm_outskirts';
        case 'ruins':
            return 'run_ruins';
        case 'expeditions':
            return 'launch_expedition';
        case 'bounties':
            return 'claim_bounty';
        case 'forge':
            return 'craft_forge';
        case 'manual_pavilion':
            return 'route_manual_pavilion';
        case 'gate_trial':
            return 'attempt_gate';
    }
}
function addEngineBlockedReason(snapshot, route) {
    if (route.routeType === 'expeditions' && snapshot.expeditionState.availableSlotCount <= 0) {
        return 'No expedition slot is available right now.';
    }
    return route.blockedReason;
}
function toCandidate(snapshot, shortfall, route) {
    return {
        actionKind: mapRouteTypeToActionKind(route.routeType),
        destinationModuleKey: route.destinationModuleKey,
        destinationCityId: route.destinationCityId,
        routeType: route.routeType,
        reasonSummary: route.whyPrimary,
        blockedReason: addEngineBlockedReason(snapshot, route),
        priorityBand: shortfall.priorityBand,
        relatedIds: shortfall.relatedIds,
        expectedBenefitCategory: shortfall.benefitCategory,
        activityMode: route.activityMode,
        problemKind: shortfall.problemKind,
    };
}
function buildDirectModuleCandidates(snapshot, shortfall) {
    const moduleKey = (shortfall.problemKind === 'belowMinimumForgeFloor' || shortfall.problemKind === 'belowRecommendedForgeFloor'
        ? 'forge'
        : shortfall.problemKind === 'belowMeritReserve' || shortfall.problemKind === 'belowSpiritStoneMinimum' || shortfall.problemKind === 'belowSpiritStoneIdeal'
            ? 'bounties'
            : shortfall.problemKind === 'buildCorrectionGap'
                ? 'manualPavilion'
                : 'gateTrial');
    const routeType = (moduleKey === 'forge' ? 'forge'
        : moduleKey === 'bounties' ? 'bounties'
            : moduleKey === 'manualPavilion' ? 'manual_pavilion'
                : 'gate_trial');
    const available = snapshot.availableModuleKeys.includes(moduleKey);
    return [{
            actionKind: routeType === 'forge'
                ? 'craft_forge'
                : routeType === 'bounties'
                    ? 'claim_bounty'
                    : routeType === 'manual_pavilion'
                        ? 'route_manual_pavilion'
                        : 'attempt_gate',
            destinationModuleKey: moduleKey,
            destinationCityId: snapshot.currentCityId,
            routeType,
            reasonSummary: shortfall.label,
            blockedReason: available ? null : `${moduleKey} is not currently available.`,
            priorityBand: shortfall.priorityBand,
            relatedIds: shortfall.relatedIds,
            expectedBenefitCategory: shortfall.benefitCategory,
            activityMode: routeType === 'bounties' ? 'background' : 'active',
            problemKind: shortfall.problemKind,
        }];
}
function buildProblemRecommendation(snapshot, shortfall) {
    const targetId = shortfall.relatedIds[0] ?? null;
    const routeOptions = targetId
        ? resolveMissingMaterialRoutes({
            content: snapshot.content,
            targetId,
            currentCityId: snapshot.currentCityId ?? snapshot.phase.currentCityId ?? snapshot.content.cities[0]?.id ?? '',
            unlockedCityIds: snapshot.unlockedCityIds,
            availableModuleKeys: snapshot.availableModuleKeys,
            shortageQty: shortfall.gap,
            purchasedTodayByStockId: snapshot.currentCityShop.purchasedTodayByStockId,
            problemKind: shortfall.problemKind,
        })
        : [];
    const candidates = routeOptions.length > 0
        ? routeOptions.map((route) => toCandidate(snapshot, shortfall, route))
        : buildDirectModuleCandidates(snapshot, shortfall);
    if (candidates.length === 0 && shortfall.problemKind === 'missingGatePrepPackage') {
        return {
            shortfall,
            routeOptions,
            candidates: [{
                    actionKind: 'hold_and_cultivate',
                    destinationModuleKey: 'apothecary',
                    destinationCityId: snapshot.currentCityId,
                    routeType: 'hold_and_cultivate',
                    reasonSummary: 'Hold and cultivate while waiting for a better prep route.',
                    blockedReason: null,
                    priorityBand: shortfall.priorityBand,
                    relatedIds: shortfall.relatedIds,
                    expectedBenefitCategory: shortfall.benefitCategory,
                    activityMode: 'background',
                    problemKind: shortfall.problemKind,
                }],
        };
    }
    return { shortfall, routeOptions, candidates };
}
export function buildEconomicRecommendationEngine(snapshot) {
    const evaluation = evaluateEconomicShortfalls(snapshot);
    const perProblemRecommendations = evaluation.shortfalls.map((shortfall) => buildProblemRecommendation(snapshot, shortfall));
    const orderedCandidates = perProblemRecommendations
        .flatMap((entry) => entry.candidates)
        .sort((left, right) => left.priorityBand - right.priorityBand
        || (left.blockedReason === right.blockedReason ? 0 : left.blockedReason ? 1 : -1)
        || left.destinationModuleKey.localeCompare(right.destinationModuleKey));
    return {
        snapshot,
        orderedShortfalls: evaluation.shortfalls,
        topRecommendation: orderedCandidates[0] ?? null,
        topRouteCandidates: orderedCandidates.slice(0, 3),
        perProblemRecommendations,
        moduleSummaries: buildModuleRecommendationSummaries(perProblemRecommendations),
        readinessBand: evaluation.readinessBand,
        majorShortfallCount: evaluation.shortfalls.filter((entry) => entry.severity === 'critical' || entry.severity === 'high').length,
    };
}
export function buildLiveEconomicRecommendationEngine() {
    return buildEconomicRecommendationEngine(buildLiveEconomicRuntimeSnapshot());
}
export function buildEconomicRecommendationEngineFromState(input) {
    return buildEconomicRecommendationEngine(buildEconomicRuntimeSnapshotFromState(input));
}
export function buildEconomicRecommendationEngineFromContent(input) {
    return buildEconomicRecommendationEngineFromState({
        ...input,
        currentTrialProgressById: input.currentTrialProgressById,
    });
}
