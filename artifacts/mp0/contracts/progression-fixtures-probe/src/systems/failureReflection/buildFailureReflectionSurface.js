function diagnosisLabel(code) {
    switch (code) {
        case 'undercultivated':
            return 'undercultivated breath';
        case 'underbuilt':
            return 'unsettled build pattern';
        case 'underforged':
            return 'forge-floor weakness';
        case 'underprepared':
            return 'medicine posture weakness';
        case 'close':
            return 'near-success pressure';
        case 'bypassAvailable':
            return 'Safety Net resistance';
        default:
            return 'unclear gate pressure';
    }
}
function toneFor(record) {
    if (record.resolved)
        return 'neutral';
    if (record.patternKind === 'reckless_close_loop')
        return 'near_success';
    if (record.repeatedCount >= 3)
        return 'critical';
    return 'warning';
}
export function buildFailureReflectionSurface(record) {
    const label = diagnosisLabel(record.diagnosisCode);
    return {
        version: 1,
        reflectionId: record.reflectionId,
        title: record.resolved ? 'Resolved Inner Demon' : 'Inner Demon Reflection',
        innerDemonLine: record.resolved
            ? `The ${label} knot has settled; the gate pattern no longer repeats this life.`
            : `The gate is not rejecting your Dao. It is naming the same ${label} pattern.`,
        diagnosisLine: `Repeated diagnosis: ${label}.`,
        correctiveRouteLabel: record.correctiveRoute.label,
        correctiveRouteReason: record.correctiveRoute.reason,
        repeatedCountLine: `Seen ${record.repeatedCount} times at this gate.`,
        tone: toneFor(record),
        resolved: record.resolved,
        memoryEligible: record.memoryEligible,
        routeTarget: record.correctiveRoute.target,
        debugNotes: [
            `trial=${record.trialId}`,
            `diagnosis=${record.diagnosisCode}`,
            `route=${record.correctiveRoute.target}`,
        ],
    };
}
