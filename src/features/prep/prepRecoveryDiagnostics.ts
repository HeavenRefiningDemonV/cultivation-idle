export type PrepRecoveryCategory = 'consumables' | 'equipment' | 'build' | 'package';

interface PrepRecoveryRecord {
  gateId: string;
  category: PrepRecoveryCategory;
  firstMissingAt: number;
  firstResolvedAt: number | null;
  routeUsed: string | null;
  runTimeMinutesAtMissing: number | null;
  runTimeMinutesAtResolved: number | null;
}

const records = new Map<string, PrepRecoveryRecord>();

function keyOf(gateId: string, category: PrepRecoveryCategory) {
  return `${gateId}::${category}`;
}

export function recordPrepRecoveryDiagnosticEvent(event: {
  gateId: string;
  category: PrepRecoveryCategory;
  status: 'missing' | 'resolved';
  timestamp?: number;
  routeUsed?: string;
  runTimeMinutes?: number;
}) {
  const key = keyOf(event.gateId, event.category);
  const now = event.timestamp ?? Date.now();
  const existing = records.get(key);

  if (event.status === 'missing') {
    if (!existing) {
      records.set(key, {
        gateId: event.gateId,
        category: event.category,
        firstMissingAt: now,
        firstResolvedAt: null,
        routeUsed: event.routeUsed ?? null,
        runTimeMinutesAtMissing: event.runTimeMinutes ?? null,
        runTimeMinutesAtResolved: null,
      });
    }
    return;
  }

  if (!existing) return;
  if (existing.firstResolvedAt !== null) return;

  existing.firstResolvedAt = now;
  existing.routeUsed = event.routeUsed ?? existing.routeUsed;
  existing.runTimeMinutesAtResolved = event.runTimeMinutes ?? null;
  records.set(key, existing);
}

export function getPrepRecoveryDiagnosticsSnapshot() {
  const entries = [...records.values()]
    .map((record) => {
      const durationMinutes = record.firstResolvedAt
        ? (record.firstResolvedAt - record.firstMissingAt) / 60000
        : null;
      return {
        ...record,
        durationMinutes,
      };
    })
    .sort((a, b) => a.firstMissingAt - b.firstMissingAt);

  return {
    totalTracked: entries.length,
    openIssues: entries.filter((entry) => entry.firstResolvedAt === null).length,
    resolvedIssues: entries.filter((entry) => entry.firstResolvedAt !== null).length,
    entries,
  };
}

export function resetPrepRecoveryDiagnostics() {
  records.clear();
}
