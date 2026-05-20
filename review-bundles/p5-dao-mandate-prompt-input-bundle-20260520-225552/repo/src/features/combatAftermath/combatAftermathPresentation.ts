import type {
  CombatAftermathContextKind,
  CombatAftermathOutcomeKind,
  CombatAftermathSpoilsGroup,
  CombatAftermathSpoilsGroupId,
  CombatAftermathVictoryGrade,
} from './types.js';

export const SPOILS_GROUP_TITLES: Record<CombatAftermathSpoilsGroupId, string> = {
  immediate_spend: 'Immediate Spend',
  gate_prep: 'Gate Prep',
  doctrine: 'Doctrine',
  crafting: 'Crafting',
  reputation: 'Reputation',
  rare_signs: 'Rare Signs',
  gate_proof: 'Gate Proof',
};

export const SPOILS_GROUP_ORDER: CombatAftermathSpoilsGroupId[] = [
  'immediate_spend',
  'gate_prep',
  'doctrine',
  'crafting',
  'reputation',
  'rare_signs',
  'gate_proof',
];

export function titleCaseWords(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatItemLabel(
  itemId: string,
  itemNamesById: Record<string, { name?: string } | string | undefined> | undefined,
): string {
  const entry = itemNamesById?.[itemId];
  if (typeof entry === 'string' && entry.trim()) return entry;
  if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.trim()) return entry.name;
  return titleCaseWords(itemId.replace(/^item_/, '').replace(/^mat_/, '').replace(/^gate_/, 'gate '));
}

export function formatCurrencyLabel(currencyKey: string, labels?: Record<string, string | undefined>): string {
  return labels?.[currencyKey] ?? titleCaseWords(currencyKey);
}

export function gradeLabel(grade: CombatAftermathVictoryGrade, outcome: CombatAftermathOutcomeKind): string {
  if (outcome === 'defeat') return 'Gate Rejected';
  if (outcome === 'bypassed') return 'Support Run Complete';
  switch (grade) {
    case 'breakthrough_worthy':
      return 'Breakthrough-worthy Clear';
    case 'clean':
      return 'Clean Victory';
    case 'strained':
      return 'Strained Victory';
    case 'overmatched':
      return 'Narrow Victory';
    case 'wasteful':
      return 'Wasteful Victory';
    case 'not_applicable':
      return 'Routed';
    case 'unknown':
    default:
      return 'Result Recorded';
  }
}

export function contextTitle(kind: CombatAftermathContextKind): string {
  switch (kind) {
    case 'outskirts':
      return 'Outskirts Aftermath';
    case 'ruins':
      return 'Ruins Aftermath';
    case 'gate_trial':
      return 'Gate Judgment';
  }
}

export function createEmptySpoilsGroup(id: CombatAftermathSpoilsGroupId): CombatAftermathSpoilsGroup {
  return {
    id,
    title: SPOILS_GROUP_TITLES[id],
    summary: 'No change recorded.',
    lines: [],
    tone: id === 'gate_proof' ? 'ceremonial' : 'muted',
    empty: true,
  };
}

export function summarizeGroup(group: CombatAftermathSpoilsGroup): CombatAftermathSpoilsGroup {
  if (group.lines.length === 0) return { ...group, empty: true };
  const first = group.lines[0];
  const extra = group.lines.length > 1 ? ` and ${group.lines.length - 1} more` : '';
  const label = group.id === 'gate_proof'
    ? `Gate proof: ${first?.value ?? first?.label ?? group.title}`
    : `${first?.value ?? first?.label ?? group.title}`;
  return {
    ...group,
    summary: `${label}${extra}.`,
    empty: false,
  };
}
