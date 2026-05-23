import type { DaoMandateGuidanceSettings } from './daoMandateGuidanceSettings.js';
import type {
  DaoJadeSlip,
  DaoMandateRoute,
  DaoMandateSurfaceV1,
  DaoRequirementRow,
} from './daoMandateTypes.js';

export type DaoMandateLessonConceptId =
  | 'mandate.primary_route'
  | 'mandate.requirement_ledger'
  | 'mandate.source_route'
  | 'gate.failure_diagnosis'
  | 'gate.safety_net'
  | 'offline.mandate_after_return'
  | 'prestige.too_early'
  | 'prestige.viable'
  | 'prestige.recommended'
  | 'prestige.cap_recommended'
  | 'life_summary.memory'
  | 'content_cap.endpoint';

export interface DaoMandateLessonMemoryEntry {
  seenCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
  dismissedAt?: number;
  learnedAt?: number;
  lastTriggerHash?: string;
}

export interface DaoMandateLessonMemory {
  byConceptId: Partial<Record<DaoMandateLessonConceptId, DaoMandateLessonMemoryEntry>>;
}

interface LessonCandidate {
  conceptId: DaoMandateLessonConceptId;
  title: string;
  detail: string;
  trigger: string;
  triggerHash: string;
  relatedRowId: string | null;
  route: DaoMandateRoute | null;
  priority: number;
}

export interface BuildDaoMandateLessonsArgs {
  surface: DaoMandateSurfaceV1;
  settings: Pick<DaoMandateGuidanceSettings, 'guidanceOath' | 'jadeSlipLessons'>;
  memory?: DaoMandateLessonMemory | null;
}

const DAO_MANDATE_LESSON_CONCEPT_IDS = [
  'mandate.primary_route',
  'mandate.requirement_ledger',
  'mandate.source_route',
  'gate.failure_diagnosis',
  'gate.safety_net',
  'offline.mandate_after_return',
  'prestige.too_early',
  'prestige.viable',
  'prestige.recommended',
  'prestige.cap_recommended',
  'life_summary.memory',
  'content_cap.endpoint',
] as const satisfies readonly DaoMandateLessonConceptId[];

const DAO_MANDATE_LESSON_CONCEPT_SET = new Set<string>(DAO_MANDATE_LESSON_CONCEPT_IDS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeMemoryEntry(value: unknown): DaoMandateLessonMemoryEntry | null {
  if (!isRecord(value)) return null;
  const seenCount = Math.max(0, Math.floor(finiteNumber(value.seenCount, 0)));
  const firstSeenAt = Math.max(0, finiteNumber(value.firstSeenAt, 0));
  const lastSeenAt = Math.max(firstSeenAt, finiteNumber(value.lastSeenAt, firstSeenAt));
  const dismissedAt = 'dismissedAt' in value ? finiteNumber(value.dismissedAt, Number.NaN) : Number.NaN;
  const learnedAt = 'learnedAt' in value ? finiteNumber(value.learnedAt, Number.NaN) : Number.NaN;
  const lastTriggerHash = typeof value.lastTriggerHash === 'string' && value.lastTriggerHash.trim()
    ? value.lastTriggerHash.trim().slice(0, 160)
    : undefined;

  return {
    seenCount,
    firstSeenAt,
    lastSeenAt,
    ...(Number.isFinite(dismissedAt) ? { dismissedAt: Math.max(0, dismissedAt) } : {}),
    ...(Number.isFinite(learnedAt) ? { learnedAt: Math.max(0, learnedAt) } : {}),
    ...(lastTriggerHash ? { lastTriggerHash } : {}),
  };
}

export function isDaoMandateLessonConceptId(value: unknown): value is DaoMandateLessonConceptId {
  return typeof value === 'string' && DAO_MANDATE_LESSON_CONCEPT_SET.has(value);
}

export function createDefaultDaoMandateLessonMemory(): DaoMandateLessonMemory {
  return { byConceptId: {} };
}

export function sanitizeDaoMandateLessonMemory(input: unknown): DaoMandateLessonMemory {
  if (!isRecord(input) || !isRecord(input.byConceptId)) return createDefaultDaoMandateLessonMemory();

  const byConceptId: DaoMandateLessonMemory['byConceptId'] = {};
  for (const [conceptId, value] of Object.entries(input.byConceptId).slice(0, 32)) {
    if (!isDaoMandateLessonConceptId(conceptId)) continue;
    const entry = sanitizeMemoryEntry(value);
    if (entry) byConceptId[conceptId] = entry;
  }

  return { byConceptId };
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function allRows(surface: DaoMandateSurfaceV1): DaoRequirementRow[] {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ];
}

function rowForRoute(surface: DaoMandateSurfaceV1, route: DaoMandateRoute | null): DaoRequirementRow | null {
  if (!route) return null;
  return allRows(surface).find((row) => row.route?.id === route.id) ?? null;
}

function primaryRouteLesson(surface: DaoMandateSurfaceV1): LessonCandidate {
  const row = rowForRoute(surface, surface.primaryRoute);
  return {
    conceptId: 'mandate.primary_route',
    title: 'Read the primary route first',
    detail: `The Mandate names one best route before support details. ${surface.primaryRoute.destinationLabel} is the current focus because ${surface.obstruction.label.toLowerCase()}.`,
    trigger: surface.obstruction.kind,
    triggerHash: `primary:${surface.obstruction.kind}:${surface.primaryRoute.id}`,
    relatedRowId: row?.id ?? null,
    route: surface.primaryRoute,
    priority: 10,
  };
}

function sourceRouteLesson(surface: DaoMandateSurfaceV1): LessonCandidate | null {
  const entry = surface.sourceMap[0];
  if (!entry) return null;
  return {
    conceptId: 'mandate.source_route',
    title: 'Source routes explain why this support matters',
    detail: `${entry.neededThingLabel} feeds ${entry.sinkLabel}. Use the best source first, then fall back only when the source is unavailable.`,
    trigger: entry.id,
    triggerHash: `source:${entry.id}:${entry.bestSources[0]?.id ?? 'none'}`,
    relatedRowId: `source-route-${entry.id}`,
    route: entry.route ?? entry.bestSources[0]?.route ?? null,
    priority: 20,
  };
}

function failureLesson(surface: DaoMandateSurfaceV1): LessonCandidate | null {
  const failureOmen = surface.recentOmens.find((omen) => omen.source === 'failure_reflection');
  if (surface.obstruction.kind !== 'gate_recent_failure' && !failureOmen) return null;
  return {
    conceptId: 'gate.failure_diagnosis',
    title: 'A gate loss names one correction',
    detail: 'Treat the reflection as a single corrective route, not a judgment. Fix the named floor before another attempt.',
    trigger: failureOmen?.id ?? surface.obstruction.kind,
    triggerHash: `failure:${failureOmen?.id ?? surface.primaryRoute.id}`,
    relatedRowId: rowForRoute(surface, surface.primaryRoute)?.id ?? null,
    route: surface.primaryRoute,
    priority: 5,
  };
}

function safetyNetLesson(surface: DaoMandateSurfaceV1): LessonCandidate | null {
  if (!surface.safetyNet || surface.safetyNet.state !== 'available') return null;
  return {
    conceptId: 'gate.safety_net',
    title: 'Safety Net is earned support',
    detail: 'When the reserve is available, it can secure proof through the existing gate support path without changing combat truth.',
    trigger: surface.safetyNet.state,
    triggerHash: `safety:${surface.safetyNet.state}:${surface.safetyNet.progressLine}`,
    relatedRowId: `safety-net-${surface.safetyNet.state}`,
    route: surface.safetyNet.route,
    priority: 8,
  };
}

function prestigeLesson(surface: DaoMandateSurfaceV1): LessonCandidate | null {
  const prestige = surface.prestige;
  if (!prestige || prestige.state === 'hidden') return null;
  const conceptId: DaoMandateLessonConceptId =
    prestige.state === 'too_early' ? 'prestige.too_early'
      : prestige.state === 'viable' ? 'prestige.viable'
      : prestige.state === 'cap_recommended' ? 'prestige.cap_recommended'
      : 'prestige.recommended';
  return {
    conceptId,
    title: 'Reincarnation counsel reads the ledger',
    detail: prestige.detail,
    trigger: prestige.state,
    triggerHash: `prestige:${prestige.state}:${prestige.forecastLine ?? 'no-forecast'}`,
    relatedRowId: null,
    route: prestige.route,
    priority: prestige.state === 'cap_recommended' || prestige.state === 'recommended' ? 6 : 30,
  };
}

function offlineLesson(surface: DaoMandateSurfaceV1): LessonCandidate | null {
  const label = surface.backgroundPlan.offlineProjectionLabel;
  if (!label) return null;
  return {
    conceptId: 'offline.mandate_after_return',
    title: 'Offline settlement can change counsel',
    detail: label,
    trigger: 'offline_return',
    triggerHash: `offline:${label}`,
    relatedRowId: null,
    route: surface.primaryRoute,
    priority: 25,
  };
}

function buildCandidates(surface: DaoMandateSurfaceV1): LessonCandidate[] {
  return [
    failureLesson(surface),
    safetyNetLesson(surface),
    primaryRouteLesson(surface),
    sourceRouteLesson(surface),
    offlineLesson(surface),
    prestigeLesson(surface),
  ].filter((candidate): candidate is LessonCandidate => Boolean(candidate))
    .sort((left, right) => left.priority - right.priority || left.conceptId.localeCompare(right.conceptId));
}

function cadenceAllows(candidate: LessonCandidate, args: BuildDaoMandateLessonsArgs): boolean {
  if (args.settings.jadeSlipLessons === 'off') return false;
  const memory = args.memory?.byConceptId[candidate.conceptId];
  if (memory?.learnedAt) return false;
  if (args.settings.jadeSlipLessons === 'first_time') {
    return !(memory?.dismissedAt && memory.lastTriggerHash === candidate.triggerHash);
  }
  if (args.settings.jadeSlipLessons === 'repeat_until_learned') {
    return !(memory?.dismissedAt && memory.lastTriggerHash === candidate.triggerHash);
  }
  return true;
}

function slipFromCandidate(candidate: LessonCandidate): DaoJadeSlip {
  return {
    id: `jade-slip:${candidate.conceptId}:${safeId(candidate.triggerHash)}`,
    conceptId: candidate.conceptId,
    title: candidate.title,
    detail: candidate.detail,
    trigger: candidate.trigger,
    triggerHash: candidate.triggerHash,
    relatedRowId: candidate.relatedRowId,
    route: candidate.route,
    profile: 'all',
  };
}

export function buildDaoMandateLessons(args: BuildDaoMandateLessonsArgs): DaoJadeSlip[] {
  if (args.settings.jadeSlipLessons === 'off') return [];
  const cap = args.settings.jadeSlipLessons === 'repeat_until_learned' ? 3 : 1;
  const candidates = buildCandidates(args.surface);
  if (args.settings.jadeSlipLessons === 'first_time') {
    const first = candidates[0];
    return first && cadenceAllows(first, args) ? [slipFromCandidate(first)] : [];
  }
  return candidates
    .filter((candidate) => cadenceAllows(candidate, args))
    .slice(0, cap)
    .map(slipFromCandidate);
}
