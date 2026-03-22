import type { PrestigeUpgradeDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';

export type HeartLawUnlockInfo =
  | { kind: 'starter' }
  | { kind: 'prestige'; upgradeId: string; upgradeName: string; apCost: number }
  | { kind: 'unknown' };

function getUpgradeCost(upgrade: PrestigeUpgradeDef): number {
  if (Array.isArray(upgrade.costs) && typeof upgrade.costs[0] === 'number') {
    return upgrade.costs[0];
  }
  if (Array.isArray(upgrade.tiers) && upgrade.tiers.length > 0 && typeof upgrade.tiers[0]?.cost === 'number') {
    return upgrade.tiers[0].cost;
  }
  if (upgrade.costCurve && typeof upgrade.costCurve.base === 'number') {
    return upgrade.costCurve.base;
  }
  return 0;
}

export function getHeartLawUnlockInfo(tier: string | undefined | null): HeartLawUnlockInfo {
  if (!tier || tier === 'starter') {
    return { kind: 'starter' };
  }

  try {
    const upgrades = useContentStore.getState().getVisiblePrestigeUpgrades();
    const match = upgrades.find((upgrade) => {
      const unlocks = (upgrade as { unlocks?: string[] }).unlocks;
      return Array.isArray(unlocks) && unlocks.includes(tier);
    });

    if (match) {
      return {
        kind: 'prestige',
        upgradeId: match.id,
        upgradeName: match.name ?? match.id,
        apCost: getUpgradeCost(match),
      };
    }
  } catch (error) {
    console.warn('[HeartLawUnlockInfo] Unable to derive unlock info', error);
  }

  return { kind: 'unknown' };
}
