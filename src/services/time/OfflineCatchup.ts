import type { SaveData } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useExpeditionStore } from '../../stores/expeditionStore';
import { buildDefaultSaveState } from '../../save/defaultSaveState';
import { formatNumber, D } from '../../utils/numbers';
import { MAX_OFFLINE_MS } from '../../systems/offline';

export interface OfflineCatchupSummaryPart {
  label: string;
  value: string;
}

export interface OfflineCatchupResult {
  updatedState: SaveData;
  summary: {
    offlineSeconds: number;
    parts: OfflineCatchupSummaryPart[];
  } | null;
}

export function apply(stateSnapshot: SaveData, nowWall: number): OfflineCatchupResult {
  const lastActiveMs =
    stateSnapshot.meta?.lastActiveAtMs ??
    stateSnapshot.gameState.lastActiveTime ??
    stateSnapshot.gameState.lastTickTime ??
    nowWall;

  const deltaMsRaw = Math.max(0, nowWall - lastActiveMs);
  const deltaMs = Math.min(deltaMsRaw, MAX_OFFLINE_MS);
  if (deltaMs <= 0) {
    return { updatedState: stateSnapshot, summary: null };
  }

  const seconds = Math.floor(deltaMs / 1000);
  const summaryParts: OfflineCatchupSummaryPart[] = [];

  // Cultivation gain
  const gameStore = useGameStore.getState();
  const qiPerSecond = D(gameStore.qiPerSecond ?? '0');
  const qiGain = qiPerSecond.times(seconds);
  if (qiGain.greaterThan(0)) {
    const nextQi = D(gameStore.qi ?? '0').plus(qiGain);
    useGameStore.setState({
      qi: nextQi.toString(),
      lastActiveTime: nowWall,
      lastTickTime: nowWall,
    });
    summaryParts.push({ label: 'Qi gained', value: formatNumber(qiGain) });
  }

  // Profession queues (tick timers only)
  const professionStore = useProfessionStore.getState();
  const beforeJobs =
    professionStore.alchemyQueue.length +
    professionStore.talismanQueue.length +
    professionStore.forgeQueue.length;
  professionStore.applyOffline(nowWall);
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
  expeditionStore.tick(nowWall);
  const afterComplete = expeditionStore.active.filter((run) => run.status === 'complete').length;
  const newlyCompleted = afterComplete - beforeComplete;
  if (newlyCompleted > 0) {
    summaryParts.push({ label: 'Expeditions ready', value: `${newlyCompleted}` });
  }

  const updatedState = buildDefaultSaveState();
  return {
    updatedState,
    summary: {
      offlineSeconds: seconds,
      parts: summaryParts,
    },
  };
}
