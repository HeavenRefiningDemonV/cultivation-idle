import { isLiveWorldModule } from '../../world/liveWorldSchema.js';
import { buildLiveRunCompassSurfaceV2 } from '../runCompass/buildRunCompassSurfaceV2.js';
import type {
  RunCompassBlockerV2,
  RunCompassDeltaSummaryV2,
  RunCompassPrestigeHintV2,
  RunCompassRouteV2,
  RunCompassSafetyNetV2,
  RunCompassSurfaceV2,
} from '../runCompass/types.js';
import { buildDaoRequirementLedgerFromRunCompass, toneFromRunCompassInfoTone } from './daoMandateLedger.js';
import type {
  DaoBackgroundPlanSurface,
  DaoCurrentWorkSurface,
  DaoMandateConfidence,
  DaoMandateGuidanceProfile,
  DaoMandateObstruction,
  DaoMandateRoute,
  DaoMandateRouteSource,
  DaoMandateRouteTarget,
  DaoMandateSurfaceV1,
  DaoMandateTone,
  DaoReadinessLedger,
  DaoRecentOmen,
  DaoReincarnationCounselSurface,
  DaoSafetyNetSurface,
  DaoSourceMapEntry,
  DaoSourceOption,
} from './daoMandateTypes.js';

export interface BuildDaoMandateSurfaceOptions {
  guidanceProfile?: DaoMandateGuidanceProfile;
  currentScreen?: string;
  now?: number;
}

type DebugNotes = string[];

function resolveGuidanceProfile(profile?: DaoMandateGuidanceProfile): DaoMandateGuidanceProfile {
  return profile ?? 'elder';
}

export function toneFromSeverity(severity: RunCompassBlockerV2['severity']): DaoMandateTone {
  if (severity === 'success') return 'success';
  if (severity === 'warning') return 'warning';
  if (severity === 'danger') return 'danger';
  if (severity === 'none') return 'muted';
  return 'info';
}

export function toneFromRunDelta(tone: RunCompassDeltaSummaryV2['tone']): DaoMandateTone {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  if (tone === 'muted') return 'muted';
  return 'info';
}

export function routeSourceFromRunCompass(source: RunCompassRouteV2['source']): DaoMandateRouteSource {
  if (source === 'prestige') return 'prestige';
  if (source === 'run_delta') return 'run_delta';
  if (source === 'fallback') return 'fallback';
  return source;
}

export function blockerSourceFromRunCompass(source: RunCompassBlockerV2['source']): DaoMandateRouteSource {
  if (source === 'content_cap') return 'content_cap';
  if (source === 'run_delta') return 'run_delta';
  if (source === 'fallback') return 'fallback';
  return source;
}

function cloneTarget(target: RunCompassRouteV2['target'] | RunCompassSafetyNetV2['target'] | RunCompassPrestigeHintV2['target']): DaoMandateRouteTarget | null {
  if (!target) return null;
  if (target.kind === 'tab') return { kind: 'tab', tab: target.tab };
  return { kind: 'world_module', cityId: target.cityId, moduleKey: target.moduleKey };
}

function targetIsVisibleModule(target: DaoMandateRouteTarget, surface: RunCompassSurfaceV2): boolean {
  if (target.kind !== 'world_module') return true;
  if (!isLiveWorldModule(target.moduleKey)) return false;
  if (!surface.currentCity || surface.currentCity.cityId !== target.cityId) return true;
  return surface.currentCity.visibleModuleKeys.includes(target.moduleKey);
}

function validateDaoRouteTarget(args: {
  routeId: string;
  destinationLabel: string;
  target: DaoMandateRouteTarget | null;
  blocked: boolean;
  blockedReason: string | null;
  surface: RunCompassSurfaceV2 | null;
  debugNotes: DebugNotes;
}): { blocked: boolean; blockedReason: string | null } {
  if (args.blocked) {
    return {
      blocked: true,
      blockedReason: args.blockedReason ?? 'Route is blocked.',
    };
  }

  if (!args.target) {
    args.debugNotes.push(`Dao Mandate blocked route ${args.routeId}: enabled route had no target.`);
    return {
      blocked: true,
      blockedReason: 'Route target is unavailable.',
    };
  }

  if (args.surface && !targetIsVisibleModule(args.target, args.surface)) {
    args.debugNotes.push(`Dao Mandate blocked route ${args.routeId}: target module is not visible in current city.`);
    return {
      blocked: true,
      blockedReason: `The ${args.destinationLabel} route is not available in the current live city.`,
    };
  }

  return {
    blocked: false,
    blockedReason: null,
  };
}

export function toDaoRoute(
  route: RunCompassRouteV2,
  surface: RunCompassSurfaceV2,
  debugNotes: DebugNotes,
): DaoMandateRoute {
  const target = cloneTarget(route.target);
  const validation = validateDaoRouteTarget({
    routeId: route.id,
    destinationLabel: route.destinationLabel,
    target,
    blocked: route.blocked,
    blockedReason: route.blockedReason,
    surface,
    debugNotes,
  });

  return {
    id: route.id,
    label: route.label,
    actionLabel: route.actionLabel,
    detail: route.detail,
    destinationLabel: route.destinationLabel,
    target,
    blocked: validation.blocked,
    blockedReason: validation.blockedReason,
    expectedDeltaLabel: route.expectedDeltaLabel,
    source: routeSourceFromRunCompass(route.source),
    priority: route.priority,
  };
}

function routeFromTarget(args: {
  id: string;
  label: string;
  actionLabel: string;
  detail: string;
  destinationLabel: string;
  target: DaoMandateRouteTarget | null;
  source: DaoMandateRouteSource;
  priority: number;
  expectedDeltaLabel?: string | null;
  surface?: RunCompassSurfaceV2 | null;
  debugNotes?: DebugNotes;
}): DaoMandateRoute {
  const validation = validateDaoRouteTarget({
    routeId: args.id,
    destinationLabel: args.destinationLabel,
    target: args.target,
    blocked: !args.target,
    blockedReason: args.target ? null : 'Route target is unavailable.',
    surface: args.surface ?? null,
    debugNotes: args.debugNotes ?? [],
  });

  return {
    id: args.id,
    label: args.label,
    actionLabel: args.actionLabel,
    detail: args.detail,
    destinationLabel: args.destinationLabel,
    target: args.target,
    blocked: validation.blocked,
    blockedReason: validation.blockedReason,
    expectedDeltaLabel: args.expectedDeltaLabel ?? null,
    source: args.source,
    priority: args.priority,
  };
}

function toDaoObstruction(blocker: RunCompassBlockerV2): DaoMandateObstruction {
  return {
    kind: blocker.kind,
    label: blocker.label,
    detail: blocker.detail,
    severity: blocker.severity,
    source: blockerSourceFromRunCompass(blocker.source),
    confidence: blocker.confidence,
    evidenceIds: [`runCompass.primaryBlocker.${blocker.kind}`],
  };
}

function toDaoMilestone(surface: RunCompassSurfaceV2): DaoMandateSurfaceV1['milestone'] {
  return {
    id: surface.milestone.id,
    label: surface.milestone.label,
    detail: surface.milestone.detail,
    state: surface.milestone.state,
    currentRealmLabel: surface.milestone.currentRealmLabel,
    nextRealmLabel: surface.milestone.nextRealmLabel,
    currentCityId: surface.currentCity?.cityId ?? null,
    currentCityName: surface.currentCity?.cityName ?? null,
    chapterLine: surface.milestone.chapterLine ?? surface.milestone.contextLine ?? null,
  };
}

function confidenceFromRunCompass(surface: RunCompassSurfaceV2): DaoMandateConfidence {
  if (surface.mode === 'fallback') return 'low';
  return surface.primaryBlocker.confidence;
}

function buildReadinessLedger(
  surface: RunCompassSurfaceV2,
  primaryRoute: DaoMandateRoute,
): DaoReadinessLedger {
  return {
    score: surface.readiness.score,
    label: surface.readiness.label,
    band: surface.readiness.band,
    diagnosisLabel: surface.readiness.diagnosisLabel,
    primaryShortfallLabel: surface.readiness.primaryShortfallLabel,
    rows: surface.readiness.rows.map((row) => {
      const tone = toneFromRunCompassInfoTone(row.tone);
      return {
        id: row.id,
        label: row.label,
        detail: row.detail,
        currentLabel: null,
        targetLabel: null,
        tone,
        source: tone === 'warning' || tone === 'danger' ? primaryRoute.source === 'build' ? 'build' : 'readiness' : 'readiness',
        route: tone === 'warning' || tone === 'danger' ? primaryRoute : null,
      };
    }),
    confidence: confidenceFromRunCompass(surface),
  };
}

function toSafetyNetSurface(
  safetyNet: RunCompassSafetyNetV2 | null,
  surface: RunCompassSurfaceV2,
  debugNotes: DebugNotes,
): DaoSafetyNetSurface | null {
  if (!safetyNet) return null;
  const target = cloneTarget(safetyNet.target);
  const route = routeFromTarget({
    id: `safety-net-${safetyNet.state}`,
    label: safetyNet.label,
    actionLabel: 'Open Gate Trial',
    detail: safetyNet.detail,
    destinationLabel: 'Gate Trial',
    target,
    source: 'trial_lifecycle',
    priority: 35,
    expectedDeltaLabel: 'Gate support state can be reviewed.',
    surface,
    debugNotes,
  });

  return {
    state: safetyNet.state,
    label: safetyNet.label,
    detail: safetyNet.detail,
    progressLine: safetyNet.progressLine,
    costLine: null,
    reserveLine: null,
    route,
  };
}

function toPrestigeSurface(prestigeHint: RunCompassPrestigeHintV2 | null): DaoReincarnationCounselSurface | null {
  if (!prestigeHint) return null;
  const target = cloneTarget(prestigeHint.target);
  const state: DaoReincarnationCounselSurface['state'] =
    prestigeHint.state === 'available'
      ? 'viable'
      : prestigeHint.state;

  return {
    state,
    label: prestigeHint.label,
    detail: prestigeHint.detail,
    route: routeFromTarget({
      id: `prestige-${state}`,
      label: prestigeHint.label,
      actionLabel: 'Open Reincarnation',
      detail: prestigeHint.detail,
      destinationLabel: 'Prestige',
      target,
      source: 'prestige',
      priority: 5,
      expectedDeltaLabel: 'Reincarnation counsel can be reviewed.',
    }),
    forecastLine: prestigeHint.detail,
  };
}

function toRecentOmen(delta: RunCompassDeltaSummaryV2): DaoRecentOmen {
  const readinessDeltaLabel = delta.readinessDelta?.deltaLabel
    ?? (delta.readinessDelta?.beforeLabel || delta.readinessDelta?.afterLabel
      ? `${delta.readinessDelta.beforeLabel ?? 'Previous'} -> ${delta.readinessDelta.afterLabel ?? 'Current'}`
      : null);
  return {
    id: delta.id,
    source: delta.source,
    timestamp: delta.timestamp,
    tone: toneFromRunDelta(delta.tone),
    label: delta.label,
    detail: delta.detail,
    memoryLine: delta.memoryLine,
    rewardSummary: delta.rewardSummary ?? null,
    readinessDeltaLabel,
  };
}

function sourceOptionFromRoute(route: DaoMandateRoute, activityMode: DaoSourceOption['activityMode']): DaoSourceOption {
  return {
    id: `source-${route.id}`,
    label: route.label,
    detail: route.detail,
    route,
    lockedReason: route.blocked ? route.blockedReason ?? 'Route is blocked.' : null,
    activityMode,
    confidence: route.blocked ? 'medium' : 'high',
  };
}

function buildSourceMap(
  surface: RunCompassSurfaceV2,
  primaryRoute: DaoMandateRoute,
  secondaryRoutes: DaoMandateRoute[],
): DaoSourceMapEntry[] {
  const routeCanExplainSource =
    primaryRoute.source === 'economy' ||
    primaryRoute.source === 'readiness' ||
    primaryRoute.source === 'build';
  if (!routeCanExplainSource) return [];

  const fallbackSources = secondaryRoutes
    .filter((route) => route.source === 'economy' || route.source === 'readiness' || route.source === 'build')
    .slice(0, 3)
    .map((route) => sourceOptionFromRoute(route, 'background'));

  return [{
    id: `source-map-${primaryRoute.id}`,
    neededThingLabel: surface.readiness.primaryShortfallLabel ?? surface.primaryBlocker.label,
    neededThingId: null,
    problemKind: surface.primaryBlocker.kind,
    sinkLabel: surface.currentGate?.gateLabel ?? surface.milestone.label,
    expectedImpactLabel: primaryRoute.expectedDeltaLabel,
    bestSources: [sourceOptionFromRoute(primaryRoute, primaryRoute.target?.kind === 'world_module' ? 'active' : 'passive')],
    fallbackSources,
    route: primaryRoute,
  }];
}

function buildCurrentWork(primaryRoute: DaoMandateRoute): DaoCurrentWorkSurface {
  return {
    foreground: {
      label: 'Quiet support',
      detail: 'No foreground support needs attention right now.',
      tone: 'muted',
      route: primaryRoute.blocked ? null : primaryRoute,
    },
    activeCombat: null,
    trackedBounty: null,
    expeditions: null,
    queues: [],
  };
}

function buildBackgroundPlan(secondaryRoutes: DaoMandateRoute[]): DaoBackgroundPlanSurface {
  const backgroundRoutes = secondaryRoutes
    .filter((route) => !route.blocked && (route.source === 'economy' || route.source === 'readiness' || route.source === 'build'))
    .slice(0, 2);
  return {
    idleSlotCount: null,
    adviceLabel: backgroundRoutes.length > 0
      ? 'Background support is available'
      : 'Quiet support',
    adviceDetail: backgroundRoutes.length > 0
      ? 'Secondary routes can support the primary Mandate without replacing it.'
      : 'No background support route is needed right now.',
    routes: backgroundRoutes,
    offlineProjectionLabel: null,
  };
}

function createFallbackDaoMandateSurface(args: {
  now: number;
  guidanceProfile: DaoMandateGuidanceProfile;
  currentScreen?: string;
  debugNote: string;
}): DaoMandateSurfaceV1 {
  const fallbackRoute: DaoMandateRoute = {
    id: 'dao-mandate-fallback-status',
    label: 'Review Status',
    actionLabel: 'Open Status',
    detail: 'The guidance resolver could not read the current run cleanly. Review Status while the source truth recovers.',
    destinationLabel: 'Status',
    target: { kind: 'tab', tab: 'status' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: 'Status can still show current run diagnostics.',
    source: 'fallback',
    priority: 999,
  };

  return {
    meta: {
      version: 1,
      generatedAt: args.now,
      mode: 'fallback',
      guidanceProfile: args.guidanceProfile,
      ...(args.currentScreen ? { currentScreen: args.currentScreen } : {}),
      confidence: 'low',
      sourceIds: ['fallback'],
      debugNotes: [args.debugNote],
    },
    milestone: {
      id: 'fallback:continue-cultivation',
      label: 'Continue cultivation',
      detail: 'Dao Mandate could not read Run Compass truth for this moment.',
      state: 'fallback',
      currentRealmLabel: 'Unknown realm',
      nextRealmLabel: null,
      currentCityId: null,
      currentCityName: null,
      chapterLine: null,
    },
    obstruction: {
      kind: 'unknown',
      label: 'Guidance source unavailable',
      detail: 'Run Compass V2 did not return a readable surface.',
      severity: 'warning',
      source: 'fallback',
      confidence: 'low',
      evidenceIds: ['runCompass.unavailable'],
    },
    primaryRoute: fallbackRoute,
    secondaryRoutes: [],
    requirementLedger: {
      hardGates: [{
        id: 'fallback-guidance-unavailable',
        bucket: 'hard_gate',
        label: 'Guidance source unavailable',
        detail: 'Run Compass V2 did not return a readable surface.',
        currentLabel: null,
        targetLabel: null,
        state: 'unknown',
        tone: 'warning',
        route: fallbackRoute,
        source: 'fallback',
        proofLine: 'Source: Dao Mandate fallback',
        sourceLine: args.debugNote,
        priority: 999,
      }],
      readinessFloors: [],
      supportReserves: [],
      sourceRoutes: [],
      optionalOptimizations: [],
      recentOmens: [],
    },
    readiness: {
      score: null,
      label: 'Unavailable',
      band: null,
      diagnosisLabel: null,
      primaryShortfallLabel: null,
      rows: [],
      confidence: 'low',
    },
    sourceMap: [],
    currentWork: {
      foreground: {
        label: 'Current work unavailable',
        detail: 'Dao Mandate did not read active work while in fallback mode.',
        tone: 'muted',
        route: null,
      },
      activeCombat: null,
      trackedBounty: null,
      expeditions: null,
      queues: [],
    },
    backgroundPlan: {
      idleSlotCount: null,
      adviceLabel: 'Background support unavailable',
      adviceDetail: 'Fallback mode avoids guessing at source routes.',
      routes: [],
      offlineProjectionLabel: null,
    },
    safetyNet: null,
    prestige: null,
    recentOmens: [],
    lessonSlips: [],
    localLens: null,
  };
}

export function buildDaoMandateSurfaceFromRunCompassV2(
  runCompass: RunCompassSurfaceV2 | null,
  options: BuildDaoMandateSurfaceOptions = {},
): DaoMandateSurfaceV1 {
  const guidanceProfile = resolveGuidanceProfile(options.guidanceProfile);
  if (!runCompass) {
    return createFallbackDaoMandateSurface({
      now: options.now ?? Date.now(),
      guidanceProfile,
      currentScreen: options.currentScreen,
      debugNote: 'Run Compass V2 returned no surface while building Dao Mandate.',
    });
  }

  const debugNotes = [...runCompass.debugNotes, 'Dao Mandate adapted from Run Compass V2.'];
  const primaryRoute = toDaoRoute(runCompass.primaryRoute, runCompass, debugNotes);
  const secondaryRoutes = runCompass.secondaryRoutes
    .map((route) => toDaoRoute(route, runCompass, debugNotes))
    .sort((left, right) => left.priority - right.priority);
  const obstruction = toDaoObstruction(runCompass.primaryBlocker);
  const readiness = buildReadinessLedger(runCompass, primaryRoute);
  const recentOmens = runCompass.recentDeltas.map(toRecentOmen);
  const sourceMap = buildSourceMap(runCompass, primaryRoute, secondaryRoutes);
  const safetyNet = toSafetyNetSurface(runCompass.safetyNet, runCompass, debugNotes);
  const prestige = toPrestigeSurface(runCompass.prestigeHint);
  const requirementLedger = buildDaoRequirementLedgerFromRunCompass(runCompass, {
    obstruction,
    primaryRoute,
    secondaryRoutes,
    recentOmens,
    sourceMap,
    safetyNetRoute: safetyNet?.route ?? null,
  });

  return {
    meta: {
      version: 1,
      generatedAt: runCompass.generatedAt,
      mode: runCompass.mode,
      guidanceProfile,
      ...(options.currentScreen ? { currentScreen: options.currentScreen } : {}),
      confidence: confidenceFromRunCompass(runCompass),
      sourceIds: ['run_compass_v2'],
      debugNotes,
    },
    milestone: toDaoMilestone(runCompass),
    obstruction,
    primaryRoute,
    secondaryRoutes,
    requirementLedger,
    readiness,
    sourceMap,
    currentWork: buildCurrentWork(primaryRoute),
    backgroundPlan: buildBackgroundPlan(secondaryRoutes),
    safetyNet,
    prestige,
    recentOmens,
    lessonSlips: [],
    localLens: null,
  };
}

export function buildLiveDaoMandateSurfaceV1(options: BuildDaoMandateSurfaceOptions = {}): DaoMandateSurfaceV1 {
  const guidanceProfile = resolveGuidanceProfile(options.guidanceProfile);
  try {
    const runCompass = buildLiveRunCompassSurfaceV2();
    return buildDaoMandateSurfaceFromRunCompassV2(runCompass, { ...options, guidanceProfile });
  } catch (error) {
    return createFallbackDaoMandateSurface({
      now: options.now ?? Date.now(),
      guidanceProfile,
      currentScreen: options.currentScreen,
      debugNote: `Run Compass V2 failed while building Dao Mandate: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
