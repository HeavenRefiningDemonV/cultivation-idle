import type { StatusRequirementKind, StatusRouteTarget } from './statusDashboardSurface.js';
import {
  containsForbiddenLedgerCopy,
  sanitizeStatusLedgerCopy,
  STATUS_LEDGER_REQUIREMENT_PRIORITY,
  STATUS_LEDGER_TONE_PRIORITY,
} from './statusLedgerPresentation.js';
import type {
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerRequirementRow,
  StatusLedgerTone,
} from './statusLedgerTypes.js';

export { containsForbiddenLedgerCopy, sanitizeStatusLedgerCopy };

const VALID_TONES = new Set<StatusLedgerTone>(['success', 'info', 'warning', 'danger', 'muted', 'jade', 'gold']);

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sanitizeTarget(target: StatusRouteTarget): StatusRouteTarget {
  if (target.kind !== 'none') return target;
  return { ...target, reason: sanitizeStatusLedgerCopy(target.reason) };
}

export function toLedgerTone(input: string | null | undefined): StatusLedgerTone {
  const normalized = (input ?? '').toLowerCase();
  if (VALID_TONES.has(normalized as StatusLedgerTone)) return normalized as StatusLedgerTone;
  if (/blocked|missing|below|under|danger|bad|not ready|shortfall|incomplete|thin|unstable/.test(normalized)) return 'danger';
  if (/warning|disabled|risky|short|too early|gap|behind|locked/.test(normalized)) return 'warning';
  if (/ready|met|resolved|cleared|available|complete|stable|affordable/.test(normalized)) return 'success';
  if (/qi|cultivation|spirit root|heart law|breath|focus/.test(normalized)) return 'jade';
  if (/gate|milestone|cap|prestige|reincarnation|safety net/.test(normalized)) return 'gold';
  if (/primary|attempt|restock|refine|assign|track|review|route|open/.test(normalized)) return 'info';
  return 'muted';
}

export function capRows<T>(rows: T[], max: number): T[] {
  return rows.slice(0, Math.max(0, max));
}

export function sanitizeLedgerAction(action: StatusLedgerActionSurface): StatusLedgerActionSurface {
  return {
    ...action,
    label: sanitizeStatusLedgerCopy(action.label),
    detail: sanitizeStatusLedgerCopy(action.detail),
    destinationLabel: sanitizeStatusLedgerCopy(action.destinationLabel),
    target: sanitizeTarget(action.target),
    disabledReason: action.disabledReason ? sanitizeStatusLedgerCopy(action.disabledReason) : null,
  };
}

export function sanitizeLedgerFactRow(row: StatusLedgerFactRow): StatusLedgerFactRow {
  return {
    ...row,
    label: sanitizeStatusLedgerCopy(row.label),
    value: row.value == null ? null : sanitizeStatusLedgerCopy(row.value),
    detail: sanitizeStatusLedgerCopy(row.detail),
    sourceLabel: sanitizeStatusLedgerCopy(row.sourceLabel),
    action: row.action ? sanitizeLedgerAction(row.action) : row.action ?? null,
  };
}

export function sanitizeLedgerRequirementRow(row: StatusLedgerRequirementRow): StatusLedgerRequirementRow {
  return {
    ...sanitizeLedgerFactRow(row),
    kind: row.kind,
    gapLabel: row.gapLabel ? sanitizeStatusLedgerCopy(row.gapLabel) : null,
    priorityLabel: row.priorityLabel ? sanitizeStatusLedgerCopy(row.priorityLabel) : null,
    sourceModuleLabel: row.sourceModuleLabel ? sanitizeStatusLedgerCopy(row.sourceModuleLabel) : null,
  };
}

function richness(row: { detail?: string; value?: string | null; action?: unknown }): number {
  return (row.detail?.length ?? 0) + (row.value?.length ?? 0) + (row.action ? 25 : 0);
}

export function dedupeFactRows<T extends { id: string; label: string; detail?: string; value?: string | null }>(rows: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const key = `${normalizeKey(row.id)}:${normalizeKey(row.label)}:${normalizeKey(row.value)}:${normalizeKey(row.detail)}`;
    const existing = byKey.get(key);
    if (!existing || richness(row) > richness(existing)) byKey.set(key, row);
  }
  return [...byKey.values()];
}

function requirementSemanticKey(row: StatusLedgerRequirementRow): string {
  const target = row.action?.target ? JSON.stringify(row.action.target) : '';
  return [
    row.kind,
    normalizeKey(row.label),
    normalizeKey(row.sourceModuleLabel),
    normalizeKey(target),
  ].join('|');
}

export function dedupeRequirementRows(rows: StatusLedgerRequirementRow[]): StatusLedgerRequirementRow[] {
  const byKey = new Map<string, StatusLedgerRequirementRow>();
  for (const row of rows) {
    const key = requirementSemanticKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }

    const existingTone = STATUS_LEDGER_TONE_PRIORITY[existing.tone] ?? 99;
    const rowTone = STATUS_LEDGER_TONE_PRIORITY[row.tone] ?? 99;
    const existingKind = STATUS_LEDGER_REQUIREMENT_PRIORITY[existing.kind] ?? 99;
    const rowKind = STATUS_LEDGER_REQUIREMENT_PRIORITY[row.kind] ?? 99;
    if (
      rowTone < existingTone ||
      (rowTone === existingTone && rowKind < existingKind) ||
      (rowTone === existingTone && rowKind === existingKind && richness(row) > richness(existing))
    ) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

export function sortRequirementRows(rows: StatusLedgerRequirementRow[]): StatusLedgerRequirementRow[] {
  return [...rows].sort((a, b) => {
    const primaryA = a.priorityLabel === 'Primary blocker' ? -1 : 0;
    const primaryB = b.priorityLabel === 'Primary blocker' ? -1 : 0;
    if (primaryA !== primaryB) return primaryA - primaryB;

    const toneA = STATUS_LEDGER_TONE_PRIORITY[a.tone] ?? 99;
    const toneB = STATUS_LEDGER_TONE_PRIORITY[b.tone] ?? 99;
    if (toneA !== toneB) return toneA - toneB;

    const kindA = STATUS_LEDGER_REQUIREMENT_PRIORITY[a.kind] ?? 99;
    const kindB = STATUS_LEDGER_REQUIREMENT_PRIORITY[b.kind] ?? 99;
    if (kindA !== kindB) return kindA - kindB;

    return a.label.localeCompare(b.label);
  });
}

function actionTargetKey(action: StatusLedgerActionSurface): string {
  return JSON.stringify(action.target);
}

function actionScore(action: StatusLedgerActionSurface): number {
  let score = 0;
  if (!action.disabled) score += 100;
  if (action.primary) score += 50;
  if (!/^open\s/i.test(action.label)) score += 10;
  score += Math.min(action.detail.length, 80) / 10;
  return score;
}

export function dedupeLedgerActionsByTarget(actions: StatusLedgerActionSurface[]): StatusLedgerActionSurface[] {
  const byKey = new Map<string, StatusLedgerActionSurface>();
  for (const action of actions) {
    const key = actionTargetKey(action);
    const existing = byKey.get(key);
    if (!existing || actionScore(action) > actionScore(existing)) byKey.set(key, action);
  }
  return [...byKey.values()];
}

export function sourceModuleForRequirementKind(kind: StatusRequirementKind): string | null {
  switch (kind) {
    case 'qi':
      return 'Cultivation';
    case 'gate_item':
    case 'required_item':
      return 'Gate Trial';
    case 'healing':
      return 'Apothecary';
    case 'forge':
      return 'Forge';
    case 'loadout':
    case 'technique':
      return 'Techniques';
    case 'manual':
      return 'Manual Pavilion';
    case 'currency':
      return 'Support Economy';
    case 'safety_net':
      return 'Gate Trial';
    case 'city_unlock':
      return 'World';
    case 'prestige':
    case 'content_cap':
      return 'Prestige';
    case 'activity':
      return 'Current Work';
    case 'unknown':
      return null;
  }
}

export function flattenLedgerTextForTests(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenLedgerTextForTests(entry));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => flattenLedgerTextForTests(entry));
  }
  return [];
}
