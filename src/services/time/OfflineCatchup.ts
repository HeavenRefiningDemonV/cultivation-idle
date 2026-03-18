import { useGameStore } from '../../stores/gameStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useExpeditionStore } from '../../stores/expeditionStore';
import { formatNumber, D } from '../../utils/numbers';
import type { OfflineContext } from '../../systems/offline';
import { MAX_OFFLINE_MS } from './offlineShared';
import { formatOfflineDuration, getOfflineEfficiency } from '../../systems/offline';
import { cultivationService } from '../cultivationService';

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

export function apply(context: OfflineContext): OfflineCatchupResult {
  if (context.dtMs <= 0) {
    return { summary: null };
  }

  const seconds = Math.floor(Math.min(context.dtMs, MAX_OFFLINE_MS) / 1000);
  const summaryParts: OfflineCatchupSummaryPart[] = [];

  // Cultivation gain
  const gameStore = useGameStore.getState();
  const offlineEfficiency = context.wasMeditating ? getOfflineEfficiency() : 0;
  const qiPerSecond = D(gameStore.qiPerSecond ?? '0');
  const qiGain = qiPerSecond.times(seconds).times(offlineEfficiency);
  if (qiGain.greaterThan(0)) {
    const nextQi = D(gameStore.qi ?? '0').plus(qiGain);
    useGameStore.setState({
      qi: nextQi.toString(),
      lastActiveTime: context.now,
      lastTickTime: context.now,
    });
    summaryParts.push({ label: 'Qi gained', value: formatNumber(qiGain) });
  }

  cultivationService.applyOfflineProgress(seconds * 1000, context.now - seconds * 1000, context.now);

  // Profession queues (tick timers only)
  const professionStore = useProfessionStore.getState();
  const beforeJobs =
    professionStore.alchemyQueue.length +
    professionStore.talismanQueue.length +
    professionStore.forgeQueue.length;
  professionStore.applyOffline(context.now);
  const afterJobs =
    professionStore.alchemyQueue.length +
    professionStore.talismanQueue.length +
    professionStore.forgeQueue.length;
  if (beforeJobs !== afterJobs) {
    summaryParts.push({ label: 'Craft queues updated', value: `${beforeJobs} → ${afterJobs}` });
  }

  // Expeditions (mark complete if timer elapsed)
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
