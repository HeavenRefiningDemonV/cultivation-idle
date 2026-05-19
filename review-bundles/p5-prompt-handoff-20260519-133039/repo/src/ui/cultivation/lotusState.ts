export type QiLotusState = 'idle' | 'active' | 'ready';

type LotusStateInput = {
  breakthroughReady: boolean;
  activityType: string | null;
  qiPerSecond: string;
};

export function deriveQiLotusState({ breakthroughReady, activityType, qiPerSecond }: LotusStateInput): QiLotusState {
  if (breakthroughReady) return 'ready';
  if (activityType !== 'meditate') return 'idle';
  const flowRate = Number.parseFloat(qiPerSecond);
  return Number.isFinite(flowRate) && flowRate > 0 ? 'active' : 'idle';
}
