import type { CultivationPath } from '../../types/index.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';
import type { BuildArchetypeProfile } from './buildAnalysisTypes.js';
import { BUILD_ARCHETYPE_ORDER, getBuildArchetype } from './archetypeRegistry.js';

export function scoreArchetypeMatch(input: {
  archetype: BuildArchetypeProfile;
  familyCoverage: Record<TechniqueFamily, number>;
  supportCoverage: Record<TechniqueSupportFlag, number>;
}): number {
  const primaryMatches = input.archetype.primaryFamilies.filter((family) => (input.familyCoverage[family] ?? 0) > 0).length;
  const secondaryMatches = input.archetype.secondaryFamilies.filter((family) => (input.familyCoverage[family] ?? 0) > 0).length;
  const supportMatches = input.archetype.preferredSupportFlags.filter((flag) => (input.supportCoverage[flag] ?? 0) > 0).length;

  return (primaryMatches * 4) + (secondaryMatches * 2) + (supportMatches * 1);
}

export function detectArchetypeFromCoverage(input: {
  path: CultivationPath | null;
  familyCoverage: Record<TechniqueFamily, number>;
  supportCoverage: Record<TechniqueSupportFlag, number>;
}): string | null {
  if (input.path === null) {
    return null;
  }

  let bestId: string | null = null;
  let bestScore = -1;

  BUILD_ARCHETYPE_ORDER.forEach((archetypeId) => {
    const archetype = getBuildArchetype(archetypeId);
    if (!archetype || archetype.path !== input.path) {
      return;
    }

    const score = scoreArchetypeMatch({
      archetype,
      familyCoverage: input.familyCoverage,
      supportCoverage: input.supportCoverage,
    });

    if (score > bestScore) {
      bestId = archetype.id;
      bestScore = score;
    }
  });

  if (bestScore < 8) {
    return null;
  }

  return bestId;
}

