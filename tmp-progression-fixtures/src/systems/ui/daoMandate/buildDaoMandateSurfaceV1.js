import { isLiveWorldModule } from '../../world/liveWorldSchema.js';
import { captureDaoImpressionAwards } from '../../daoImpressions/index.js';
import { useFailureReflectionStore } from '../../failureReflection/index.js';
import { buildPrestigeForecastSurfaceV2 } from '../../../features/prestige/prestigeForecastSurface.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../runCompass/buildRunCompassSurfaceV2.js';
import { buildDaoRequirementLedgerFromRunCompass, toneFromRunCompassInfoTone } from './daoMandateLedger.js';
import { buildDaoMandateSourceMap } from './daoMandateSourceMap.js';
import { createDefaultDaoMandateGuidanceSettings, sanitizeDaoMandateGuidanceSettings, } from './daoMandateGuidanceSettings.js';
import { buildDaoMandateRecentOmens } from './daoMandateRecentOmens.js';
import { buildDaoMandateFailureCoaching } from './daoMandateFailureCoaching.js';
import { buildDaoMandateLessons } from './daoMandateLessons.js';
import { buildDaoReincarnationCounsel } from './daoMandateReincarnationCounsel.js';
function resolveGuidanceProfile(profile) {
    return profile ?? 'elder';
}
export function toneFromSeverity(severity) {
    if (severity === 'success')
        return 'success';
    if (severity === 'warning')
        return 'warning';
    if (severity === 'danger')
        return 'danger';
    if (severity === 'none')
        return 'muted';
    return 'info';
}
export function toneFromRunDelta(tone) {
    if (tone === 'success')
        return 'success';
    if (tone === 'warning')
        return 'warning';
    if (tone === 'danger')
        return 'danger';
    if (tone === 'muted')
        return 'muted';
    return 'info';
}
export function routeSourceFromRunCompass(source) {
    if (source === 'prestige')
        return 'prestige';
    if (source === 'run_delta')
        return 'run_delta';
    if (source === 'fallback')
        return 'fallback';
    return source;
}
export function blockerSourceFromRunCompass(source) {
    if (source === 'content_cap')
        return 'content_cap';
    if (source === 'run_delta')
        return 'run_delta';
    if (source === 'fallback')
        return 'fallback';
    return source;
}
function cloneTarget(target) {
    if (!target)
        return null;
    if (target.kind === 'tab')
        return { kind: 'tab', tab: target.tab };
    return { kind: 'world_module', cityId: target.cityId, moduleKey: target.moduleKey };
}
function targetIsVisibleModule(target, surface) {
    if (target.kind !== 'world_module')
        return true;
    if (!isLiveWorldModule(target.moduleKey))
        return false;
    if (!surface.currentCity || surface.currentCity.cityId !== target.cityId)
        return true;
    return surface.currentCity.visibleModuleKeys.includes(target.moduleKey);
}
function validateDaoRouteTarget(args) {
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
export function toDaoRoute(route, surface, debugNotes) {
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
function routeFromTarget(args) {
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
function toDaoObstruction(blocker) {
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
function toDaoMilestone(surface) {
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
function confidenceFromRunCompass(surface) {
    if (surface.mode === 'fallback')
        return 'low';
    return surface.primaryBlocker.confidence;
}
function buildReadinessLedger(surface, primaryRoute) {
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
function toSafetyNetSurface(safetyNet, surface, debugNotes) {
    if (!safetyNet)
        return null;
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
function toPrestigeSurface(prestigeHint) {
    if (!prestigeHint)
        return null;
    const target = cloneTarget(prestigeHint.target);
    const state = prestigeHint.state === 'available'
        ? 'viable'
        : prestigeHint.state;
    const route = routeFromTarget({
        id: `prestige-${state}`,
        label: prestigeHint.label,
        actionLabel: 'Open Reincarnation',
        detail: prestigeHint.detail,
        destinationLabel: 'Prestige',
        target,
        source: 'prestige',
        priority: 5,
        expectedDeltaLabel: 'Reincarnation counsel can be reviewed.',
    });
    return buildDaoReincarnationCounsel({
        advisorState: state,
        route,
        forecastLine: prestigeHint.detail,
        blockedDetail: prestigeHint.detail,
    });
}
function toRecentOmen(delta) {
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
function buildCurrentWork(primaryRoute) {
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
function buildBackgroundPlan(secondaryRoutes, offlineReturn) {
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
        offlineProjectionLabel: offlineReturn && offlineReturn.state !== 'unavailable'
            ? offlineReturn.detail
            : null,
    };
}
function resolveBuildSettings(guidanceProfile, settings) {
    return {
        ...createDefaultDaoMandateGuidanceSettings(),
        ...sanitizeDaoMandateGuidanceSettings(settings ?? {}),
        guidanceOath: guidanceProfile,
    };
}
function addUniqueRoute(routes, route, afterId) {
    const without = routes.filter((entry) => entry.id !== route.id);
    if (afterId) {
        const index = without.findIndex((entry) => entry.id === afterId);
        if (index >= 0) {
            return [...without.slice(0, index + 1), route, ...without.slice(index + 1)]
                .sort((left, right) => left.priority - right.priority);
        }
    }
    return [route, ...without].sort((left, right) => left.priority - right.priority);
}
function applyFailureCoachingEnhancement(args) {
    const coaching = buildDaoMandateFailureCoaching({
        surface: args.surface,
        settings: args.settings,
        failureReflections: args.failureReflections,
    });
    if (!coaching)
        return args.surface;
    const priorPrimary = args.surface.primaryRoute;
    const recentOmens = args.surface.recentOmens.some((omen) => omen.id === coaching.omen.id)
        ? args.surface.recentOmens
        : [coaching.omen, ...args.surface.recentOmens].slice(0, 12);
    const primaryRoute = coaching.shouldPromotePrimary ? coaching.correctionRoute : args.surface.primaryRoute;
    const obstruction = coaching.shouldPromotePrimary
        ? {
            ...args.surface.obstruction,
            kind: 'gate_recent_failure',
            label: 'Gate Reflection correction',
            detail: coaching.correctionRoute.detail,
            source: 'failure_reflection',
            evidenceIds: [...args.surface.obstruction.evidenceIds, coaching.omen.id],
        }
        : args.surface.obstruction;
    const secondaryRoutes = coaching.shouldPromotePrimary
        ? addUniqueRoute(args.surface.secondaryRoutes, priorPrimary, coaching.correctionRoute.id)
        : addUniqueRoute(args.surface.secondaryRoutes, coaching.correctionRoute);
    const requirementLedger = buildDaoRequirementLedgerFromRunCompass(args.runCompass, {
        obstruction,
        primaryRoute,
        secondaryRoutes,
        recentOmens,
        sourceMap: args.surface.sourceMap,
        safetyNetRoute: args.surface.safetyNet?.route ?? null,
    });
    return {
        ...args.surface,
        obstruction,
        primaryRoute,
        secondaryRoutes,
        recentOmens,
        requirementLedger,
    };
}
function createFallbackDaoMandateSurface(args) {
    const fallbackRoute = {
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
            detail: 'Dao Mandate could not read the current guidance truth for this moment.',
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
            detail: 'The guidance resolver did not return a readable surface.',
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
                    detail: 'The guidance resolver did not return a readable surface.',
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
export function buildDaoMandateSurfaceFromRunCompassV2(runCompass, options = {}) {
    const guidanceProfile = resolveGuidanceProfile(options.guidanceProfile);
    const settings = resolveBuildSettings(guidanceProfile, options.settings);
    if (!runCompass) {
        return createFallbackDaoMandateSurface({
            now: options.now ?? Date.now(),
            guidanceProfile,
            currentScreen: options.currentScreen,
            debugNote: 'Guidance resolver returned no surface while building Dao Mandate.',
        });
    }
    const debugNotes = [...runCompass.debugNotes, 'Dao Mandate adapted from the current guidance resolver.'];
    const primaryRoute = toDaoRoute(runCompass.primaryRoute, runCompass, debugNotes);
    const secondaryRoutes = runCompass.secondaryRoutes
        .map((route) => toDaoRoute(route, runCompass, debugNotes))
        .sort((left, right) => left.priority - right.priority);
    const obstruction = toDaoObstruction(runCompass.primaryBlocker);
    const readiness = buildReadinessLedger(runCompass, primaryRoute);
    const recentOmens = buildDaoMandateRecentOmens({
        now: options.now ?? runCompass.generatedAt,
        runDeltas: runCompass.recentDeltas,
        failureReflections: options.eventContext?.failureReflections,
        daoImpressions: options.eventContext?.daoImpressions,
        offlineReturn: options.eventContext?.offlineReturn,
    });
    const sourceMap = buildDaoMandateSourceMap({ runCompass, primaryRoute, secondaryRoutes });
    const safetyNet = toSafetyNetSurface(runCompass.safetyNet, runCompass, debugNotes);
    const prestige = options.prestigeCounsel ?? toPrestigeSurface(runCompass.prestigeHint);
    const requirementLedger = buildDaoRequirementLedgerFromRunCompass(runCompass, {
        obstruction,
        primaryRoute,
        secondaryRoutes,
        recentOmens,
        sourceMap,
        safetyNetRoute: safetyNet?.route ?? null,
    });
    const baseSurface = {
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
        backgroundPlan: buildBackgroundPlan(secondaryRoutes, options.eventContext?.offlineReturn),
        safetyNet,
        prestige,
        recentOmens,
        lessonSlips: [],
        localLens: null,
    };
    const eventEnhanced = applyFailureCoachingEnhancement({
        surface: baseSurface,
        runCompass,
        settings,
        failureReflections: options.eventContext?.failureReflections,
    });
    return {
        ...eventEnhanced,
        lessonSlips: buildDaoMandateLessons({
            surface: eventEnhanced,
            settings,
            memory: options.lessonMemory,
        }),
    };
}
export function buildLiveDaoMandateSurfaceV1(options = {}) {
    const guidanceProfile = resolveGuidanceProfile(options.guidanceProfile);
    try {
        const runCompass = buildLiveRunCompassSurfaceV2();
        const uiState = useUIStore.getState();
        const settings = {
            ...sanitizeDaoMandateGuidanceSettings(uiState.settings),
            ...options.settings,
            guidanceOath: guidanceProfile,
        };
        const forecast = buildPrestigeForecastSurfaceV2();
        const prestigeRoute = (runCompass ? toPrestigeSurface(runCompass.prestigeHint)?.route : null) ?? routeFromTarget({
            id: 'prestige-counsel',
            label: 'Review Reincarnation',
            actionLabel: 'Open Reincarnation',
            detail: forecast.advisorDetail,
            destinationLabel: 'Prestige',
            target: { kind: 'tab', tab: 'prestige' },
            source: 'prestige',
            priority: 5,
            expectedDeltaLabel: 'Reincarnation counsel can be reviewed.',
        });
        const prestigeCounsel = buildDaoReincarnationCounsel({
            advisorState: forecast.advisorState,
            route: prestigeRoute,
            potentialApGain: forecast.ap.potentialGain,
            forecastLine: forecast.ap.potentialGain > 0 ? `Potential AP on reincarnation: +${forecast.ap.potentialGain}.` : null,
            blockedDetail: forecast.advisorDetail,
        });
        return buildDaoMandateSurfaceFromRunCompassV2(runCompass, {
            ...options,
            guidanceProfile,
            settings,
            eventContext: {
                failureReflections: useFailureReflectionStore.getState().reflections,
                daoImpressions: captureDaoImpressionAwards(5),
                offlineReturn: options.eventContext?.offlineReturn ?? null,
            },
            prestigeCounsel,
            lessonMemory: options.lessonMemory ?? uiState.daoMandateLessonMemory,
        });
    }
    catch (error) {
        return createFallbackDaoMandateSurface({
            now: options.now ?? Date.now(),
            guidanceProfile,
            currentScreen: options.currentScreen,
            debugNote: `Guidance resolver failed while building Dao Mandate: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
}
