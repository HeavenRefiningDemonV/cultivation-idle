import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PrestigeState, SpiritRoot } from '../types';
import { useGameStore, setPrestigeStoreGetter } from './gameStore';
import { D, add } from '../utils/numbers';
import {
  PRESTIGE_AP_BASE,
  PRESTIGE_AP_PER_REALM,
  PRESTIGE_AP_PER_BOSS,
  PRESTIGE_AP_TIME_BONUS_BASE,
  PRESTIGE_AP_TIME_BONUS_DECAY,
  PRESTIGE_AP_AURA_DIVISOR,
  SPIRIT_ROOT_MULTIPLIERS,
} from '../constants';

/**
 * Prestige store managing rebirth, spirit roots, and AP upgrades
 */
export const usePrestigeStore = create<PrestigeState>()(
  immer((set, get) => ({
    // Initial state
    totalRebirths: 0,
    availableAP: 0,
    lifetimeAP: 0,
    spiritRoot: null,
    apUpgrades: {
      qiGain: 0,
      combatPower: 0,
      cultivation: 0,
      luckBonus: 0,
    },
    runStartTime: Date.now(),
    highestRealmReached: 0,
    bossesDefeated: 0,

    /**
     * Calculate AP gained from current run
     */
    calculateAPGain: () => {
      const gameState = useGameStore.getState();
      const state = get();

      // Base AP
      let apGain = PRESTIGE_AP_BASE;

      // Realm bonus
      apGain += state.highestRealmReached * PRESTIGE_AP_PER_REALM;

      // Boss bonus
      apGain += state.bossesDefeated * PRESTIGE_AP_PER_BOSS;

      // Time bonus (decays over time)
      const runDuration = Date.now() - state.runStartTime;
      const hoursElapsed = runDuration / (1000 * 60 * 60);
      const timeBonus = Math.max(
        0,
        PRESTIGE_AP_TIME_BONUS_BASE - hoursElapsed * PRESTIGE_AP_TIME_BONUS_DECAY
      );
      apGain += Math.floor(timeBonus);

      // Aura bonus
      const auraBonus = Math.floor(gameState.totalAuras / PRESTIGE_AP_AURA_DIVISOR);
      apGain += auraBonus;

      return Math.floor(apGain);
    },

    /**
     * Perform a rebirth (prestige)
     */
    rebirth: () => {
      const state = get();
      const apGained = state.calculateAPGain();

      set((state) => {
        state.totalRebirths += 1;
        state.availableAP += apGained;
        state.lifetimeAP += apGained;
        state.runStartTime = Date.now();
        state.highestRealmReached = 0;
        state.bossesDefeated = 0;
      });

      // Reset the game state
      useGameStore.getState().resetRun();

      return apGained;
    },

    /**
     * Purchase an AP upgrade
     */
    purchaseAPUpgrade: (type: keyof PrestigeState['apUpgrades']) => {
      const state = get();
      const currentLevel = state.apUpgrades[type];

      // Cost increases exponentially
      const cost = Math.floor(10 * Math.pow(1.5, currentLevel));

      if (state.availableAP < cost) {
        return false;
      }

      set((state) => {
        state.availableAP -= cost;
        state.apUpgrades[type] += 1;
      });

      return true;
    },

    /**
     * Set spirit root (only once per rebirth)
     */
    setSpiritRoot: (spiritRoot: SpiritRoot) => {
      const state = get();

      if (state.spiritRoot !== null) {
        console.warn('Spirit root already set for this rebirth');
        return false;
      }

      set((state) => {
        state.spiritRoot = spiritRoot;
      });

      // Recalculate Qi generation
      useGameStore.getState().calculateQiPerSecond();

      return true;
    },

    /**
     * Get total Qi multiplier from prestige upgrades
     */
    getQiMultiplier: () => {
      const state = get();
      let multiplier = 1;

      // AP upgrade bonus
      multiplier += state.apUpgrades.qiGain * 0.1; // +10% per level

      // Spirit root bonus
      if (state.spiritRoot) {
        const spiritRootMultiplier = SPIRIT_ROOT_MULTIPLIERS[state.spiritRoot.grade] || 1;
        multiplier *= spiritRootMultiplier;
      }

      return multiplier;
    },

    /**
     * Get total combat power multiplier from prestige upgrades
     */
    getCombatMultiplier: () => {
      const state = get();
      return 1 + state.apUpgrades.combatPower * 0.15; // +15% per level
    },

    /**
     * Get cultivation speed multiplier from prestige upgrades
     */
    getCultivationMultiplier: () => {
      const state = get();
      return 1 + state.apUpgrades.cultivation * 0.12; // +12% per level
    },

    /**
     * Get luck bonus from prestige upgrades
     */
    getLuckBonus: () => {
      const state = get();
      return state.apUpgrades.luckBonus * 5; // +5 luck per level
    },

    /**
     * Update highest realm reached
     */
    updateHighestRealm: (realmIndex: number) => {
      const state = get();
      if (realmIndex > state.highestRealmReached) {
        set((state) => {
          state.highestRealmReached = realmIndex;
        });
      }
    },

    /**
     * Increment boss defeat counter
     */
    incrementBossesDefeated: () => {
      set((state) => {
        state.bossesDefeated += 1;
      });
    },
  }))
);

/**
 * Register prestige store with game store for cross-store integration
 */
setPrestigeStoreGetter(() => usePrestigeStore.getState());
