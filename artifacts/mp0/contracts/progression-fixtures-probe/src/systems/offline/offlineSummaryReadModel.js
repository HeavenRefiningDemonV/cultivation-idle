import { OFFLINE_MODAL_SUMMARY_PART_ORDER } from '../balance/offlineTargets.js';
const parsePositiveInteger = (raw) => {
    const match = raw.match(/\d+/);
    if (!match)
        return 0;
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
export function getQueuedActionReadinessSnapshot(snapshot, now) {
    const alchemy = snapshot.alchemyQueue.filter((job) => now >= job.endsAt).length;
    const talisman = snapshot.talismanQueue.filter((job) => now >= job.endsAt).length;
    const forge = snapshot.forgeQueue.filter((job) => {
        const status = job.status;
        if (status === 'READY_TO_CLAIM' || status === 'CLAIMED')
            return true;
        if (status === 'QUEUED')
            return false;
        return now >= job.endsAt;
    }).length;
    return {
        totalReady: alchemy + talisman + forge,
        byStation: { alchemy, talisman, forge },
    };
}
export function getQueuedActionReadinessDelta(args) {
    const before = getQueuedActionReadinessSnapshot(args.before, args.beforeAt);
    const after = getQueuedActionReadinessSnapshot(args.after, args.afterAt);
    return {
        totalReadyBefore: before.totalReady,
        totalReadyAfter: after.totalReady,
        newlyReady: Math.max(0, after.totalReady - before.totalReady),
        byStation: {
            alchemy: Math.max(0, after.byStation.alchemy - before.byStation.alchemy),
            talisman: Math.max(0, after.byStation.talisman - before.byStation.talisman),
            forge: Math.max(0, after.byStation.forge - before.byStation.forge),
        },
    };
}
export function getExpeditionReadinessSnapshot(snapshot, now) {
    return {
        totalComplete: snapshot.active.filter((run) => run.status === 'complete' || now >= run.endsAt).length,
    };
}
export function getExpeditionReadinessDelta(args) {
    const before = getExpeditionReadinessSnapshot(args.before, args.beforeAt);
    const after = getExpeditionReadinessSnapshot(args.after, args.afterAt);
    return {
        totalCompleteBefore: before.totalComplete,
        totalCompleteAfter: after.totalComplete,
        newlyComplete: Math.max(0, after.totalComplete - before.totalComplete),
    };
}
function isVisiblePart(part) {
    if (!part.value.trim())
        return false;
    return parsePositiveInteger(part.value) > 0;
}
export function buildOfflineModalRows(summary) {
    const partsByKind = new Map();
    summary.parts.forEach((part) => {
        if (!OFFLINE_MODAL_SUMMARY_PART_ORDER.includes(part.kind))
            return;
        if (!isVisiblePart(part))
            return;
        if (!partsByKind.has(part.kind))
            partsByKind.set(part.kind, part);
    });
    return OFFLINE_MODAL_SUMMARY_PART_ORDER.map((kind) => partsByKind.get(kind)).filter((part) => Boolean(part));
}
