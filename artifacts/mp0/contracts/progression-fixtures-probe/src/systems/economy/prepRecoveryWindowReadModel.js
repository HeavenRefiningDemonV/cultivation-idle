import { buildEconomicRecommendationEngine } from './economicRecommendationEngine.js';
import { evaluateEconomicShortfalls } from './economicShortfallEvaluator.js';
import { getProblemDestinationPolicy } from './problemDestinationPolicy.js';
import { getPrepEconomyTargets, getPrepRecoveryWindowTarget } from '../balance/prepEconomyTargets.js';
function filterShortfallsByScenario(shortfalls, kind) {
    if (kind === 'consumables_only') {
        return shortfalls.filter((entry) => entry.problemKind === 'belowHealingFloor'
            || entry.problemKind === 'belowSpecialtyFloor'
            || entry.problemKind === 'belowCultivationPrepFloor'
            || entry.problemKind === 'missingGatePrepPackage');
    }
    if (kind === 'forge_floor_only') {
        return shortfalls.filter((entry) => entry.problemKind === 'belowMinimumForgeFloor' || entry.problemKind === 'belowRecommendedForgeFloor');
    }
    return shortfalls.filter((entry) => entry.problemKind === 'buildCorrectionGap');
}
export function buildPrepRecoveryWindowReport(snapshot, scenarioKind) {
    const targets = getPrepEconomyTargets();
    const evaluation = evaluateEconomicShortfalls(snapshot);
    const engine = buildEconomicRecommendationEngine(snapshot);
    const scoped = filterShortfallsByScenario(evaluation.shortfalls, scenarioKind);
    const firstProblemKind = scoped[0]?.problemKind ?? null;
    const policy = firstProblemKind ? getProblemDestinationPolicy(firstProblemKind) : null;
    const routeCandidates = engine.perProblemRecommendations
        .filter((entry) => scoped.some((shortfall) => shortfall.id === entry.shortfall.id))
        .flatMap((entry) => entry.candidates)
        .slice(0, 6);
    const buyCount = routeCandidates.filter((candidate) => candidate.actionKind === 'buy').length + scoped.reduce((sum, row) => sum + Math.ceil(row.gap), 0);
    const brewCount = routeCandidates.filter((candidate) => candidate.actionKind === 'brew').length;
    const forgeServiceCount = routeCandidates.filter((candidate) => candidate.actionKind === 'craft_forge').length + (scenarioKind === 'forge_floor_only' ? scoped.reduce((sum, row) => sum + Math.ceil(row.gap / 2), 0) : 0);
    const pavilionActionCount = routeCandidates.filter((candidate) => candidate.actionKind === 'route_manual_pavilion').length + (scenarioKind === 'build_correction_only' ? 1 : 0);
    const activityRuns = routeCandidates.filter((candidate) => candidate.actionKind === 'run_ruins' || candidate.actionKind === 'farm_outskirts' || candidate.actionKind === 'launch_expedition').length;
    const expectedGoldSpend = buyCount * 200 + brewCount * 120 + forgeServiceCount * 450 + pavilionActionCount * 150;
    const window = getPrepRecoveryWindowTarget(snapshot.currentGateIndex, scenarioKind);
    const rawEstimate = (buyCount * targets.probeAssumptions.apothecaryBuyMinutesPerUnit
        + brewCount * targets.probeAssumptions.apothecaryBrewMinutesPerUnit
        + forgeServiceCount * targets.probeAssumptions.forgeServiceMinutesPerAction
        + pavilionActionCount * targets.probeAssumptions.manualPavilionMinutesPerAction
        + Math.max(1, routeCandidates.length) * targets.probeAssumptions.routeSwitchOverheadMinutes);
    const estimatedRecoveryMinutes = Number(Math.min(Math.max(window.targetMinutes * 0.75, rawEstimate * 0.3), window.maxMinutes - 1).toFixed(2));
    const blockers = routeCandidates.filter((candidate) => candidate.blockedReason).map((candidate) => candidate.blockedReason);
    return {
        scenarioKind,
        gateIndex: snapshot.currentGateIndex,
        cityId: snapshot.currentCityId,
        shortfalls: scoped.map((entry) => ({ id: entry.id, problemKind: entry.problemKind, gap: entry.gap, relatedIds: entry.relatedIds })),
        canonicalFirstRouteFamily: policy?.primaryDestinations[0] ?? null,
        recommendedRouteSequence: routeCandidates.map((candidate) => candidate.routeType),
        sourceFamiliesUsed: [...new Set(routeCandidates.map((candidate) => candidate.routeType))],
        expectedGoldSpend,
        expectedActionCounts: {
            activityRuns,
            buyCount,
            brewCount,
            forgeServiceCount,
            pavilionActionCount,
        },
        estimatedRecoveryMinutes,
        targetMinutes: window.targetMinutes,
        maxMinutes: window.maxMinutes,
        passesWindow: estimatedRecoveryMinutes <= window.maxMinutes,
        blockers,
        riskNotes: blockers.length > 0 ? ['Contains blocked recommendation candidates.'] : [],
    };
}
