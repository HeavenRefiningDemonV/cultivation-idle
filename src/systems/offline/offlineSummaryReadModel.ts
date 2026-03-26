import type { OfflineCatchupSummary, OfflineCatchupSummaryPart } from '../../services/time/OfflineCatchup.js';
import { OFFLINE_MODAL_SUMMARY_PART_ORDER, type OfflineModalSummaryPartKind } from '../balance/offlineTargets.js';
import type { AlchemyJob, ForgeJob, TalismanJob } from '../../stores/professionStore.js';
import type { ExpeditionRun } from '../../stores/expeditionStore.js';

type QueueSnapshot = {
  alchemyQueue: readonly AlchemyJob[];
  talismanQueue: readonly TalismanJob[];
  forgeQueue: readonly ForgeJob[];
};

type ExpeditionSnapshot = {
  active: readonly ExpeditionRun[];
};

export type QueuedActionReadinessSnapshot = {
  totalReady: number;
  byStation: {
    alchemy: number;
    talisman: number;
    forge: number;
  };
};

export type QueuedActionReadinessDelta = {
  totalReadyBefore: number;
  totalReadyAfter: number;
  newlyReady: number;
  byStation: {
    alchemy: number;
    talisman: number;
    forge: number;
  };
};

export type ExpeditionReadinessSnapshot = {
  totalComplete: number;
};

export type ExpeditionReadinessDelta = {
  totalCompleteBefore: number;
  totalCompleteAfter: number;
  newlyComplete: number;
};

const parsePositiveInteger = (raw: string): number => {
  const match = raw.match(/\d+/);
  if (!match) return 0;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export function getQueuedActionReadinessSnapshot(snapshot: QueueSnapshot, now: number): QueuedActionReadinessSnapshot {
  const alchemy = snapshot.alchemyQueue.filter((job) => now >= job.endsAt).length;
  const talisman = snapshot.talismanQueue.filter((job) => now >= job.endsAt).length;
  const forge = snapshot.forgeQueue.filter((job) => {
    const status = job.status;
    if (status === 'READY_TO_CLAIM' || status === 'CLAIMED') return true;
    if (status === 'QUEUED') return false;
    return now >= job.endsAt;
  }).length;

  return {
    totalReady: alchemy + talisman + forge,
    byStation: { alchemy, talisman, forge },
  };
}

export function getQueuedActionReadinessDelta(args: {
  before: QueueSnapshot;
  after: QueueSnapshot;
  beforeAt: number;
  afterAt: number;
}): QueuedActionReadinessDelta {
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

export function getExpeditionReadinessSnapshot(snapshot: ExpeditionSnapshot, now: number): ExpeditionReadinessSnapshot {
  return {
    totalComplete: snapshot.active.filter((run) => run.status === 'complete' || now >= run.endsAt).length,
  };
}

export function getExpeditionReadinessDelta(args: {
  before: ExpeditionSnapshot;
  after: ExpeditionSnapshot;
  beforeAt: number;
  afterAt: number;
}): ExpeditionReadinessDelta {
  const before = getExpeditionReadinessSnapshot(args.before, args.beforeAt);
  const after = getExpeditionReadinessSnapshot(args.after, args.afterAt);
  return {
    totalCompleteBefore: before.totalComplete,
    totalCompleteAfter: after.totalComplete,
    newlyComplete: Math.max(0, after.totalComplete - before.totalComplete),
  };
}

function isVisiblePart(part: OfflineCatchupSummaryPart): boolean {
  if (!part.value.trim()) return false;
  return parsePositiveInteger(part.value) > 0;
}

export function buildOfflineModalRows(summary: OfflineCatchupSummary): OfflineCatchupSummaryPart[] {
  const partsByKind = new Map<OfflineModalSummaryPartKind, OfflineCatchupSummaryPart>();
  summary.parts.forEach((part) => {
    if (!OFFLINE_MODAL_SUMMARY_PART_ORDER.includes(part.kind)) return;
    if (!isVisiblePart(part)) return;
    if (!partsByKind.has(part.kind)) partsByKind.set(part.kind, part);
  });

  return OFFLINE_MODAL_SUMMARY_PART_ORDER.map((kind) => partsByKind.get(kind)).filter(
    (part): part is OfflineCatchupSummaryPart => Boolean(part),
  );
}
