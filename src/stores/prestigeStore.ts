import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState } from '../types';

/**
 * Lazy getter for game store to avoid circular dependency
 */
let _getGameStore: (() => GameState) | null = null;
export function setGameStoreGetter(getter: () => GameState) {
  _getGameStore = getter;
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

  calculateAPGain: () => number;
  canPrestige: () => boolean;
  performPrestige: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  getUpgradeEffect: (upgradeId: string) => number;
  initializeUpgrades: () => void;
}

export const usePrestigeStore = create<PrestigeState>()(
  immer((set, get) => ({
    totalAP: 0,
    lifetimeAP: 0,
    currentRunAP: 0,
    prestigeCount: 0,
    prestigeRuns: [],
    upgrades: {},

    calculateAPGain: () => {
      if (!_getGameStore) return 0;
      const gameStore = _getGameStore();
      const currentRealm = gameStore.realm?.index || 0;

      // Exponential realm bonus
      const realmBonus = Math.pow(2, currentRealm) * 30;

      // Time bonus (logarithmic to prevent idle farming)
      const runStartTime = gameStore.runStartTime || Date.now();
      const runTimeHours = (Date.now() - runStartTime) / (1000 * 60 * 60);
      const timeBonus = Math.floor(Math.log(runTimeHours + 1) * 10);

      return Math.floor(realmBonus + timeBonus);
    },

    canPrestige: () => {
      if (!_getGameStore) return false;
      const gameStore = _getGameStore();
      const currentRealm = gameStore.realm?.index || 0;
      return currentRealm >= 2; // Core Formation (realm 2)
    },

    performPrestige: () => {
      const state = get();
      if (!_getGameStore) return;
      const gameStore = _getGameStore();

      if (!state.canPrestige()) return;

      const apGained = state.calculateAPGain();
      const runStartTime = gameStore.runStartTime || Date.now();
      const runTime = (Date.now() - runStartTime) / 1000;
      const currentRealm = gameStore.realm?.index || 0;

      const newRun: PrestigeRun = {
        runNumber: state.prestigeCount + 1,
        realmReached: currentRealm,
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
      });

      // Trigger game reset
      gameStore.performPrestigeReset();
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
  }))
);
