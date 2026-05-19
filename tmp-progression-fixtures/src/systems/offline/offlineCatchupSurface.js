import { formatOfflineDuration, MAX_OFFLINE_SECONDS } from '../../services/time/offlineShared.js';
const percentLabel = (value) => `${Math.round(value * 100)}%`;
const partValue = (summary, kind) => summary?.parts.find((part) => part.kind === kind)?.value ?? null;
export function buildOfflineCatchupSurface(args) {
    const summary = args.summary;
    const secondsConsidered = summary?.offlineSeconds ?? 0;
    const rawSeconds = Math.max(0, Math.floor(args.rawSeconds ?? secondsConsidered));
    const wasCapped = Boolean(summary?.wasCapped || rawSeconds > secondsConsidered);
    const efficiencyValue = summary?.efficiency ?? 0;
    const qi = partValue(summary, 'qi_gained');
    const queues = partValue(summary, 'queued_actions');
    const expeditions = partValue(summary, 'expeditions');
    const summaryGroups = [];
    const blockedReasons = [];
    if (!summary) {
        summaryGroups.push({
            id: 'none',
            title: 'No eligible offline time',
            lines: [{
                    id: 'no_time',
                    label: 'No offline time was considered.',
                    detail: 'The save timestamp already matches the current session.',
                    route: { kind: 'tab', tabId: 'status' },
                }],
        });
    }
    else {
        summaryGroups.push({
            id: 'cultivation',
            title: 'Cultivation',
            lines: qi
                ? [{ id: 'qi_gained', label: 'Qi gained', value: qi, route: { kind: 'tab', tabId: 'cultivation' } }]
                : [{ id: 'qi_none', label: 'No Qi gained', detail: efficiencyValue <= 0 ? 'Offline efficiency is 0%.' : 'No positive Qi rate was available.' }],
        });
        summaryGroups.push({
            id: 'queued_actions',
            title: 'Queued actions',
            lines: queues
                ? [{ id: 'queues_ready', label: 'Queued actions ready', value: queues, route: { kind: 'world_module', moduleKey: 'apothecary' } }]
                : [{ id: 'queues_none', label: 'No queues completed', detail: 'Existing queues either were absent or not ready by the end of the offline window.' }],
        });
        summaryGroups.push({
            id: 'expeditions',
            title: 'Expeditions',
            lines: expeditions
                ? [{ id: 'expeditions_ready', label: 'Expeditions ready', value: expeditions, route: { kind: 'world_module', moduleKey: 'expeditions' } }]
                : [{ id: 'expeditions_none', label: 'No expeditions completed', detail: 'Existing expeditions either were absent or still in progress.' }],
        });
    }
    blockedReasons.push({
        id: 'combat_excluded',
        label: 'Combat excluded',
        detail: 'Combat never progresses while offline.',
        category: 'combat',
    });
    if (wasCapped) {
        blockedReasons.push({
            id: 'offline_cap',
            label: 'Offline cap applied',
            detail: `Only ${formatOfflineDuration(secondsConsidered)} counted from ${formatOfflineDuration(rawSeconds)} away.`,
            category: 'cap',
        });
    }
    return {
        version: 1,
        generatedAt: args.generatedAt,
        secondsConsidered,
        durationLabel: summary?.offlineDuration ?? formatOfflineDuration(0),
        cap: {
            maxSeconds: MAX_OFFLINE_SECONDS,
            wasCapped,
            cappedFromSeconds: wasCapped ? rawSeconds : undefined,
        },
        efficiency: {
            value: efficiencyValue,
            label: `Offline efficiency ${percentLabel(efficiencyValue)}`,
            sources: summary?.efficiencySources ?? [{ id: 'none', label: 'No offline settlement', value: '0%' }],
        },
        summaryGroups,
        blockedReasons,
        warnings: wasCapped ? ['Offline time exceeded the cap; excess time was not counted.'] : [],
        debugNotes: [
            'OfflineCatchup.apply is the mutating offline pipeline.',
            'The surface is built from the same summary returned by the mutation path.',
        ],
    };
}
