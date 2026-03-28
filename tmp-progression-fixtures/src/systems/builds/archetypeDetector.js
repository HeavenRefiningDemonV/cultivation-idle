import { BUILD_ARCHETYPE_ORDER, getBuildArchetypesForPath } from './archetypeRegistry.js';
export function scoreArchetypeMatch(input) {
    const primaryMatches = input.archetype.primaryFamilies.filter((family) => (input.familyCoverage[family] ?? 0) > 0).length;
    const secondaryMatches = input.archetype.secondaryFamilies.filter((family) => (input.familyCoverage[family] ?? 0) > 0).length;
    const supportMatches = input.archetype.preferredSupportFlags.filter((flag) => (input.supportCoverage[flag] ?? 0) > 0).length;
    return (primaryMatches * 4) + (secondaryMatches * 2) + (supportMatches * 1);
}
export function detectArchetypeFromCoverage(input) {
    if (input.path === null) {
        return null;
    }
    let bestId = null;
    let bestScore = -1;
    const archetypesForPath = getBuildArchetypesForPath(input.path);
    BUILD_ARCHETYPE_ORDER.forEach((archetypeId) => {
        const archetype = archetypesForPath.find((candidate) => candidate.id === archetypeId);
        if (!archetype) {
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
