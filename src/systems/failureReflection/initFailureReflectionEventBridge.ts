import { GameEvents, type GameEvent } from '../../services/events/GameEvents.js';
import {
  clearFailureReflections,
  recordFailureReflectionAttempt,
  resolveFailureReflectionOnDiagnosisChange,
  resolveFailureReflectionForTrial,
} from './failureReflectionStore.js';
import type { FailureReflectionRecord } from './types.js';

let initialized = false;
let handler: ((event: GameEvent) => void) | null = null;

function emitReflectionUpdated(record: FailureReflectionRecord): void {
  GameEvents.emit({
    type: 'failure_reflection/updated',
    payload: {
      timestamp: record.lastUpdatedAt,
      reflectionId: record.reflectionId,
      trialId: record.trialId,
      gateIndex: record.gateIndex,
      diagnosisCode: record.diagnosisCode,
      repeatedCount: record.repeatedCount,
      resolved: record.resolved,
      correctiveRouteTarget: record.correctiveRoute.target,
      correctiveRouteLabel: record.correctiveRoute.label,
    },
  });
}

type TrialAttemptResolvedPayload = Extract<GameEvent, { type: 'trials/attempt_resolved' }>['payload'];

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

function isTrialAttemptResolvedPayload(payload: unknown): payload is TrialAttemptResolvedPayload {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.timestamp === 'number'
    && typeof payload.trialId === 'string'
    && typeof payload.gateIndex === 'number'
    && typeof payload.attemptId === 'string'
    && (payload.outcome === 'cleared' || payload.outcome === 'defeated' || payload.outcome === 'bypassed')
    && typeof payload.durationSec === 'number'
    && typeof payload.countsTowardFailSafe === 'boolean'
  );
}

function isEligibleDefeat(payload: TrialAttemptResolvedPayload): boolean {
  return payload.outcome === 'defeated' && payload.countsTowardFailSafe === true;
}

function diagnosisCodeFor(payload: TrialAttemptResolvedPayload): string | null {
  const record = payload as unknown as Record<string, unknown>;
  const diagnosisCode = stringField(record, 'diagnosisCode');
  if (diagnosisCode) return diagnosisCode;
  const bossHpPctRemaining = numberField(record, 'bossHpPctRemaining');
  if (bossHpPctRemaining !== null && bossHpPctRemaining <= 0.25) return 'close';
  return null;
}

function handleTrialAttempt(payload: TrialAttemptResolvedPayload): void {
  if (payload.outcome === 'cleared') {
    const resolved = resolveFailureReflectionForTrial(
      payload.trialId,
      payload.gateIndex,
      'gate_cleared',
      payload.timestamp,
    );
    if (resolved) emitReflectionUpdated(resolved);
    return;
  }

  if (payload.outcome === 'bypassed') {
    const resolved = resolveFailureReflectionForTrial(
      payload.trialId,
      payload.gateIndex,
      'safety_net_bypassed',
      payload.timestamp,
    );
    if (resolved) emitReflectionUpdated(resolved);
    return;
  }

  if (!isEligibleDefeat(payload)) return;
  const diagnosisCode = diagnosisCodeFor(payload);
  if (!diagnosisCode) return;

  const resolvedForDiagnosisChange = resolveFailureReflectionOnDiagnosisChange({
    trialId: payload.trialId,
    gateIndex: payload.gateIndex,
    diagnosisCode,
    resolvedAt: payload.timestamp,
  });
  if (resolvedForDiagnosisChange) emitReflectionUpdated(resolvedForDiagnosisChange);

  const reflection = recordFailureReflectionAttempt({
    trialId: payload.trialId,
    gateIndex: payload.gateIndex,
    diagnosisCode,
    createdAt: payload.timestamp,
    topFixDestination: payload.topFixDestination,
    topFixReason: payload.topFixReason,
  });
  if (reflection) emitReflectionUpdated(reflection);
}

function handleGameEvent(event: GameEvent): void {
  if (event.type === 'prestige/performed' || event.type === 'progression/life_started') {
    clearFailureReflections();
    return;
  }
  if (event.type !== 'trials/attempt_resolved') return;
  if (!isTrialAttemptResolvedPayload(event.payload)) return;
  handleTrialAttempt(event.payload);
}

export function initFailureReflectionEventBridge(): void {
  if (initialized) return;
  initialized = true;
  handler = handleGameEvent;
  GameEvents.onAny(handleGameEvent);
}

export function resetFailureReflectionEventBridgeForTests(): void {
  if (handler) {
    GameEvents.offAny(handler);
  }
  handler = null;
  initialized = false;
}
