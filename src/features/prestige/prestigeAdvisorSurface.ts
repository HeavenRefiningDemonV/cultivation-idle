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
import { buildPrestigeStarterSpendPlan } from '../../systems/prestige/prestigeStarterSpendPlanner.js';
import { getPrestigeResetContractSurface } from '../../services/prestige/PrestigeResetContract.js';

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

const getAdvisorDetail = (stateLabel: PrestigeAdvisorStateLabel): string => {
  if (stateLabel === 'Too Early') {
    return 'Push this life to Core Formation before beginning Reincarnation.';
  }
  if (stateLabel === 'Viable') {
    return 'Reincarnation is available now, but later milestones can improve long-term value.';
  }
  return 'This life is at a strong reset point; begin a new life to reclaim earlier progress faster.';
};


const getCategoryLabel = (upgradeId: string, contentCategory?: string | null): string => {
  const key = getPrestigeCategoryKey(upgradeId, contentCategory);
  return PRESTIGE_CATEGORIES.find((category) => category.key === key)?.title ?? 'Decree';
};

const buildTopRecommendedPurchase = (): PrestigeAdvisorRecommendedPurchase | null => {
  const content = useContentStore.getState();
  const prestige = usePrestigeStore.getState();
  const visibleUpgrades = content.getVisiblePrestigeUpgrades();

  const plan = buildPrestigeStarterSpendPlan({
    apBudget: prestige.totalAP,
    purchasedLevels: prestige.purchasesById,
    visibleUpgrades,
  });
  const top = plan.topRecommendation;
  if (!top) return null;

  const topDef = visibleUpgrades.find((upgrade) => upgrade.id === top.id);
  const affordableNow = top.nextCost <= prestige.totalAP;
  return {
    mode: affordableNow ? 'buy_now' : 'save_for_next',
    id: top.id,
    name: top.name,
    categoryLabel: getCategoryLabel(top.id, topDef?.category),
    nextCost: top.nextCost,
    currentLevel: top.currentLevel,
    maxLevel: top.maxLevel,
    affordabilityLabel: affordableNow ? 'Affordable now' : 'Save for next ritual',
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
  const resetContract = getPrestigeResetContractSurface({ purchasesById: prestige.purchasesById });

  return {
    stateLabel,
    stateDetail: getAdvisorDetail(stateLabel),
    apForecast: {
      potentialGain,
      breakdown,
    },
    resetPreview: {
      resetsThisLife: resetContract.reset.map((line) => line.label),
      carriesForward: resetContract.carry.map((line) => line.label),
      rebuiltNextLife: resetContract.rebuilt.map((line) => line.label),
    },
    spiritRootClassification: prestige.spiritRoot ? 'Awakened' : 'Dormant',
    topRecommendedPurchase: buildTopRecommendedPurchase(),
  };
};
