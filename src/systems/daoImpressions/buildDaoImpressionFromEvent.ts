import type { GameEvent } from '../../services/events/GameEvents.js';
import type { DaoImpressionCandidate } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberField(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function eventTimestamp(payload: unknown): number {
  if (!isRecord(payload)) return Date.now();
  return numberField(payload, 'timestamp') ?? numberField(payload, 'claimedAt') ?? numberField(payload, 'at') ?? Date.now();
}

function normalizedPct(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value > 1 ? Math.max(0, Math.min(1, value / 100)) : Math.max(0, Math.min(1, value));
}

export function buildDaoImpressionCandidateFromEvent(event: GameEvent): DaoImpressionCandidate | null {
  if (event.type === 'combat/resolved') {
    const payload = event.payload;
    if (!isRecord(payload) || payload.outcome !== 'victory') return null;
    if (payload.source === 'outskirts' && payload.isBoss === true) {
      const cityId = stringField(payload, 'cityId') ?? 'unknown_city';
      const sourceId = stringField(payload, 'sourceId') ?? 'unknown_outskirts';
      return {
        impressionId: 'first_boss_pattern',
        sourceKind: 'outskirts_first_boss',
        sourceEventKey: `outskirts_first_boss:${cityId}:${sourceId}`,
        createdAt: eventTimestamp(payload),
      };
    }

    if (payload.source === 'ruins') {
      const roomIndex = numberField(payload, 'roomIndex');
      const roomCount = numberField(payload, 'roomCount');
      const completion = roomIndex !== null && roomCount !== null ? roomIndex + 1 >= roomCount : payload.isBoss === true;
      if (!completion) return null;
      const cityId = stringField(payload, 'cityId') ?? 'unknown_city';
      const ruinId = stringField(payload, 'ruinId') ?? stringField(payload, 'sourceId') ?? 'unknown_ruin';
      const runId = stringField(payload, 'runId') ?? String(eventTimestamp(payload));
      return {
        impressionId: 'ruin_echo',
        sourceKind: 'ruins_completion',
        sourceEventKey: `ruins_completion:${cityId}:${ruinId}:${runId}`,
        createdAt: eventTimestamp(payload),
      };
    }
  }

  if (event.type === 'trials/attempt_resolved') {
    const payload = event.payload;
    if (!isRecord(payload)) return null;
    const trialId = stringField(payload, 'trialId');
    const gateIndex = numberField(payload, 'gateIndex');
    const attemptId = stringField(payload, 'attemptId');
    const timestamp = numberField(payload, 'timestamp');
    if (!trialId || gateIndex === null || !attemptId || timestamp === null) return null;

    const sourceGateKey = `${trialId}:${gateIndex}`;
    if (payload.outcome === 'cleared') {
      return {
        impressionId: 'threshold_revelation',
        sourceKind: 'gate_clear',
        sourceEventKey: `gate_clear:${sourceGateKey}`,
        createdAt: timestamp,
        routeHint: { kind: 'cultivation', label: 'Return to Cultivation' },
      };
    }

    const bossHpRemaining = normalizedPct(numberField(payload, 'bossHpPctRemaining'));
    const closeByDiagnosis = payload.diagnosisCode === 'close';
    const closeByHp = bossHpRemaining !== null && bossHpRemaining <= 0.25;
    if (payload.outcome === 'defeated' && payload.countsTowardFailSafe === true && (closeByDiagnosis || closeByHp)) {
      const diagnosisBucket = stringField(payload, 'diagnosisCode') ?? 'close';
      return {
        impressionId: 'gate_guardian_pattern',
        sourceKind: 'gate_close_defeat',
        sourceEventKey: `gate_close_defeat:${sourceGateKey}:${diagnosisBucket}:${attemptId}`,
        createdAt: timestamp,
        routeHint: { kind: 'gate_trial', label: 'Review Gate Trial' },
      };
    }
  }

  if (event.type === 'progression/breakthrough_completed') {
    const payload = event.payload;
    if (!isRecord(payload) || payload.major !== true) return null;
    const fromRealmIndex = numberField(payload, 'fromRealmIndex');
    const toRealmIndex = numberField(payload, 'toRealmIndex');
    if (fromRealmIndex === null || toRealmIndex === null) return null;
    return {
      impressionId: 'breakthrough_resonance',
      sourceKind: 'breakthrough_resonance',
      sourceEventKey: `breakthrough:${fromRealmIndex}->${toRealmIndex}`,
      createdAt: eventTimestamp(payload),
      routeHint: { kind: 'cultivation', label: 'Review Cultivation' },
    };
  }

  return null;
}
