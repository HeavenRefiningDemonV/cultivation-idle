import type { LiveWorldModuleKey } from '../../content/index.js';
import type { EconomicProblemRecommendation, ModuleRecommendationSummary } from './economicRecommendationTypes.js';

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
    }];
  });
}
