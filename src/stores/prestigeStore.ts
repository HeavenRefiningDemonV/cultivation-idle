import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, InventoryState, SpiritRoot, SpiritRootElement, SpiritRootGrade } from '../types';
import { REALMS } from '../constants';
import { D } from '../utils/numbers';

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

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: {
    type: 'multiplier' | 'unlock' | 'flat_bonus';
    stat?: string;
    value?: number;
    valuePerLevel?: number;
  };
}

export interface PrestigeRun {
  runNumber: number;
  realmReached: number;
  apGained: number;
  timeSpent: number;
  timestamp: number;
}

interface PrestigeState {
  totalAP: number;
  lifetimeAP: number;
  currentRunAP: number;
  prestigeCount: number;
  prestigeRuns: PrestigeRun[];
  upgrades: Record<string, PrestigeUpgrade>;
  highestRealmReached: number;
  runStartTime: number;

  // Spirit root reroll tracking
  rerollCount: number;

  // Spirit root
  spiritRoot: SpiritRoot | null;

  // Methods
  calculateAPGain: () => number;
  canPrestige: () => boolean;
  performPrestige: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  getUpgradeEffect: (upgradeId: string) => number;
  updateHighestRealm: (realmIndex: number) => void;
  getQiMultiplier: () => number;
  getCombatMultiplier: () => number;
  getCultivationMultiplier: () => number;
  initializeUpgrades: () => void;

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

const createInitialPrestigeState = () => ({
  totalAP: 0,
  lifetimeAP: 0,
  currentRunAP: 0,
  prestigeCount: 0,
  prestigeRuns: [] as PrestigeRun[],
  upgrades: {} as Record<string, PrestigeUpgrade>,
  highestRealmReached: 0,
  runStartTime: Date.now(),
  rerollCount: 0,
  spiritRoot: null as SpiritRoot | null,
});

export const usePrestigeStore = create<PrestigeState>()(
  immer((set, get) => ({
    ...createInitialPrestigeState(),

    calculateAPGain: () => {
      if (!_getGameStore) return 0;
      const gameStore = _getGameStore();
      const state = get();
      const currentRealm = gameStore.realm;

      const realmIndex = Math.max(state.highestRealmReached, currentRealm?.index ?? 0);
      const realmDefinition = REALMS[realmIndex] || REALMS[0];
      const substageProgress = Math.max(
        0,
        ((currentRealm?.substage ?? 1) - 1) / Math.max(1, realmDefinition.substages)
      );

      const realmBonus = Math.max(0, realmIndex - 1) * 10; // Only award AP after Foundation
      const substageBonus = Math.floor(substageProgress * 5);

      const runTimeHours = (Date.now() - state.runStartTime) / (1000 * 60 * 60);
      const timeBonus = Math.max(0, Math.floor(runTimeHours));

      return Math.max(0, Math.floor(realmBonus + substageBonus + timeBonus));
    },

    canPrestige: () => {
      if (!_getGameStore) return false;
      const gameStore = _getGameStore();
      const currentRealm = gameStore.realm?.index || 0;
      const highestRealm = get().highestRealmReached;
      return Math.max(currentRealm, highestRealm) >= 2; // Core Formation (realm 2)
    },

    updateHighestRealm: (realmIndex: number) => {
      set((state) => {
        state.highestRealmReached = Math.max(state.highestRealmReached, realmIndex);
      });
    },

    performPrestige: () => {
      const state = get();
      if (!_getGameStore) return;
      const gameStore = _getGameStore();

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
      });

      // Trigger game reset
      gameStore.performPrestigeReset();

      // Start next run with a fresh spirit root
      get().generateSpiritRoot();
    },

    purchaseUpgrade: (upgradeId: string) => {
      const state = get();
      const upgrade = state.upgrades[upgradeId];

      if (!upgrade) return false;
      if (upgrade.currentLevel >= upgrade.maxLevel) return false;
      if (state.totalAP < upgrade.cost) return false;

      set((state) => {
        state.totalAP -= upgrade.cost;
        const upg = state.upgrades[upgradeId];
        upg.currentLevel += 1;
        upg.cost = Math.floor(upg.cost * 1.5); // Exponential cost scaling
      });

      return true;
    },

    getUpgradeEffect: (upgradeId: string) => {
      const upgrade = get().upgrades[upgradeId];
      if (!upgrade || upgrade.currentLevel === 0) return 0;

      if (upgrade.effect.type === 'multiplier' && upgrade.effect.valuePerLevel) {
        return upgrade.effect.valuePerLevel * upgrade.currentLevel;
      }

      if (upgrade.effect.type === 'flat_bonus' && upgrade.effect.value) {
        return upgrade.effect.value * upgrade.currentLevel;
      }

      return 0;
    },

    getQiMultiplier: () => {
      const idleBonus = get().getUpgradeEffect('idle_mult');
      return 1 + idleBonus;
    },

    getCombatMultiplier: () => {
      const damageBonus = get().getUpgradeEffect('damage_mult');
      const hpBonus = get().getUpgradeEffect('hp_mult');
      return 1 + damageBonus + hpBonus;
    },

    getCultivationMultiplier: () => {
      const cultivationBonus = get().getUpgradeEffect('offline_mult');
      return 1 + cultivationBonus;
    },

    initializeUpgrades: () => {
      set((state) => {
        state.upgrades = {
          root_floor: {
            id: 'root_floor',
            name: 'Spirit Root Foundation',
            description: 'Start each run with a better spirit root quality',
            cost: 50,
            maxLevel: 5,
            currentLevel: 0,
            effect: {
              type: 'flat_bonus',
              stat: 'spirit_root_floor',
              value: 1,
            },
          },
          idle_mult: {
            id: 'idle_mult',
            name: 'Cultivation Enhancement',
            description: 'Increase idle Qi generation',
            cost: 30,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'idle_rate',
              valuePerLevel: 0.1,
            },
          },
          damage_mult: {
            id: 'damage_mult',
            name: 'Martial Prowess',
            description: 'Increase damage dealt in combat',
            cost: 40,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'damage_percent',
              valuePerLevel: 0.05,
            },
          },
          hp_mult: {
            id: 'hp_mult',
            name: 'Body Tempering',
            description: 'Increase maximum HP',
            cost: 40,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'max_hp',
              valuePerLevel: 0.08,
            },
          },
          offline_mult: {
            id: 'offline_mult',
            name: 'Timeless Meditation',
            description: 'Increase offline progress efficiency',
            cost: 60,
            maxLevel: 5,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'offline_rate',
              valuePerLevel: 0.1,
            },
          },
          starter_tech: {
            id: 'starter_tech',
            name: 'Inherited Technique',
            description: 'Start with a basic combat technique',
            cost: 100,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'starter_technique',
            },
          },
          early_gear: {
            id: 'early_gear',
            name: 'Ancestral Equipment',
            description: 'Start with a basic weapon and accessory',
            cost: 80,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'starter_gear',
            },
          },
          auto_retry: {
            id: 'auto_retry',
            name: 'Persistent Will',
            description: 'Automatically retry dungeons on defeat',
            cost: 120,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'auto_retry_dungeons',
            },
          },
          dungeon_scout: {
            id: 'dungeon_scout',
            name: 'Dungeon Insight',
            description: 'Preview dungeon bosses and mechanics before entering',
            cost: 90,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'dungeon_preview',
            },
          },
          dual_path: {
            id: 'dual_path',
            name: 'Dual Cultivation',
            description: 'Unlock the ability to cultivate two paths simultaneously (LOCKED)',
            cost: 500,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'dual_path',
            },
          },
        };
      });
    },

    /**
     * Generate a new spirit root based on prestige upgrades
     */
    generateSpiritRoot: (resetRerollCount = true) => {
      const state = get();
      const floor = state.getUpgradeEffect('root_floor');

      // Quality roll (1-5: Mortal, Common, Uncommon, Rare, Legendary)
      // Base: 60% Mortal, 25% Common, 10% Uncommon, 4% Rare, 1% Legendary
      const qualityRoll = Math.random();
      let grade: SpiritRootGrade = 1;

      if (qualityRoll < 0.01) grade = 5; // Legendary - 1%
      else if (qualityRoll < 0.05) grade = 4; // Rare - 4%
      else if (qualityRoll < 0.15) grade = 3; // Uncommon - 10%
      else if (qualityRoll < 0.40) grade = 2; // Common - 25%
      else grade = 1; // Mortal - 60%

      // Apply floor (minimum quality from prestige)
      grade = Math.max(grade, Math.min(floor, 5)) as SpiritRootGrade;

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

      // Check if player has enough gold
      if (D(inventoryStore.gold).lt(cost)) {
        console.log(`[SpiritRoot] Not enough gold to reroll (need ${cost})`);
        return false;
      }

      // Deduct gold
      if (!inventoryStore.removeGold(cost.toString())) {
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
     * Get quality multiplier (1.0 to 2.6)
     * Grade 1 = 1.0x, Grade 2 = 1.4x, Grade 3 = 1.8x, Grade 4 = 2.2x, Grade 5 = 2.6x
     */
    getSpiritRootQualityMultiplier: () => {
      const state = get();
      if (!state.spiritRoot) return 1.0;
      return 1.0 + (state.spiritRoot.grade - 1) * 0.4;
    },

    /**
     * Get purity multiplier (1.0 to 2.0)
     */
    getSpiritRootPurityMultiplier: () => {
      const state = get();
      if (!state.spiritRoot) return 1.0;
      return 1.0 + state.spiritRoot.purity / 100;
    },

    /**
     * Get total spirit root multiplier (quality * purity)
     */
    getSpiritRootTotalMultiplier: () => {
      const state = get();
      return state.getSpiritRootQualityMultiplier() * state.getSpiritRootPurityMultiplier();
    },

    hardResetPrestige: () => {
      set((state) => {
        Object.assign(state, createInitialPrestigeState());
      });
      get().initializeUpgrades();
    },
  }))
);
