export type CombatTrioModuleKey = 'outskirts' | 'ruins' | 'gateTrial';

export interface CombatTrioTruthEntry {
  roleTag: string;
  bestUsedWhenClause: string;
  bestUsedWhenSentence: string;
  boundaryLine?: string;
}

function normalizeClause(clause: string): string {
  const trimmed = clause.trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

export function bestUsedWhenClauseToSentence(clauseOrSentence: string): string {
  const trimmed = clauseOrSentence.trim();
  if (/^best used when /i.test(trimmed)) {
    return normalizeClause(trimmed);
  }
  const normalizedClause = normalizeClause(trimmed);
  return `Best used when ${normalizedClause.charAt(0).toLowerCase()}${normalizedClause.slice(1)}`;
}

const COMBAT_TRIO_BASE = {
  outskirts: {
    roleTag: 'Gold & Common Mats',
    bestUsedWhenClause: 'you need gold, common materials, or low-risk combat reps.',
    boundaryLine: 'Not the best source for targeted city materials.',
  },
  ruins: {
    roleTag: 'Targeted Mats',
    bestUsedWhenClause: 'you need targeted local materials and deterministic support rewards.',
    boundaryLine: 'Gold is secondary here; the run is for targeted local materials and support stability.',
  },
  gateTrial: {
    roleTag: 'Gate Progress',
    bestUsedWhenClause: 'you are ready to resolve the current gate trial.',
  },
} as const satisfies Record<CombatTrioModuleKey, Omit<CombatTrioTruthEntry, 'bestUsedWhenSentence'>>;

export const COMBAT_TRIO_TRUTH = {
  outskirts: {
    ...COMBAT_TRIO_BASE.outskirts,
    bestUsedWhenSentence: bestUsedWhenClauseToSentence(COMBAT_TRIO_BASE.outskirts.bestUsedWhenClause),
  },
  ruins: {
    ...COMBAT_TRIO_BASE.ruins,
    bestUsedWhenSentence: bestUsedWhenClauseToSentence(COMBAT_TRIO_BASE.ruins.bestUsedWhenClause),
  },
  gateTrial: {
    ...COMBAT_TRIO_BASE.gateTrial,
    bestUsedWhenSentence: bestUsedWhenClauseToSentence(COMBAT_TRIO_BASE.gateTrial.bestUsedWhenClause),
  },
} as const satisfies Record<CombatTrioModuleKey, CombatTrioTruthEntry>;

export function getCombatTrioTruth(moduleKey: CombatTrioModuleKey): CombatTrioTruthEntry {
  return COMBAT_TRIO_TRUTH[moduleKey];
}
