export type QiLotusState = 'dormant' | 'flowing' | 'blooming' | 'ready';

type LotusStateInput = {
  breakthroughReady: boolean;
  activityType: string | null;
  qiPerSecond: string;
};

export function deriveQiLotusState({ breakthroughReady, activityType, qiPerSecond }: LotusStateInput): QiLotusState {
  if (breakthroughReady) return 'ready';
  if (activityType !== 'meditate') return 'dormant';
  const flowRate = Number.parseFloat(qiPerSecond);
  if (Number.isFinite(flowRate) && flowRate >= 25) return 'blooming';
  return 'flowing';
}
