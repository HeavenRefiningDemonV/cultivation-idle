function partValue(summary, kind) {
    return summary.parts.find((part) => part.kind === kind)?.value ?? null;
}
function currentRouteLabel(currentMandate) {
    return currentMandate?.primaryRoute.destinationLabel ?? currentMandate?.primaryRoute.label ?? 'the current route';
}
export function buildDaoOfflineMandateReturnSurface(args) {
    const route = args.currentMandate?.primaryRoute && !args.currentMandate.primaryRoute.blocked
        ? args.currentMandate.primaryRoute
        : null;
    if (!args.summary || !args.currentMandate) {
        return {
            state: 'unavailable',
            label: 'Mandate after return unavailable',
            detail: 'Offline settlement completed, but route comparison was not available.',
            route,
            evidence: ['Combat never progresses offline.'],
            changedFromLabel: null,
            changedToLabel: args.currentMandate?.primaryRoute.label ?? null,
        };
    }
    const summary = args.summary;
    const qi = partValue(summary, 'qi_gained');
    const queues = partValue(summary, 'queued_actions');
    const expeditions = partValue(summary, 'expeditions');
    const destination = currentRouteLabel(args.currentMandate);
    const evidence = [
        qi ? `Qi gained: ${qi}` : null,
        queues ? `Queued actions ready: ${queues}` : null,
        expeditions ? `Expeditions ready: ${expeditions}` : null,
        'Combat never progresses offline.',
    ].filter((line) => Boolean(line));
    if (summary.wasCapped) {
        return {
            state: 'capped',
            label: 'Offline cap reached',
            detail: `The offline window hit the cap; review ${destination} before leaving again.`,
            route,
            evidence,
            changedFromLabel: args.changedFromLabel ?? null,
            changedToLabel: args.currentMandate.primaryRoute.label,
        };
    }
    if (queues) {
        return {
            state: 'progressed',
            label: 'Mandate advanced after return',
            detail: `Queued work became ready while away; the current counsel points to ${destination}.`,
            route,
            evidence,
            changedFromLabel: args.changedFromLabel ?? null,
            changedToLabel: args.currentMandate.primaryRoute.label,
        };
    }
    if (expeditions) {
        return {
            state: 'progressed',
            label: 'Mandate advanced after return',
            detail: `Expedition returns improved background support; the current counsel points to ${destination}.`,
            route,
            evidence,
            changedFromLabel: args.changedFromLabel ?? null,
            changedToLabel: args.currentMandate.primaryRoute.label,
        };
    }
    if (qi) {
        return {
            state: args.changedFromLabel && args.changedFromLabel !== args.currentMandate.primaryRoute.label ? 'changed' : 'progressed',
            label: args.changedFromLabel ? 'Mandate shifted after return' : 'Current Mandate after return',
            detail: `Offline breathing filled the Qi vessel; the current counsel points to ${destination}.`,
            route,
            evidence,
            changedFromLabel: args.changedFromLabel ?? null,
            changedToLabel: args.currentMandate.primaryRoute.label,
        };
    }
    return {
        state: 'unchanged',
        label: 'Mandate unchanged',
        detail: `Offline settlement completed, but ${destination} remains the current obstruction.`,
        route,
        evidence,
        changedFromLabel: args.changedFromLabel ?? null,
        changedToLabel: args.currentMandate.primaryRoute.label,
    };
}
