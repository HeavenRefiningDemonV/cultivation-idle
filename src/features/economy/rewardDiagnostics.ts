import { D } from '../../utils/numbers';

export type RewardDiagnosticEvent = {
  activityType: 'zone' | 'zoneBoss' | 'dungeon';
  activityId: string;
  rawGold: string;
  awardedItemIds: string[];
  estimatedSellValue: string;
  isFirstClear: boolean;
  durationSec: number;
  timestamp: number;
};

const diagnostics: RewardDiagnosticEvent[] = [];

export function recordRewardDiagnosticEvent(event: RewardDiagnosticEvent): void {
  diagnostics.push(event);
  if (diagnostics.length > 500) diagnostics.shift();
}

export function resetRewardDiagnostics(): void {
  diagnostics.length = 0;
}

export function getRewardDiagnosticsSnapshot() {
  const totals = diagnostics.reduce(
    (acc, event) => {
      acc.rawGold = D(acc.rawGold).plus(event.rawGold).toString();
      acc.sellValue = D(acc.sellValue).plus(event.estimatedSellValue).toString();
      acc.supportItems += event.awardedItemIds.filter((id) => id.includes('pill') || id.includes('stone')).length;
      acc.gearAnchors += event.awardedItemIds.filter((id) =>
        ['fang', 'silk', 'core', 'scale', 'jade', 'essence', 'sac', 'claw', 'ore', 'pelt', 'hide'].some((k) => id.includes(k))
      ).length;
      if (event.activityType === 'dungeon') {
        if (event.isFirstClear) {
          acc.dungeon.firstClearGold = D(acc.dungeon.firstClearGold).plus(event.rawGold).toString();
        } else {
          acc.dungeon.repeatGold = D(acc.dungeon.repeatGold).plus(event.rawGold).toString();
        }
      }
      return acc;
    },
    {
      totalEvents: diagnostics.length,
      rawGold: '0',
      sellValue: '0',
      supportItems: 0,
      gearAnchors: 0,
      dungeon: { firstClearGold: '0', repeatGold: '0' },
    }
  );

  return {
    ...totals,
    recentEvents: diagnostics.slice(-25),
  };
}
