import type { LiveWorldModuleKey } from '../../content/index.js';
import type { EconomicProblemRecommendation, ModuleRecommendationSummary } from './economicRecommendationTypes.js';
import type { EconomicProblemKind } from './economicProblemKinds.js';

const ORDERED_MODULE_KEYS: readonly LiveWorldModuleKey[] = [
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
  'ruins',
  'outskirts',
  'manualPavilion',
  'gateTrial',
];

export function buildModuleRecommendationSummaries(
  perProblemRecommendations: readonly EconomicProblemRecommendation[],
): ModuleRecommendationSummary[] {
  return ORDERED_MODULE_KEYS.flatMap((moduleKey) => {
    const matchingCandidates = perProblemRecommendations.flatMap((recommendation) =>
      recommendation.candidates.filter((candidate) => candidate.destinationModuleKey === moduleKey),
    );
    if (matchingCandidates.length === 0) return [];

    const primaryCandidate = matchingCandidates.find((candidate) => !candidate.blockedReason) ?? matchingCandidates[0];
    const minPriority = Math.min(...matchingCandidates.map((candidate) => candidate.priorityBand));
    const weight: ModuleRecommendationSummary['weight'] = minPriority === 1
      ? 'primary'
      : minPriority <= 3
        ? 'secondary'
        : 'optional';

    return [{
      moduleKey,
      weight,
      helpsSolveProblemKind: primaryCandidate?.problemKind ?? null,
      whyItMatters: primaryCandidate?.reasonSummary ?? `${moduleKey} matters for current economic recovery.`,
      topReason: primaryCandidate?.reasonSummary ?? `${moduleKey} matters for current economic recovery.`,
      relatedIds: [...new Set(matchingCandidates.flatMap((candidate) => candidate.relatedIds))],
      defaultChipIntent: getDefaultModuleRecommendationChipIntent(weight, primaryCandidate?.problemKind ?? null),
    }];
  });
}

export function getDefaultModuleRecommendationChipIntent(
  weight: ModuleRecommendationSummary['weight'],
  problemKind: EconomicProblemKind | null,
): NonNullable<ModuleRecommendationSummary['defaultChipIntent']> {
  if (weight !== 'primary') return 'useful_soon';
  if (problemKind === 'missingGatePrepPackage') return 'gate_critical';
  if (problemKind === 'buildCorrectionGap' || problemKind === 'belowMinimumForgeFloor' || problemKind === 'belowRecommendedForgeFloor') return 'build_fix';
  if (
    problemKind === 'belowHealingFloor'
    || problemKind === 'belowSpecialtyFloor'
    || problemKind === 'belowCultivationPrepFloor'
    || problemKind === 'belowMeritReserve'
    || problemKind === 'belowSpiritStoneMinimum'
    || problemKind === 'belowSpiritStoneIdeal'
  ) return 'stock_low';
  return 'recommended_now';
}
