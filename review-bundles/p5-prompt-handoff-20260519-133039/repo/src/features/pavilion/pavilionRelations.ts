import type { PavilionRecord, PavilionRelatedEntrySurface } from './pavilionTypes.js';
import { normalizePavilionCategoryId } from './pavilionContentTypes.js';

function labelKey(value: string): string {
  return normalizePavilionCategoryId(value);
}

export function buildPavilionRecordLookup(records: readonly PavilionRecord[]): {
  byId: Record<string, PavilionRecord>;
  byLabel: Record<string, PavilionRecord>;
} {
  const byId: Record<string, PavilionRecord> = {};
  const byLabel: Record<string, PavilionRecord> = {};
  records.forEach((record) => {
    byId[record.id] = record;
    byLabel[labelKey(record.title)] = record;
    byLabel[labelKey(record.id)] = record;
    record.aliases?.forEach((alias) => {
      byLabel[labelKey(alias)] = record;
    });
  });
  return { byId, byLabel };
}

export function resolvePavilionRelatedEntries(
  labels: readonly string[],
  records: readonly PavilionRecord[],
): PavilionRelatedEntrySurface[] {
  const lookup = buildPavilionRecordLookup(records);
  return labels.map((label) => {
    const target = lookup.byId[label] ?? lookup.byLabel[labelKey(label)];
    return {
      id: `related-${labelKey(label)}`,
      label,
      stateKind: target?.state ?? 'rumored',
      targetEntryId: target?.id,
      unresolved: !target,
    };
  });
}

export function collectUnresolvedRelations(records: readonly PavilionRecord[]): string[] {
  const lookup = buildPavilionRecordLookup(records);
  const unresolved: string[] = [];
  records.forEach((record) => {
    record.related.forEach((label) => {
      if (!lookup.byId[label] && !lookup.byLabel[labelKey(label)]) {
        unresolved.push(`${record.id} -> ${label}`);
      }
    });
    record.debug.unresolvedRelations.forEach((entry) => unresolved.push(`${record.id}: ${entry}`));
  });
  return Array.from(new Set(unresolved)).sort();
}

