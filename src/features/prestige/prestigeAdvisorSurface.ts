import type { PrestigeUpgradeDef } from '../../content/types.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import {
  buildPrestigeProgressionSnapshot,
  calculatePrestigeApForecast,
  countResolvedSemesterGateTrials,
  extractLiveTrialIds,
  resolvePrestigeAdvisorLabel,
} from '../../systems/prestige/prestigeApReadModel.js';
import { PRESTIGE_CATEGORIES, getPrestigeCategoryKey } from './prestigeCategories.js';

export type PrestigeAdvisorStateLabel = 'Too Early' | 'Viable' | 'Recommended';

export type SpiritRootAdvisorClassification = 'Dormant' | 'Awakened';

export type PrestigeResetPreviewBuckets = {
  resetsThisLife: string[];
  carriesForward: string[];
  rebuiltNextLife: string[];
};

export type PrestigeAdvisorRecommendedPurchase = {
  mode: 'buy_now' | 'save_for_next';
  id: string;
  name: string;
  categoryLabel: string;
  nextCost: number;
  currentLevel: number;
  maxLevel: number;
  affordabilityLabel: string;
  reasonLine: string;
};

export type PrestigeAdvisorSurface = {
  stateLabel: PrestigeAdvisorStateLabel;
  stateDetail: string;
  apForecast: {
    potentialGain: number;
    breakdown: ReturnType<ReturnType<typeof usePrestigeStore.getState>['getApBreakdown']>;
  };
  resetPreview: PrestigeResetPreviewBuckets;
  spiritRootClassification: SpiritRootAdvisorClassification;
  topRecommendedPurchase: PrestigeAdvisorRecommendedPurchase | null;
};

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

const getPurchaseRank = (upgrade: PrestigeUpgradeDef, nextCost: number): number => {
  const statPriority = upgrade.stat ? (PURCHASE_STAT_PRIORITY[upgrade.stat] ?? 1) : 1;
  const levelCap = Math.max(1, upgrade.maxLevel || 1);
  return statPriority * 1000 + levelCap * 10 - nextCost;
};

const getAdvisorDetail = (stateLabel: PrestigeAdvisorStateLabel): string => {
  if (stateLabel === 'Too Early') {
    return 'Push this life to Core Formation before beginning Reincarnation.';
  }
  if (stateLabel === 'Viable') {
    return 'Reincarnation is available now, but later milestones can improve long-term value.';
  }
  return 'This life is at a strong reset point; begin a new life to reclaim earlier progress faster.';
};

const getReasonLine = (upgrade: PrestigeUpgradeDef): string => {
  if (upgrade.stat === 'idleQiMult') return 'Raises baseline Qi flow for every future life.';
  if (upgrade.stat === 'combatMult') return 'Improves combat throughput across all runs.';
  if (upgrade.stat === 'offlineEfficiencyAdd') return 'Improves offline cultivation efficiency.';
  return 'Strengthens permanent progression for future lives.';
};

const getCategoryLabel = (upgradeId: string): string => {
  const key = getPrestigeCategoryKey(upgradeId);
  return PRESTIGE_CATEGORIES.find((category) => category.key === key)?.title ?? 'Decree';
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
      if (!prereq.ok || nextCost === null || currentLevel >= maxLevel) {
        return null;
      }
      const affordableNow = nextCost <= prestige.totalAP;
      return {
        id: upgrade.id,
        name: upgrade.name,
        categoryLabel: getCategoryLabel(upgrade.id),
        nextCost,
        currentLevel,
        maxLevel,
        affordableNow,
        rank: getPurchaseRank(upgrade, nextCost) + (affordableNow ? 50 : 0),
        reasonLine: getReasonLine(upgrade),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.rank - a.rank || a.nextCost - b.nextCost || a.id.localeCompare(b.id));

  if (candidates.length === 0) {
    return null;
  }

  const [top] = candidates;
  return {
    mode: top.affordableNow ? 'buy_now' : 'save_for_next',
    id: top.id,
    name: top.name,
    categoryLabel: top.categoryLabel,
    nextCost: top.nextCost,
    currentLevel: top.currentLevel,
    maxLevel: top.maxLevel,
    affordabilityLabel: top.affordableNow ? 'Affordable now' : 'Save for next ritual',
    reasonLine: top.reasonLine,
  };
};

export const getPrestigeAdvisorSurface = (): PrestigeAdvisorSurface => {
  const prestige = usePrestigeStore.getState();
  const game = useGameStore.getState();
  const trialProgressById = useTrialStore.getState().progressByTrialId;
  const liveTrialIds = extractLiveTrialIds(useContentStore.getState().raw?.trials);
  const resolvedGateCount = countResolvedSemesterGateTrials({ progressByTrialId: trialProgressById, liveTrialIds });
  const forecast = calculatePrestigeApForecast(buildPrestigeProgressionSnapshot({
    currentRealmIndex: game.realm?.index ?? 0,
    currentSubstage: game.realm?.substage ?? 1,
    highestRealmReached: prestige.highestRealmReached,
    resolvedGateCount,
  }));
  const potentialGain = Math.max(0, forecast.totalAp);
  const breakdown = prestige.getApBreakdown();
  const stateLabel = resolvePrestigeAdvisorLabel(forecast);

  return {
    stateLabel,
    stateDetail: getAdvisorDetail(stateLabel),
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
