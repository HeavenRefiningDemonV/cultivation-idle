import type { PrestigeUpgradeDef } from '../../content/types.js';
import { useContentStore } from '../../stores/contentStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';

export type PrestigeAdvisorStateLabel = 'Too Early' | 'Viable' | 'Recommended';

export type SpiritRootAdvisorClassification = 'Dormant' | 'Awakened';

export type PrestigeResetPreviewBuckets = {
  resetsThisLife: string[];
  carriesForward: string[];
  rebuiltNextLife: string[];
};

export type PrestigeAdvisorRecommendedPurchase = {
  id: string;
  name: string;
  nextCost: number;
  currentLevel: number;
  maxLevel: number;
};

export type PrestigeAdvisorSurface = {
  stateLabel: PrestigeAdvisorStateLabel;
  apForecast: {
    potentialGain: number;
    breakdown: ReturnType<ReturnType<typeof usePrestigeStore.getState>['getApBreakdown']>;
  };
  resetPreview: PrestigeResetPreviewBuckets;
  spiritRootClassification: SpiritRootAdvisorClassification;
  topRecommendedPurchase: PrestigeAdvisorRecommendedPurchase | null;
};

const RECOMMENDED_AP_THRESHOLD = 10;

const RESETS_THIS_LIFE = Object.freeze([
  'Realm progress',
  'Qi and combat run state',
  'Inventory and currencies',
  'Equipment loadout',
  'Trial and ruins progress',
  'Outskirts and bounty progress',
  'Current activity',
]);

const CARRIES_FORWARD = Object.freeze([
  'Ascension Points (AP)',
  'Lifetime AP earned',
  'Purchased AP upgrades',
  'Prestige run history',
  'Prestige count',
]);

const REBUILT_NEXT_LIFE = Object.freeze([
  'Spirit root (new roll)',
  'City baseline (starter city)',
]);

const PURCHASE_STAT_PRIORITY: Readonly<Record<string, number>> = {
  idleQiMult: 3,
  combatMult: 3,
  offlineEfficiencyAdd: 2,
};

const toStateLabel = (canPrestige: boolean, potentialGain: number): PrestigeAdvisorStateLabel => {
  if (!canPrestige) {
    return 'Too Early';
  }
  if (potentialGain >= RECOMMENDED_AP_THRESHOLD) {
    return 'Recommended';
  }
  return 'Viable';
};

const getPurchaseRank = (upgrade: PrestigeUpgradeDef, nextCost: number): number => {
  const statPriority = upgrade.stat ? (PURCHASE_STAT_PRIORITY[upgrade.stat] ?? 1) : 1;
  const levelCap = Math.max(1, upgrade.maxLevel || 1);
  return statPriority * 1000 + levelCap * 10 - nextCost;
};

const buildTopRecommendedPurchase = (): PrestigeAdvisorRecommendedPurchase | null => {
  const content = useContentStore.getState();
  const prestige = usePrestigeStore.getState();
  const visibleUpgrades = content.getVisiblePrestigeUpgrades();

  const candidates = visibleUpgrades
    .map((upgrade) => {
      const currentLevel = prestige.getCurrentLevel(upgrade.id);
      const maxLevel = prestige.getMaxLevel(upgrade.id);
      const nextCost = prestige.getNextLevelCost(upgrade.id);
      const prereq = prestige.checkPrereqs(upgrade.id);
      if (!prereq.ok || nextCost === null || currentLevel >= maxLevel || nextCost > prestige.totalAP) {
        return null;
      }
      return {
        id: upgrade.id,
        name: upgrade.name,
        nextCost,
        currentLevel,
        maxLevel,
        rank: getPurchaseRank(upgrade, nextCost),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.rank - a.rank || a.nextCost - b.nextCost || a.id.localeCompare(b.id));

  if (candidates.length === 0) {
    return null;
  }

  const [top] = candidates;
  return {
    id: top.id,
    name: top.name,
    nextCost: top.nextCost,
    currentLevel: top.currentLevel,
    maxLevel: top.maxLevel,
  };
};

export const getPrestigeAdvisorSurface = (): PrestigeAdvisorSurface => {
  const prestige = usePrestigeStore.getState();
  const potentialGain = Math.max(0, prestige.calculateAPGain());
  const breakdown = prestige.getApBreakdown();

  return {
    stateLabel: toStateLabel(prestige.canPrestige(), potentialGain),
    apForecast: {
      potentialGain,
      breakdown,
    },
    resetPreview: {
      resetsThisLife: [...RESETS_THIS_LIFE],
      carriesForward: [...CARRIES_FORWARD],
      rebuiltNextLife: [...REBUILT_NEXT_LIFE],
    },
    spiritRootClassification: prestige.spiritRoot ? 'Awakened' : 'Dormant',
    topRecommendedPurchase: buildTopRecommendedPurchase(),
  };
};
