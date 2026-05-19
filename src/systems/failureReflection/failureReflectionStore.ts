import { create } from 'zustand';
import type {
  FailureReflectionAttemptInput,
  FailureReflectionRecord,
  FailureReflectionResolvedBy,
  FailureReflectionRouteTarget,
  InnerDemonPatternKind,
} from './types.js';

const DEFAULT_MAX_REFLECTIONS = 10;
const DEFAULT_REPEAT_THRESHOLD = 2;

interface FailureReflectionAttemptTrace {
  trialId: string;
  gateIndex: number;
  diagnosisCode: string;
  createdAt: number;
}

interface FailureReflectionState {
  reflections: FailureReflectionRecord[];
  recentAttempts: FailureReflectionAttemptTrace[];
  maxReflections: number;
  recordAttemptTrace: (attempt: FailureReflectionAttemptTrace) => number;
  upsertReflection: (record: FailureReflectionRecord) => FailureReflectionRecord;
  resolveForTrial: (
    trialId: string,
    gateIndex: number,
    resolvedBy: FailureReflectionResolvedBy,
    resolvedAt: number,
  ) => FailureReflectionRecord | null;
  getActiveReflectionForTrial: (trialId: string, gateIndex?: number) => FailureReflectionRecord | null;
  clearCurrentLife: () => void;
  hardResetFailureReflections: () => void;
}

function normalizeDiagnosisCode(code: string): string {
  return code.trim() || 'unknown';
}

function patternKindForDiagnosis(code: string): InnerDemonPatternKind {
  switch (normalizeDiagnosisCode(code)) {
    case 'undercultivated':
      return 'undercultivated_loop';
    case 'underbuilt':
      return 'underbuilt_loop';
    case 'underforged':
      return 'underforged_loop';
    case 'underprepared':
      return 'underprepared_loop';
    case 'close':
      return 'reckless_close_loop';
    case 'bypassAvailable':
      return 'safety_net_resistance';
    default:
      return 'unknown';
  }
}

function routeTargetFromDestination(destination: string | null | undefined): FailureReflectionRouteTarget {
  switch ((destination ?? '').trim()) {
    case 'cultivation':
      return 'cultivation';
    case 'techniques':
      return 'techniques';
    case 'manual_pavilion':
      return 'manual_pavilion';
    case 'forge':
      return 'forge';
    case 'apothecary':
    case 'medicine_pouch':
      return 'apothecary';
    case 'ruins':
      return 'ruins';
    case 'bounties':
      return 'bounties';
    case 'expeditions':
      return 'expeditions';
    case 'trial':
    case 'gate_trial':
      return 'gate_trial';
    default:
      return 'gate_trial';
  }
}

function routeLabel(target: FailureReflectionRouteTarget): string {
  switch (target) {
    case 'cultivation':
      return 'Return to Cultivation';
    case 'techniques':
      return 'Tune Techniques';
    case 'manual_pavilion':
      return 'Study Manuals';
    case 'forge':
      return 'Raise Forge Floor';
    case 'apothecary':
      return 'Apothecary Healing Prep';
    case 'ruins':
      return 'Run Ruins Support';
    case 'bounties':
      return 'Claim Bounty Support';
    case 'expeditions':
      return 'Send Expedition Support';
    case 'gate_trial':
      return 'Return to Gate Trial';
  }
}

function defaultRouteReason(code: string, target: FailureReflectionRouteTarget): string {
  if (code === 'close') return 'Your pressure is near enough; one cleaner exchange should decide the next attempt.';
  if (target === 'forge') return 'Raise the weapon or armor floor before feeding this pattern another attempt.';
  if (target === 'apothecary') return 'Stock the medicine posture before returning to the gate.';
  if (target === 'techniques') return 'Tune the active build so the gate is testing doctrine, not missing slots.';
  if (target === 'cultivation') return 'Settle breath and Heart Law progress before forcing the same threshold.';
  return 'Correct the named pattern before returning to the gate.';
}

function reflectionIdFor(trialId: string, gateIndex: number, diagnosisCode: string): string {
  return `inner_demon:${trialId}:${gateIndex}:${normalizeDiagnosisCode(diagnosisCode)}`;
}

function buildReflectionRecord(input: FailureReflectionAttemptInput, repeatedCount: number): FailureReflectionRecord {
  const diagnosisCode = normalizeDiagnosisCode(input.diagnosisCode);
  const target = routeTargetFromDestination(input.topFixDestination);
  return {
    reflectionId: reflectionIdFor(input.trialId, input.gateIndex, diagnosisCode),
    trialId: input.trialId,
    gateIndex: input.gateIndex,
    patternKind: patternKindForDiagnosis(diagnosisCode),
    diagnosisCode,
    repeatedCount,
    createdAt: input.createdAt,
    lastUpdatedAt: input.createdAt,
    resolved: false,
    correctiveRoute: {
      target,
      label: routeLabel(target),
      reason: input.topFixReason?.trim() || defaultRouteReason(diagnosisCode, target),
    },
    memoryEligible: repeatedCount >= DEFAULT_REPEAT_THRESHOLD,
  };
}

export const useFailureReflectionStore = create<FailureReflectionState>()((set, get) => ({
  reflections: [],
  recentAttempts: [],
  maxReflections: DEFAULT_MAX_REFLECTIONS,
  recordAttemptTrace: (attempt) => {
    const normalized = { ...attempt, diagnosisCode: normalizeDiagnosisCode(attempt.diagnosisCode) };
    set((state) => ({
      recentAttempts: [normalized, ...state.recentAttempts]
        .sort((left, right) => right.createdAt - left.createdAt)
        .slice(0, 40),
    }));
    return get().recentAttempts.filter((trace) => (
      trace.trialId === normalized.trialId
      && trace.gateIndex === normalized.gateIndex
      && trace.diagnosisCode === normalized.diagnosisCode
    )).length;
  },
  upsertReflection: (record) => {
    let stored = record;
    set((state) => {
      const existing = state.reflections.find((entry) => entry.reflectionId === record.reflectionId);
      stored = existing
        ? {
            ...existing,
            repeatedCount: Math.max(existing.repeatedCount, record.repeatedCount),
            lastUpdatedAt: record.lastUpdatedAt,
            resolved: false,
            resolvedAt: undefined,
            resolvedBy: undefined,
            correctiveRoute: record.correctiveRoute,
            memoryEligible: existing.memoryEligible || record.memoryEligible,
          }
        : record;
      const withoutExisting = state.reflections.filter((entry) => entry.reflectionId !== record.reflectionId);
      return {
        reflections: [stored, ...withoutExisting]
          .sort((left, right) => right.lastUpdatedAt - left.lastUpdatedAt)
          .slice(0, state.maxReflections),
      };
    });
    return stored;
  },
  resolveForTrial: (trialId, gateIndex, resolvedBy, resolvedAt) => {
    let resolved: FailureReflectionRecord | null = null;
    set((state) => ({
      reflections: state.reflections.map((entry) => {
        if (entry.trialId !== trialId || entry.gateIndex !== gateIndex || entry.resolved) return entry;
        resolved = {
          ...entry,
          resolved: true,
          resolvedAt,
          resolvedBy,
          lastUpdatedAt: resolvedAt,
        };
        return resolved;
      }),
    }));
    return resolved;
  },
  getActiveReflectionForTrial: (trialId, gateIndex) => (
    get().reflections.find((entry) => (
      entry.trialId === trialId
      && !entry.resolved
      && (typeof gateIndex !== 'number' || entry.gateIndex === gateIndex)
    )) ?? null
  ),
  clearCurrentLife: () => set({ reflections: [], recentAttempts: [] }),
  hardResetFailureReflections: () => set({ reflections: [], recentAttempts: [], maxReflections: DEFAULT_MAX_REFLECTIONS }),
}));

export function recordFailureReflectionAttempt(input: FailureReflectionAttemptInput): FailureReflectionRecord | null {
  const repeatedCount = input.repeatedCountOverride ?? useFailureReflectionStore.getState().recordAttemptTrace({
    trialId: input.trialId,
    gateIndex: input.gateIndex,
    diagnosisCode: input.diagnosisCode,
    createdAt: input.createdAt,
  });
  if (repeatedCount < DEFAULT_REPEAT_THRESHOLD) return null;
  const record = buildReflectionRecord(input, repeatedCount);
  return useFailureReflectionStore.getState().upsertReflection(record);
}

export function resolveFailureReflectionOnDiagnosisChange(input: {
  trialId: string;
  gateIndex: number;
  diagnosisCode: string;
  resolvedAt?: number;
}): FailureReflectionRecord | null {
  const active = useFailureReflectionStore.getState().getActiveReflectionForTrial(input.trialId, input.gateIndex);
  if (!active) return null;
  if (active.diagnosisCode === normalizeDiagnosisCode(input.diagnosisCode)) return null;
  return useFailureReflectionStore
    .getState()
    .resolveForTrial(input.trialId, input.gateIndex, 'diagnosis_changed', input.resolvedAt ?? Date.now());
}

export function resolveFailureReflectionForTrial(
  trialId: string,
  gateIndex: number,
  resolvedBy: FailureReflectionResolvedBy,
  resolvedAt = Date.now(),
): FailureReflectionRecord | null {
  return useFailureReflectionStore.getState().resolveForTrial(trialId, gateIndex, resolvedBy, resolvedAt);
}

export function clearFailureReflections(): void {
  useFailureReflectionStore.getState().clearCurrentLife();
}

export function hardResetFailureReflections(): void {
  useFailureReflectionStore.getState().hardResetFailureReflections();
}

export function captureResolvedFailureReflections(limit = 3): FailureReflectionRecord[] {
  return useFailureReflectionStore.getState().reflections
    .filter((entry) => entry.resolved && entry.memoryEligible)
    .slice(0, Math.max(0, Math.floor(limit)));
}
