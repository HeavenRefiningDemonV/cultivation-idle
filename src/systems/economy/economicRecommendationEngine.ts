import type { LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import type { CultivationPath } from '../../types/index.js';
import { buildLiveEconomicRuntimeSnapshot, buildEconomicRuntimeSnapshotFromState } from './economicSnapshot.js';
import { evaluateEconomicShortfalls } from './economicShortfallEvaluator.js';
import { resolveMissingMaterialRoutes, type MissingMaterialRouteOption } from './missingMaterialRouteResolver.js';
import { buildModuleRecommendationSummaries } from './moduleRecommendationSummaries.js';
import type {
  EconomicProblemRecommendation,
  EconomicRecommendationActionKind,
  EconomicRecommendationCandidate,
  EconomicRecommendationEngineResult,
  EconomicRuntimeSnapshot,
  EconomicShortfall,
} from './economicRecommendationTypes.js';

function mapRouteTypeToActionKind(routeType: MissingMaterialRouteOption['routeType']): EconomicRecommendationActionKind {
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

function addEngineBlockedReason(
  snapshot: EconomicRuntimeSnapshot,
  route: MissingMaterialRouteOption,
): string | null {
  if (route.routeType === 'expeditions' && snapshot.expeditionState.availableSlotCount <= 0) {
    return 'No expedition slot is available right now.';
  }
  return route.blockedReason;
}

function toCandidate(
  snapshot: EconomicRuntimeSnapshot,
  shortfall: EconomicShortfall,
  route: MissingMaterialRouteOption,
): EconomicRecommendationCandidate {
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

function buildDirectModuleCandidates(snapshot: EconomicRuntimeSnapshot, shortfall: EconomicShortfall): EconomicRecommendationCandidate[] {
  const moduleKey = (
    shortfall.problemKind === 'belowMinimumForgeFloor' || shortfall.problemKind === 'belowRecommendedForgeFloor'
      ? 'forge'
      : shortfall.problemKind === 'belowMeritReserve' || shortfall.problemKind === 'belowSpiritStoneMinimum' || shortfall.problemKind === 'belowSpiritStoneIdeal'
        ? 'bounties'
        : shortfall.problemKind === 'buildCorrectionGap'
          ? 'manualPavilion'
          : 'gateTrial'
  ) as LiveWorldModuleKey;
  const routeType = (
    moduleKey === 'forge' ? 'forge'
      : moduleKey === 'bounties' ? 'bounties'
        : moduleKey === 'manualPavilion' ? 'manual_pavilion'
          : 'gate_trial'
  ) as EconomicRecommendationCandidate['routeType'];

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

function buildProblemRecommendation(snapshot: EconomicRuntimeSnapshot, shortfall: EconomicShortfall): EconomicProblemRecommendation {
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

export function buildEconomicRecommendationEngine(snapshot: EconomicRuntimeSnapshot): EconomicRecommendationEngineResult {
  const evaluation = evaluateEconomicShortfalls(snapshot);
  const perProblemRecommendations = evaluation.shortfalls.map((shortfall) => buildProblemRecommendation(snapshot, shortfall));
  const orderedCandidates = perProblemRecommendations
    .flatMap((entry) => entry.candidates)
    .sort((left, right) =>
      left.priorityBand - right.priorityBand
      || (left.blockedReason === right.blockedReason ? 0 : left.blockedReason ? 1 : -1)
      || left.destinationModuleKey.localeCompare(right.destinationModuleKey),
    );

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

export function buildLiveEconomicRecommendationEngine(): EconomicRecommendationEngineResult {
  return buildEconomicRecommendationEngine(buildLiveEconomicRuntimeSnapshot());
}

export function buildEconomicRecommendationEngineFromState(input: Parameters<typeof buildEconomicRuntimeSnapshotFromState>[0]): EconomicRecommendationEngineResult {
  return buildEconomicRecommendationEngine(buildEconomicRuntimeSnapshotFromState(input));
}

export function buildEconomicRecommendationEngineFromContent(input: {
  content: ValidatedContent;
  currentCityId: string | null;
  unlockedCityIds: readonly string[];
  selectedModuleByCity?: Record<string, string>;
  selectedPath: CultivationPath | null;
  currentRealmIndex: number;
  currencies: { gold: string; merit: string; spiritStones: string };
  itemCountsById: Record<string, number>;
  purchasedTodayByStockId?: Record<string, number>;
  forgeFloor: EconomicRuntimeSnapshot['forgeFloor'];
  expeditionState: EconomicRuntimeSnapshot['expeditionState'];
  currentTrialProgressById?: EconomicRuntimeSnapshot['phase']['currentGateTransition'] extends { trialId: infer _T } ? Record<string, unknown> : Record<string, never>;
}): EconomicRecommendationEngineResult {
  return buildEconomicRecommendationEngineFromState({
    ...input,
    currentTrialProgressById: input.currentTrialProgressById as Parameters<typeof buildEconomicRuntimeSnapshotFromState>[0]['currentTrialProgressById'],
  });
}
