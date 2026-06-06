import type { OfflineCatchupForegroundFocus, OfflineCatchupSummary } from '../../services/time/OfflineCatchup.js';
import { formatOfflineDuration, MAX_OFFLINE_SECONDS } from '../../services/time/offlineShared.js';

export type OfflineCatchupSurfaceForegroundFocus = OfflineCatchupForegroundFocus & {
  pausedLabel: string;
};

export type OfflineCatchupSurfaceV1 = {
  version: 1;
  generatedAt: number;
  secondsConsidered: number;
  durationLabel: string;
  foregroundFocus?: OfflineCatchupSurfaceForegroundFocus;
  cap: {
    maxSeconds: number;
    wasCapped: boolean;
    cappedFromSeconds?: number;
  };
  efficiency: {
    value: number;
    label: string;
    sources: { id: string; label: string; value: string }[];
  };
  summaryGroups: OfflineCatchupGroup[];
  blockedReasons: OfflineBlockedReason[];
  warnings: string[];
  debugNotes: string[];
};

export type OfflineCatchupGroup = {
  id: 'foreground_focus' | 'cultivation' | 'path_training' | 'dao_heart' | 'queued_actions' | 'expeditions' | 'blocked' | 'none';
  title: string;
  lines: {
    id: string;
    label: string;
    value?: string;
    detail?: string;
    route?: {
      kind: 'tab' | 'world_module' | 'status' | 'none';
      tabId?: string;
      moduleKey?: string;
      anchor?: string;
    } | null;
  }[];
};

export type OfflineBlockedReason = {
  id: string;
  label: string;
  detail: string;
  category: 'cultivation' | 'queues' | 'expeditions' | 'combat' | 'cap' | 'content';
};

const percentLabel = (value: number): string => `${Math.round(value * 100)}%`;

const partValue = (summary: OfflineCatchupSummary | null, kind: OfflineCatchupSummary['parts'][number]['kind']): string | null =>
  summary?.parts.find((part) => part.kind === kind)?.value ?? null;

const partByKind = (
  summary: OfflineCatchupSummary | null,
  kind: OfflineCatchupSummary['parts'][number]['kind'],
): OfflineCatchupSummary['parts'][number] | null =>
  summary?.parts.find((part) => part.kind === kind) ?? null;

const withDetailRows = (
  part: OfflineCatchupSummary['parts'][number] | null,
  mainLine: OfflineCatchupGroup['lines'][number],
): OfflineCatchupGroup['lines'] => {
  const detailRows = part?.detailRows ?? [];
  if (detailRows.length === 0) return [mainLine];
  return [
    mainLine,
    ...detailRows.map((row) => ({
      id: row.id,
      label: row.label,
      value: row.value,
      detail: row.detail,
      route: mainLine.route,
    })),
  ];
};

export function buildOfflineCatchupSurface(args: {
  summary: OfflineCatchupSummary | null;
  generatedAt: number;
  rawSeconds?: number;
}): OfflineCatchupSurfaceV1 {
  const summary = args.summary;
  const secondsConsidered = summary?.offlineSeconds ?? 0;
  const rawSeconds = Math.max(0, Math.floor(args.rawSeconds ?? secondsConsidered));
  const wasCapped = Boolean(summary?.wasCapped || rawSeconds > secondsConsidered);
  const efficiencyValue = summary?.efficiency ?? 0;
  const qi = partValue(summary, 'qi_gained');
  const trainingPart = partByKind(summary, 'path_training');
  const daoHeartPart = partByKind(summary, 'dao_heart');
  const training = trainingPart?.value ?? null;
  const daoHeart = daoHeartPart?.value ?? null;
  const foregroundFocus = summary?.foregroundFocus ?? null;
  const queues = partValue(summary, 'queued_actions');
  const expeditions = partValue(summary, 'expeditions');
  const summaryGroups: OfflineCatchupGroup[] = [];
  const blockedReasons: OfflineBlockedReason[] = [];

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
  } else {
    if (foregroundFocus) {
      summaryGroups.push({
        id: 'foreground_focus',
        title: 'Foreground Focus',
        lines: [
          {
            id: 'active_focus',
            label: 'Foreground Focus',
            value: foregroundFocus.label,
            detail: foregroundFocus.detail,
          },
          {
            id: 'paused_systems',
            label: 'Paused systems',
            detail: foregroundFocus.pausedLabel,
          },
        ],
      });
    }

    summaryGroups.push({
      id: 'cultivation',
      title: 'Cultivation',
      lines: qi
        ? [{ id: 'qi_gained', label: 'Qi gained', value: qi, route: { kind: 'tab', tabId: 'cultivation' } }]
        : [{
          id: 'qi_none',
          label: 'No Qi gained',
          detail: foregroundFocus?.mode === 'path_training' || foregroundFocus?.mode === 'dao_heart' || foregroundFocus?.mode === 'combat' || foregroundFocus?.mode === 'queued_only'
            ? foregroundFocus.pausedLabel
            : efficiencyValue <= 0 ? 'Offline efficiency is 0%.' : 'No positive Qi rate was available.',
        }],
    });

    summaryGroups.push({
      id: 'path_training',
      title: 'Training',
      lines: training
        ? withDetailRows(trainingPart, { id: 'path_training_gain', label: 'Training practice', value: training, route: { kind: 'world_module', moduleKey: 'trainingHall' } })
        : [{ id: 'path_training_none', label: 'No Training Hall practice', detail: 'Training only advances offline when Path Training is the active foreground activity.' }],
    });

    summaryGroups.push({
      id: 'dao_heart',
      title: 'Dao Heart',
      lines: daoHeart
        ? withDetailRows(daoHeartPart, { id: 'dao_heart_gain', label: 'Dao Heart practice', value: daoHeart, route: { kind: 'tab', tabId: 'cultivation', anchor: 'dao-heart' } })
        : [{ id: 'dao_heart_none', label: 'No Dao Heart progress', detail: 'Only Silent Sitting, Verse Recitation, Scripture Copying, and Breath Harmonization advance offline while active.' }],
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
    foregroundFocus: foregroundFocus ? { ...foregroundFocus } : undefined,
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
