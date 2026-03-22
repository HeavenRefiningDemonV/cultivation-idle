import { useGameStore } from '../../stores/gameStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { formatNumber, D } from '../../utils/numbers.js';
import type { OfflineContext } from '../../systems/offline.js';
import { MAX_OFFLINE_MS } from './offlineShared.js';
import { formatOfflineDuration, getOfflineEfficiency } from '../../systems/offline.js';
import { cultivationService } from '../cultivationService.js';
import { buildCultivationConsumableCarryoverWindows } from '../../systems/consumables/cultivationConsumableEffects.js';

export interface OfflineCatchupSummaryPart {
  label: string;
  value: string;
}

export interface OfflineCatchupSummary {
  offlineSeconds: number;
  offlineDuration: string;
  efficiency: number;
  wasCapped: boolean;
  parts: OfflineCatchupSummaryPart[];
}

export interface OfflineCatchupResult {
  summary: OfflineCatchupSummary | null;
}

function calculateOfflineQiGain(startAt: number, endAt: number, offlineEfficiency: number) {
  if (offlineEfficiency <= 0 || endAt <= startAt) return D(0);
  const cultivation = useCultivationStore.getState();
  const gameStore = useGameStore.getState();
  cultivation.clearExpiredCultivationConsumables(startAt);
  const readModel = cultivation.getCultivationConsumableReadModel(startAt);
  const currentQiPerSecond = D(gameStore.qiPerSecond ?? '0');
  const baseQiPerSecond = readModel.modifiers.qiRateMult > 0
    ? currentQiPerSecond.dividedBy(readModel.modifiers.qiRateMult)
    : currentQiPerSecond;

  return buildCultivationConsumableCarryoverWindows(cultivation.activeCultivationConsumables, startAt, endAt)
    .reduce((total, window) => {
      const seconds = window.elapsedMs / 1000;
      return total.plus(baseQiPerSecond.times(window.modifiers.qiRateMult).times(seconds).times(offlineEfficiency));
    }, D(0));
}

export function apply(context: OfflineContext): OfflineCatchupResult {
  if (context.dtMs <= 0) {
    return { summary: null };
  }

  const seconds = Math.floor(Math.min(context.dtMs, MAX_OFFLINE_MS) / 1000);
  const summaryParts: OfflineCatchupSummaryPart[] = [];
  const startAt = context.now - seconds * 1000;

  const gameStore = useGameStore.getState();
  const offlineEfficiency = context.wasMeditating ? getOfflineEfficiency() : 0;
  const qiGain = calculateOfflineQiGain(startAt, context.now, offlineEfficiency);
  if (qiGain.greaterThan(0)) {
    const nextQi = D(gameStore.qi ?? '0').plus(qiGain);
    useGameStore.setState({ qi: nextQi.toString(), lastActiveTime: context.now, lastTickTime: context.now });
    summaryParts.push({ label: 'Qi gained', value: formatNumber(qiGain) });
  }

  cultivationService.applyOfflineProgress(seconds * 1000, startAt, context.now);

  const professionStore = useProfessionStore.getState();
  const beforeJobs = professionStore.alchemyQueue.length + professionStore.talismanQueue.length + professionStore.forgeQueue.length;
  professionStore.applyOffline(context.now);
  const afterJobs = professionStore.alchemyQueue.length + professionStore.talismanQueue.length + professionStore.forgeQueue.length;
  if (beforeJobs !== afterJobs) {
    summaryParts.push({ label: 'Craft queues updated', value: `${beforeJobs} → ${afterJobs}` });
  }

  const expeditionStore = useExpeditionStore.getState();
  const beforeComplete = expeditionStore.active.filter((run) => run.status === 'complete').length;
  expeditionStore.tick(context.now);
  const afterComplete = expeditionStore.active.filter((run) => run.status === 'complete').length;
  const newlyCompleted = afterComplete - beforeComplete;
  if (newlyCompleted > 0) {
    summaryParts.push({ label: 'Expeditions ready', value: `${newlyCompleted}` });
  }

  return {
    summary: {
      offlineSeconds: seconds,
      offlineDuration: formatOfflineDuration(seconds),
      efficiency: offlineEfficiency,
      wasCapped: context.wasCapped,
      parts: summaryParts,
    },
  };
}
