import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, InventoryState, SpiritRoot, SpiritRootElement, SpiritRootGrade } from '../types/index.js';
import { SaveService } from '../services/save/SaveService.js';
import { GameEvents } from '../services/events/GameEvents.js';
import { useContentStore } from './contentStore.js';
import type { PrestigeUpgradeDef } from '../content/index.js';
import { PRESTIGE_TARGETS } from '../systems/balance/prestigeTargets.js';
import { recomputeAndApplyPrestigeUnlocks } from '../systems/prestige/applyPrestigeEffects.js';
import {
  canPurchasePrestigeNode,
  getPrestigeNodeRuntimeStatus,
  isPrestigeNodeVisible,
} from '../systems/prestige/runtime/prestigeRuntimeCatalog.js';
import type { PrestigeLifeSummarySnapshot } from '../features/prestige/lifeSummarySurface.js';
import { useTrialStore } from './trialStore.js';
import {
  buildPrestigeApBreakdownRows,
  buildPrestigeProgressionSnapshot,
  calculatePrestigeApForecast,
  countResolvedSemesterGateTrials,
  extractLiveTrialIds,
  resolvePrestigeAdvisorLabel,
} from '../systems/prestige/prestigeApReadModel.js';
import {
  clampSpiritRootPurity,
  getSpiritRootRuntimeMultiplier,
} from '../systems/doctrine/spiritRootDoctrine.js';

/**
 * Lazy getter for game store to avoid circular dependency
 */
let _getGameStore: (() => GameState) | null = null;
export function setGameStoreGetter(getter: () => GameState) {
  _getGameStore = getter;
}

/**
 * Lazy getter for inventory store to avoid circular dependency
 */
let _getInventoryStore: (() => InventoryState) | null = null;
export function setInventoryStoreGetter(getter: () => InventoryState) {
  _getInventoryStore = getter;
}

type ApBreakdownState = {
  totalAP: number;
  lifetimeAP: number;
  prestigeCount: number;
  highestRealmReached: number;
  runStartTime: number;
};

const buildApBreakdown = (state: ApBreakdownState, gameStore: GameState | null): ApBreakdown => {
  if (!gameStore) {
    return {
      availableNow: state.totalAP,
      totalEarned: state.lifetimeAP,
      reincarnations: state.prestigeCount,
      potentialGain: 0,
      rows: [
        {
          key: 'unavailable',
          label: 'Breakdown unavailable',
          value: 0,
          hint: 'Load into a run to calculate potential gains.',
        },
      ],
    };
  }

  const trialProgressById = useTrialStore.getState().progressByTrialId;
  const liveTrialIds = extractLiveTrialIds(useContentStore.getState().raw?.trials);
  const resolvedGateCount = countResolvedSemesterGateTrials({
    progressByTrialId: trialProgressById,
    liveTrialIds,
  });
  const snapshot = buildPrestigeProgressionSnapshot({
    currentRealmIndex: gameStore.realm?.index ?? 0,
    currentSubstage: gameStore.realm?.substage ?? 1,
    highestRealmReached: state.highestRealmReached,
    resolvedGateCount,
  });
  const forecast = calculatePrestigeApForecast(snapshot);
  const potentialGain = forecast.totalAp;

  return {
    availableNow: state.totalAP,
    totalEarned: state.lifetimeAP,
    reincarnations: state.prestigeCount,
    potentialGain,
    rows: buildPrestigeApBreakdownRows(forecast),
  };
};

export interface PrestigeRun {
  runNumber: number;
  realmReached: number;
  apGained: number;
  timeSpent: number;
  timestamp: number;
}

export type ApBreakdownRow = {
  key: string;
  label: string;
  value: number;
  hint?: string;
};

export type ApBreakdown = {
  availableNow: number;
  totalEarned: number;
  reincarnations: number;
  potentialGain: number;
  rows: ApBreakdownRow[];
};

interface PrestigeState {
  totalAP: number;
  lifetimeAP: number;
  currentRunAP: number;
  prestigeCount: number;
  prestigeRuns: PrestigeRun[];
  purchasesById: Record<string, number>;
  highestRealmReached: number;
  runStartTime: number;

  // Spirit root reroll tracking
  rerollCount: number;

  // Spirit root
  spiritRoot: SpiritRoot | null;
  lastLifeSummary: PrestigeLifeSummarySnapshot | null;

  // Methods
  calculateAPGain: () => number;
  getApBreakdown: () => ApBreakdown;
  canPrestige: () => boolean;
  performPrestige: (preparedLifeSummary?: PrestigeLifeSummarySnapshot) => void;
  purchaseUpgrade: (upgradeId: string) => { ok: boolean; reason?: string };
  getUpgradeEffect: (upgradeId: string) => number;
  getUpgradeDef: (upgradeId: string) => PrestigeUpgradeDef | undefined;
  getCurrentLevel: (upgradeId: string) => number;
  getMaxLevel: (upgradeId: string) => number;
  getNextLevelCost: (upgradeId: string) => number | null;
  checkPrereqs: (upgradeId: string) => { ok: boolean; reason?: string };
  updateHighestRealm: (realmIndex: number) => void;
  getQiMultiplier: () => number;
  getCombatMultiplier: () => number;
  getOfflineEfficiencyMultiplier: () => number;
  getOfflineEfficiencyBonusAdditive: () => number;
  initializeUpgrades: () => void;
  getUpgradeEffectByStat: (stat: string) => number;

  // Spirit root methods
  generateSpiritRoot: (resetRerollCount?: boolean) => void;
  getSpiritRootRerollCost: () => number;
  rerollSpiritRoot: () => boolean;
  getSpiritRootQualityMultiplier: () => number;
  getSpiritRootPurityMultiplier: () => number;
  getSpiritRootTotalMultiplier: () => number;
  hardResetPrestige: () => void;
}

/**
 * Spirit root quality names
 */
const QUALITY_NAMES = ['', 'Mortal', 'Common', 'Uncommon', 'Rare', 'Legendary'];

/**
 * Available elements
 */
const ELEMENTS: SpiritRootElement[] = ['fire', 'water', 'earth', 'metal', 'wood'];

export function getSpiritRootQualityMultiplierForGrade(grade: SpiritRootGrade): number {
  const normalizedGrade = Math.max(1, Math.min(5, grade));
  return 1 + ((normalizedGrade - 1) / 4) * 0.08;
}

export function getSpiritRootPurityMultiplierForPurity(purity: number): number {
  return 1 + (clampSpiritRootPurity(purity) / 100) * 0.04;
}

export function getSpiritRootTotalMultiplierForRoot(root: SpiritRoot | null): number {
  if (!root) {
    return 1.0;
  }

  return getSpiritRootRuntimeMultiplier(root);
}

const createInitialPrestigeState = () => ({
  totalAP: 0,
  lifetimeAP: 0,
  currentRunAP: 0,
  prestigeCount: 0,
  prestigeRuns: [] as PrestigeRun[],
  purchasesById: {} as Record<string, number>,
  highestRealmReached: 0,
  runStartTime: Date.now(),
  rerollCount: 0,
  spiritRoot: null as SpiritRoot | null,
  lastLifeSummary: null as PrestigeLifeSummarySnapshot | null,
});

function getUpgradesFromContent(): PrestigeUpgradeDef[] {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw?.prestige_store) return [];
  return content.raw.prestige_store.upgrades ?? [];
}

function getUpgradeById(id: string): PrestigeUpgradeDef | undefined {
  return getUpgradesFromContent().find((upgrade) => upgrade.id === id);
}

function getUpgradeCostFromDef(def: PrestigeUpgradeDef, nextLevel: number): number | null {
  if (nextLevel < 1 || nextLevel > def.maxLevel) return null;
  const index = nextLevel - 1;
  if (def.costs && def.costs[index] !== undefined) return def.costs[index];
  if (def.tiers && def.tiers[index]) return def.tiers[index].cost;
  if (def.costCurve) {
    const cost = def.costCurve.base * Math.pow(def.costCurve.mult, index);
    if (def.costCurve.round && def.costCurve.round > 0) {
      return Math.round(cost / def.costCurve.round) * def.costCurve.round;
    }
    return Math.round(cost);
  }
  return null;
}

export const usePrestigeStore = create<PrestigeState>()(
  immer((set, get) => ({
    ...createInitialPrestigeState(),

    calculateAPGain: () => {
      const state = get();
      const gameStore = _getGameStore ? _getGameStore() : null;
      return buildApBreakdown(state, gameStore).potentialGain;
    },

    getApBreakdown: () => {
      const state = get();
      const gameStore = _getGameStore ? _getGameStore() : null;
      return buildApBreakdown(state, gameStore);
    },

    canPrestige: () => {
      if (!_getGameStore) {
        console.warn('[Prestige] Game store getter not initialized');
        return false;
      }
      const gameStore = _getGameStore();
      const currentRealm = gameStore.realm?.index || 0;
      const highestRealm = get().highestRealmReached;
      return Math.max(currentRealm, highestRealm) >= PRESTIGE_TARGETS.unlock.unlockRealmIndex;
    },

    updateHighestRealm: (realmIndex: number) => {
      set((state) => {
        state.highestRealmReached = Math.max(state.highestRealmReached, realmIndex);
      });
    },

    performPrestige: (preparedLifeSummary) => {
      const state = get();
      if (!_getGameStore) {
        console.warn('[Prestige] Game store getter not initialized - cannot prestige');
        return;
      }
      const gameStore = _getGameStore();
      const trialProgressById = useTrialStore.getState().progressByTrialId;
      const liveTrialIds = extractLiveTrialIds(useContentStore.getState().raw?.trials);
      const resolvedGateCount = countResolvedSemesterGateTrials({
        progressByTrialId: trialProgressById,
        liveTrialIds,
      });
      const fallbackForecast = calculatePrestigeApForecast(
        buildPrestigeProgressionSnapshot({
          currentRealmIndex: gameStore.realm?.index ?? 0,
          currentSubstage: gameStore.realm?.substage ?? 1,
          highestRealmReached: state.highestRealmReached,
          resolvedGateCount,
        }),
      );
      const lifeSummarySnapshot: PrestigeLifeSummarySnapshot = preparedLifeSummary ?? {
        capturedAt: Date.now(),
        advisorLabel: resolvePrestigeAdvisorLabel(fallbackForecast),
        apForecastGain: fallbackForecast.totalAp,
        apAfterRitual: state.totalAP + fallbackForecast.totalAp,
        blocks: [
          { key: 'life_arc', title: 'Life Arc', lines: ['Life summary was captured from runtime fallback.'] },
          { key: 'doctrine_build', title: 'Doctrine & Build', lines: ['Doctrine details were not captured for this ritual call.'] },
          { key: 'world_progress', title: 'World Progress', lines: ['World progress details were not captured for this ritual call.'] },
          { key: 'gate_trials', title: 'Gate Trials', lines: ['Gate-trial details were not captured for this ritual call.'] },
          { key: 'ruins_supply', title: 'Ruins & Supply', lines: ['Ruins and supply details were not captured for this ritual call.'] },
          { key: 'next_life_focus', title: 'Next Life Focus', lines: ['Open the live Life Summary panel for full guidance.'] },
        ],
      };

      if (!state.canPrestige()) return;

      const trackedRealm = Math.max(state.highestRealmReached, gameStore.realm?.index || 0);
      const apGained = Math.max(0, state.calculateAPGain());
      const runTime = (Date.now() - state.runStartTime) / 1000;

      const newRun: PrestigeRun = {
        runNumber: state.prestigeCount + 1,
        realmReached: trackedRealm,
        apGained,
        timeSpent: runTime,
        timestamp: Date.now(),
      };

      set((state) => {
        state.totalAP += apGained;
        state.lifetimeAP += apGained;
        state.currentRunAP = 0;
        state.prestigeCount += 1;
        state.prestigeRuns = [...state.prestigeRuns, newRun].slice(-10); // Keep last 10 runs
        state.highestRealmReached = 0;
        state.runStartTime = Date.now();
        state.lastLifeSummary = lifeSummarySnapshot;
      });
      GameEvents.emit({
        type: 'prestige/performed',
        payload: {
          timestamp: Date.now(),
          apGained,
          totalAPAfter: get().totalAP,
          realmReached: trackedRealm,
          resolvedGateCount,
          timeSpentSec: runTime,
          advisorLabel: lifeSummarySnapshot.advisorLabel,
        },
      });

      // Trigger game reset
      gameStore.performPrestigeReset();

      // Start next run with a fresh spirit root
      get().generateSpiritRoot();

      // Persist progress immediately so prestige isn't lost on refresh
      try {
      SaveService.save();
      } catch (error) {
        console.warn('[Prestige] Failed to save after prestige', error);
      }
    },

    getUpgradeDef: (upgradeId) => getUpgradeById(upgradeId),

    getCurrentLevel: (upgradeId) => {
      return get().purchasesById[upgradeId] ?? 0;
    },

    getMaxLevel: (upgradeId) => {
      const def = getUpgradeById(upgradeId);
      return def?.maxLevel ?? 0;
    },

    getNextLevelCost: (upgradeId) => {
      const def = getUpgradeById(upgradeId);
      if (!def) return null;
      const current = get().purchasesById[upgradeId] ?? 0;
      if (current >= def.maxLevel) return null;
      return getUpgradeCostFromDef(def, current + 1);
    },

    checkPrereqs: (upgradeId) => {
      const def = getUpgradeById(upgradeId);
      if (!def) return { ok: false, reason: 'Upgrade not found' };
      const runtimeCheck = canPurchasePrestigeNode(upgradeId, useContentStore.getState().raw);
      if (!runtimeCheck.ok) return runtimeCheck;
      const prereqs = def.prereq ?? [];
      for (const prereq of prereqs) {
        const prereqRuntimeStatus = getPrestigeNodeRuntimeStatus(prereq.upgradeId, useContentStore.getState().raw);
        if (prereqRuntimeStatus !== 'visible_live') {
          return { ok: false, reason: 'Upgrade is not available in the current live prestige tree' };
        }
        const current = get().purchasesById[prereq.upgradeId] ?? 0;
        if (current < prereq.minLevel) {
          const prereqDef = getUpgradeById(prereq.upgradeId);
          const name = prereqDef?.name ?? prereq.upgradeId;
          return { ok: false, reason: `Requires ${name} Lv ${prereq.minLevel}` };
        }
      }
      return { ok: true };
    },

    purchaseUpgrade: (upgradeId) => {
      const def = getUpgradeById(upgradeId);
      if (!def) return { ok: false, reason: 'Upgrade not found' };
      const runtimeCheck = canPurchasePrestigeNode(upgradeId, useContentStore.getState().raw);
      if (!runtimeCheck.ok) return runtimeCheck;

      const current = get().purchasesById[upgradeId] ?? 0;
      if (current >= def.maxLevel) return { ok: false, reason: 'Already maxed' };

      const prereqCheck = get().checkPrereqs(upgradeId);
      if (!prereqCheck.ok) return prereqCheck;

      const cost = getUpgradeCostFromDef(def, current + 1);
      if (cost === null) return { ok: false, reason: 'Cost unavailable' };

      if (get().totalAP < cost) return { ok: false, reason: 'Not enough AP' };

      set((state) => {
        state.totalAP -= cost;
        state.purchasesById[upgradeId] = current + 1;
      });
      GameEvents.emit({
        type: 'prestige/upgrade_purchased',
        payload: {
          timestamp: Date.now(),
          upgradeId,
          nextLevel: current + 1,
          apCost: cost,
          remainingAP: get().totalAP,
        },
      });

      recomputeAndApplyPrestigeUnlocks(get().purchasesById);
      return { ok: true };
    },

    getUpgradeEffect: (upgradeId: string) => {
      const def = getUpgradeById(upgradeId);
      if (!def) return 0;
      const current = get().purchasesById[upgradeId] ?? 0;
      if (current <= 0) return 0;

      if (def.type === 'multiplier' && typeof def.effectPerLevel === 'number') {
        return def.effectPerLevel * current;
      }

      if (def.type === 'multilevel' && typeof def.effectPerLevel === 'number') {
        return def.effectPerLevel * current;
      }

      return 0;
    },

    getUpgradeEffectByStat: (stat: string) => {
      let total = 0;
      getUpgradesFromContent().forEach((def) => {
        if (!isPrestigeNodeVisible(def.id, useContentStore.getState().raw)) return;
        if (def.stat !== stat) return;
        const current = get().purchasesById[def.id] ?? 0;
        if (current <= 0) return;
        if (typeof def.effectPerLevel === 'number') {
          total += def.effectPerLevel * current;
        }
      });
      return total;
    },

    getQiMultiplier: () => {
      const idleBonus = get().getUpgradeEffectByStat('idleQiMult');
      return 1 + idleBonus;
    },

    getCombatMultiplier: () => {
      const damageBonus = get().getUpgradeEffectByStat('combatMult');
      return 1 + damageBonus;
    },

    getOfflineEfficiencyMultiplier: () => {
      return 1 + get().getOfflineEfficiencyBonusAdditive();
    },

    getOfflineEfficiencyBonusAdditive: () => {
      return get().getUpgradeEffectByStat('offlineEfficiencyAdd');
    },

    initializeUpgrades: () => {
      set((state) => {
        if (!state.purchasesById) {
          state.purchasesById = {};
        }
      });
    },

    /**
     * Generate a new spirit root based on prestige upgrades
     */
    generateSpiritRoot: (resetRerollCount = true) => {
      // Quality roll (1-5: Mortal, Common, Uncommon, Rare, Legendary)
      // Base: 60% Mortal, 25% Common, 10% Uncommon, 4% Rare, 1% Legendary
      const qualityRoll = Math.random();
      let grade: SpiritRootGrade = 1;

      if (qualityRoll < 0.01) grade = 5; // Legendary - 1%
      else if (qualityRoll < 0.05) grade = 4; // Rare - 4%
      else if (qualityRoll < 0.15) grade = 3; // Uncommon - 10%
      else if (qualityRoll < 0.40) grade = 2; // Common - 25%
      else grade = 1; // Mortal - 60%

      // Element roll (equal chances)
      const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];

      // Purity roll (30-100, bell curve weighted towards middle-high)
      const purity = Math.floor(
        30 + Math.random() * 35 + Math.random() * 35
      );

      set((state) => {
        state.spiritRoot = { grade, element, purity };
        if (resetRerollCount) {
          state.rerollCount = 0;
        }
      });

      console.log(`[SpiritRoot] Generated: ${QUALITY_NAMES[grade]} ${element} (${purity}% purity)`);

      // Recalculate player stats with new spirit root
      if (_getGameStore) {
        const gameStore = _getGameStore();
        gameStore.calculatePlayerStats();
        gameStore.calculateQiPerSecond();
      }
    },

    /**
     * Reroll spirit root using gold
     * Cost scales with current quality
     */
    getSpiritRootRerollCost: () => {
      const state = get();
      if (!state.spiritRoot) return 0;

      const baseCost = 1000 * Math.pow(2, state.spiritRoot.grade - 1);
      return baseCost * Math.pow(2, state.rerollCount);
    },

    rerollSpiritRoot: () => {
      const state = get();
      if (!state.spiritRoot || !_getInventoryStore) return false;

      // Cost scales with grade and reroll attempts
      const cost = state.getSpiritRootRerollCost();
      const inventoryStore = _getInventoryStore();

      const costStr = cost.toString();

      // Check if player has enough gold
      if (!inventoryStore.canAffordCurrency({ gold: costStr })) {
        console.log(`[SpiritRoot] Not enough gold to reroll (need ${cost})`);
        return false;
      }

      // Deduct gold
      if (!inventoryStore.spendCurrency('gold', costStr)) {
        return false;
      }

      set((state) => {
        state.rerollCount += 1;
      });

      // Generate new spirit root without resetting reroll count
      get().generateSpiritRoot(false);
      console.log(`[SpiritRoot] Rerolled for ${cost} gold`);

      return true;
    },

    /**
     * Legacy helper retained for compatibility; now bounded to packet D.4 scale.
     */
    getSpiritRootQualityMultiplier: () => {
      const state = get();
      if (!state.spiritRoot) return 1.0;
      return getSpiritRootQualityMultiplierForGrade(state.spiritRoot.grade);
    },

    /**
     * Legacy helper retained for compatibility; now bounded to packet D.4 scale.
     */
    getSpiritRootPurityMultiplier: () => {
      const state = get();
      if (!state.spiritRoot) return 1.0;
      return getSpiritRootPurityMultiplierForPurity(state.spiritRoot.purity);
    },

    /**
     * Canonical bounded direct runtime multiplier for spirit root.
     */
    getSpiritRootTotalMultiplier: () => {
      const state = get();
      return getSpiritRootTotalMultiplierForRoot(state.spiritRoot);
    },

    hardResetPrestige: () => {
      set((state) => {
        Object.assign(state, createInitialPrestigeState());
      });
      get().initializeUpgrades();
    },
  }))
);

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  const devWindow = window as typeof window & {
    devPrestigeBuyFirst?: () => { ok: boolean; reason?: string };
  };
  devWindow.devPrestigeBuyFirst = () => {
    const upgrades = getUpgradesFromContent();
    const first = upgrades[0];
    if (!first) {
      return { ok: false, reason: 'No upgrades available' };
    }
    return usePrestigeStore.getState().purchaseUpgrade(first.id);
  };
}
