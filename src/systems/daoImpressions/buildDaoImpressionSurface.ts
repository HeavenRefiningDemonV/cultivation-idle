import type { DaoImpressionAward, DaoImpressionSurfaceV1 } from './types.js';

function sourceLabel(sourceKind: DaoImpressionAward['sourceKind']): string {
  switch (sourceKind) {
    case 'outskirts_first_boss':
      return 'Outskirts boss clear';
    case 'gate_close_defeat':
      return 'Close Gate Trial defeat';
    case 'gate_clear':
      return 'Gate Trial clear';
    case 'ruins_completion':
      return 'Ruins completion';
    case 'breakthrough_resonance':
      return 'Breakthrough';
    case 'technique_mastery_milestone':
      return 'Technique mastery';
  }
}

export function buildDaoImpressionSurface(award: DaoImpressionAward): DaoImpressionSurfaceV1 {
  return {
    version: 1,
    awardId: award.awardId,
    title: award.title,
    sourceLabel: sourceLabel(award.sourceKind),
    doctrineLine: `${award.doctrineFamily} doctrine pattern`,
    comprehensionLine: award.applied
      ? `+${award.comprehensionDelta} Comprehension`
      : `Comprehension skipped: ${award.skippedReason ?? 'unavailable'}`,
    targetLine: award.targetHeartLawId
      ? `Applied to ${award.targetHeartLawId.replace(/[_-]+/g, ' ')}.`
      : 'No Heart Law received this trace.',
    rarityBand: award.rarityBand,
    sealTone: award.rarityBand === 'threshold' ? 'gold' : award.rarityBand === 'deep' ? 'vermillion' : award.rarityBand === 'faint' ? 'shadow' : 'jade',
    memoryEligible: award.memoryEligible,
    routeLabel: award.routeHint?.label,
    debugNotes: [
      `source=${award.sourceKind}`,
      `applied=${award.applied ? 'yes' : 'no'}`,
      `sourceEventKey=${award.sourceEventKey}`,
    ],
  };
}

export function buildRecentDaoImpressionSurfaces(awards: readonly DaoImpressionAward[], limit = 3): DaoImpressionSurfaceV1[] {
  return awards.slice(0, Math.max(0, Math.floor(limit))).map(buildDaoImpressionSurface);
}
