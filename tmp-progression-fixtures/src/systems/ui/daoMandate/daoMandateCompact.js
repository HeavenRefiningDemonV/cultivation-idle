export function buildDaoMandateCompactSurfaceV1(surface) {
    return {
        milestoneLine: surface.milestone.label,
        obstructionLine: `${surface.obstruction.label}: ${surface.obstruction.detail}`,
        primaryRouteLine: `${surface.primaryRoute.label} -> ${surface.primaryRoute.destinationLabel}`,
        readinessLine: surface.readiness.primaryShortfallLabel ?? surface.readiness.label,
        recentOmenLine: surface.recentOmens[0]?.memoryLine ?? null,
    };
}
