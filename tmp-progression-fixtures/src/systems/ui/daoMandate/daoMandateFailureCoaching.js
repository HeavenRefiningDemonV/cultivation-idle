const WORLD_TARGETS = {
    apothecary: 'apothecary',
    forge: 'forge',
    manual_pavilion: 'manualPavilion',
    ruins: 'ruins',
    bounties: 'bounties',
    expeditions: 'expeditions',
    gate_trial: 'gateTrial',
};
function isGateFailureSurface(surface) {
    return surface.milestone.state === 'gate_failed' ||
        surface.obstruction.kind === 'gate_recent_failure' ||
        surface.obstruction.source === 'failure_reflection';
}
function isCritical(record, surface) {
    return record.repeatedCount >= 3 ||
        record.patternKind === 'safety_net_resistance' ||
        surface.safetyNet?.state === 'available';
}
function selectReflection(records, surface, settings) {
    if (!isGateFailureSurface(surface))
        return null;
    const active = records
        .filter((record) => !record.resolved && record.memoryEligible)
        .sort((left, right) => right.repeatedCount - left.repeatedCount || right.lastUpdatedAt - left.lastUpdatedAt);
    if (active.length === 0)
        return null;
    const chosen = active[0];
    if (settings.failureCoaching === 'critical_only' && !isCritical(chosen, surface))
        return null;
    return chosen;
}
function routeTargetFor(record, surface) {
    const target = record.correctiveRoute.target;
    if (target === 'cultivation')
        return { kind: 'tab', tab: 'cultivation' };
    if (target === 'techniques')
        return { kind: 'tab', tab: 'techniques' };
    const moduleKey = WORLD_TARGETS[target];
    const cityId = surface.milestone.currentCityId;
    if (!moduleKey || !cityId)
        return null;
    return { kind: 'world_module', cityId, moduleKey };
}
function destinationFor(target) {
    switch (target) {
        case 'cultivation': return 'Cultivation';
        case 'techniques': return 'Techniques';
        case 'manual_pavilion': return 'Manual Pavilion';
        case 'forge': return 'Forge';
        case 'apothecary': return 'Apothecary';
        case 'ruins': return 'Ruins';
        case 'bounties': return 'Bounties';
        case 'expeditions': return 'Expeditions';
        case 'gate_trial': return 'Gate Trial';
    }
}
function routeDetail(record) {
    if (/underprepared|medicine|apothecary/i.test(record.diagnosisCode)) {
        return 'The guardian exposed a medicine reserve gap. Stock the pouch before another attempt.';
    }
    if (/underforged|forge/i.test(record.diagnosisCode)) {
        return 'The gate pressed through the current weapon floor. Raise the forge floor before retrying.';
    }
    if (/underbuilt|technique|manual/i.test(record.diagnosisCode)) {
        return 'The guardian revealed an unstable loadout. Tune doctrine before returning.';
    }
    if (/undercultivated|qi/i.test(record.diagnosisCode)) {
        return 'The gate exposed a Qi threshold weakness. Settle breath before retrying.';
    }
    if (/bypass|safety/i.test(record.diagnosisCode)) {
        return 'Safety Net proof is now available; review the gate support path.';
    }
    return record.correctiveRoute.reason;
}
function buildCorrectionRoute(record, surface) {
    const target = routeTargetFor(record, surface);
    const destinationLabel = destinationFor(record.correctiveRoute.target);
    return {
        id: `failure-correction:${record.reflectionId}`,
        label: record.correctiveRoute.label,
        actionLabel: `Open ${destinationLabel}`,
        detail: routeDetail(record),
        destinationLabel,
        target,
        blocked: !target,
        blockedReason: target ? null : 'This route cannot be opened from here yet.',
        expectedDeltaLabel: 'Corrective route can steady the next gate attempt.',
        source: 'failure_reflection',
        priority: 2,
    };
}
function buildOmen(record, route) {
    return {
        id: `failure:${record.reflectionId}`,
        source: 'failure_reflection',
        timestamp: record.lastUpdatedAt,
        tone: record.repeatedCount >= 3 ? 'warning' : 'info',
        label: 'Gate Reflection recorded',
        detail: route.detail,
        memoryLine: `${route.detail} Seen ${record.repeatedCount} times at this gate.`,
        rewardSummary: null,
        readinessDeltaLabel: route.destinationLabel,
    };
}
export function buildDaoMandateFailureCoaching(args) {
    const record = selectReflection(args.failureReflections ?? [], args.surface, args.settings);
    if (!record)
        return null;
    const correctionRoute = buildCorrectionRoute(record, args.surface);
    return {
        correctionRoute,
        omen: buildOmen(record, correctionRoute),
        evidence: [
            `Repeated gate pattern: ${record.repeatedCount}`,
            correctionRoute.detail,
        ],
        shouldPromotePrimary: args.surface.obstruction.kind === 'gate_recent_failure' && !correctionRoute.blocked,
    };
}
