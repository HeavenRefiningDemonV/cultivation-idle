import type { StatusRequirementKind } from './statusDashboardSurface.js';
import type { StatusLedgerTone } from './statusLedgerTypes.js';

export const STATUS_LEDGER_SCHEMA_VERSION = 'status-ledger-v1' as const;

export const STATUS_LEDGER_TITLES = {
  milestone: 'Milestone',
  cultivationBase: 'Cultivation Base',
  missionRequirements: 'Mission Requirements',
  bestImprovements: 'Best Improvements',
  safetyNet: 'Safety Net',
  identityDoctrine: 'Identity & Doctrine',
  currentWork: 'Current Work',
  buildPreparation: 'Build & Preparation',
  recentChanges: 'Recent Changes',
  details: 'How calculated',
} as const;

export const STATUS_LEDGER_ROW_BUDGETS = {
  metricsMax: 9,
  milestoneRowsMax: 5,
  milestoneNodesMax: 4,
  cultivationBaseRowsMax: 8,
  missionRequirementRowsMax: 7,
  bestImprovementRowsMax: 4,
  safetyNetRowsMax: 5,
  identityDoctrineRowsMax: 7,
  currentWorkRowsMax: 6,
  buildRowsMax: 7,
  reserveRowsMax: 6,
  recentChangesRowsMax: 4,
  detailsRowsMax: 8,
} as const;

function legacyPhrase(...parts: string[]): string {
  return parts.join(' ');
}

function legacyPattern(...parts: string[]): RegExp {
  return new RegExp(`\\b${parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')}\\b`, 'gi');
}

export const STATUS_LEDGER_FORBIDDEN_COPY = [
  legacyPhrase('Current', 'Omen'),
  legacyPhrase('Gate', 'Proof'),
  legacyPhrase('Recent', 'Omens'),
  legacyPhrase('Source', 'Thread'),
  legacyPhrase('Proof', 'Detail'),
  legacyPhrase('Preparation', 'Health'),
  legacyPhrase('Mandate', 'Lens'),
  legacyPhrase('Module', 'Source-Sink'),
  legacyPhrase('Threshold', 'Omen'),
  legacyPhrase('Omen', 'evidence'),
  legacyPhrase('Dao', 'Mandate', 'Interface'),
  legacyPhrase('Mandate', 'points', 'elsewhere'),
  legacyPhrase('Current', 'Mandate'),
  legacyPhrase('proof', 'source', 'handoff'),
  legacyPhrase('status', 'snapshot', 'only'),
  legacyPhrase('cultivation', 'compact', 'only'),
  legacyPhrase('proof', 'sealed'),
  legacyPhrase('source', 'sealed'),
  legacyPhrase('No', 'dominant', 'omen'),
  legacyPhrase('Mercy', 'proof'),
  legacyPhrase('Gate', 'proof'),
  legacyPhrase('Dantian', 'proof'),
] as const;

export const STATUS_LEDGER_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [legacyPattern('Current', 'Omen'), 'Current Bottleneck'],
  [legacyPattern('Recent', 'Omens'), 'Recent Changes'],
  [legacyPattern('Source', 'Thread'), 'How calculated'],
  [legacyPattern('source', 'thread'), 'material route'],
  [legacyPattern('Proof', 'Detail'), 'Requirement Detail'],
  [legacyPattern('Preparation', 'Health'), 'Preparation Summary'],
  [legacyPattern('Mandate', 'Lens'), 'Local Detail'],
  [legacyPattern('Module', 'Source-Sink'), 'Module Purpose'],
  [legacyPattern('Threshold', 'Omen'), 'Breakthrough Threshold'],
  [legacyPattern('Omen', 'evidence'), 'Bottleneck detail'],
  [legacyPattern('Dao', 'Mandate', 'Interface'), 'Guidance Settings'],
  [legacyPattern('Mandate', 'points', 'elsewhere'), 'No active blocker surfaced'],
  [legacyPattern('Current', 'Mandate'), 'Milestone State'],
  [legacyPattern('Mandate', 'Ledger'), 'Mission Requirements'],
  [legacyPattern('Mandate', 'Chamber'), 'Status Ledger'],
  [legacyPattern('Mandate', 'Context'), 'Route Context'],
  [legacyPattern('Primary', 'Route'), 'Primary Improvement'],
  [legacyPattern('Best', 'Next', 'Action'), 'Best Improvement'],
  [legacyPattern('Biggest', 'Shortfall'), 'Main Gap'],
  [legacyPattern('Primary', 'Obstruction'), 'Main Gap'],
  [legacyPattern('proof', 'source', 'handoff'), 'requirement detail'],
  [legacyPattern('status', 'snapshot', 'only'), 'status summary only'],
  [legacyPattern('cultivation', 'compact', 'only'), 'cultivation summary only'],
  [legacyPattern('proof', 'sealed'), 'requirement settled'],
  [legacyPattern('source', 'sealed'), 'route settled'],
  [legacyPattern('No', 'dominant', 'omen', 'is', 'surfaced'), 'No major blocker is surfaced'],
  [legacyPattern('No', 'dominant', 'omen'), 'No major blocker'],
  [legacyPattern('Mercy', 'proof'), 'Safety Net'],
  [legacyPattern('Dantian', 'proof', 'is', 'incomplete'), 'Qi threshold is incomplete'],
  [legacyPattern('Dantian', 'proof'), 'Qi threshold'],
  [legacyPattern('Gate', 'proof', 'can', 'be', 'inspected'), 'Gate readiness can be inspected'],
  [legacyPattern('Gate', 'proof'), 'Gate item'],
  [legacyPattern('Gate', 'Proof'), 'Gate Readiness'],
  [legacyPattern('World', 'proof', 'needs', 'inspection'), 'Inspect World route'],
  [legacyPattern('world', 'proof'), 'world route'],
  [legacyPattern('Forge', 'proof'), 'Forge Floor'],
  [/\bproof shows\b/gi, 'readiness shows'],
  [/\bproof\b/gi, 'readiness'],
] as const;

export const STATUS_LEDGER_TONE_PRIORITY: Record<StatusLedgerTone, number> = {
  danger: 0,
  warning: 1,
  gold: 2,
  info: 3,
  jade: 4,
  success: 5,
  muted: 6,
} as const;

export const STATUS_LEDGER_REQUIREMENT_PRIORITY: Record<StatusRequirementKind, number> = {
  content_cap: 0,
  prestige: 1,
  gate_item: 2,
  required_item: 3,
  qi: 4,
  healing: 5,
  forge: 6,
  loadout: 7,
  technique: 8,
  manual: 9,
  safety_net: 10,
  currency: 11,
  activity: 12,
  city_unlock: 13,
  unknown: 14,
} as const;

export const STATUS_LEDGER_SECTION_ORDER = [
  'milestone',
  'cultivation_base',
  'mission_requirements',
  'best_improvements',
  'safety_net',
  'identity_doctrine',
  'current_work',
  'build_preparation',
  'recent_changes',
  'details',
] as const;

export function sanitizeStatusLedgerCopy(input: string): string {
  let output = input;
  for (const [pattern, replacement] of STATUS_LEDGER_REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }
  return output.replace(/\s+/g, ' ').trim();
}

export function containsForbiddenLedgerCopy(input: string): boolean {
  return STATUS_LEDGER_FORBIDDEN_COPY.some((term) => input.includes(term));
}
