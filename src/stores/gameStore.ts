import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Decimal from 'decimal.js';
import type {
  GameState,
  FocusMode,
  CultivationPath,
} from '../types';
import {
  REALMS,
  PATH_MODIFIERS,
  FOCUS_MODE_MODIFIERS,
  INITIAL_REALM,
  INITIAL_STATS,
  BREAKTHROUGH_QI_MULTIPLIER,
  UPGRADE_COSTS,
} from '../constants';
import { D, add, multiply, greaterThanOrEqualTo } from '../utils/numbers';

/**
 * Lazy getter for inventory store to avoid circular dependency
 */
let _getInventoryStore: (() => any) | null = null;
export function setInventoryStoreGetter(getter: () => any) {
  _getInventoryStore = getter;
}

/**
 * Main game store managing cultivation progression
 */
export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    realm: { ...INITIAL_REALM },
    qi: '0',
    qiPerSecond: '1',
    stats: { ...INITIAL_STATS },
    selectedPath: null,
    focusMode: 'balanced',
    totalAuras: 0,
    upgradeTiers: {
      idle: 0,
      damage: 0,
      hp: 0,
    },
    lastTickTime: Date.now(),

    /**
     * Main game tick - called regularly to update Qi and state
     */
    tick: (deltaTime: number) => {
      set((state) => {
        // Calculate Qi gained this tick
        const qiGain = multiply(state.qiPerSecond, deltaTime / 1000);
        state.qi = add(state.qi, qiGain).toString();

        // Regenerate HP (if needed for combat)
        const currentHp = D(state.stats.hp);
        const maxHp = D(state.stats.maxHp);
        if (currentHp.lessThan(maxHp)) {
          const regenAmount = multiply(state.stats.regen, deltaTime / 1000);
          const newHp = Decimal.min(add(currentHp, regenAmount), maxHp);
          state.stats.hp = newHp.toString();
        }

        state.lastTickTime = Date.now();
      });
    },

    /**
     * Set the cultivation focus mode
     */
    setFocusMode: (mode: FocusMode) => {
      set((state) => {
        state.focusMode = mode;
      });
      // Recalculate derived values
      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },

    /**
     * Select a cultivation path (can only be done once)
     */
    selectPath: (path: CultivationPath) => {
      const state = get();
      if (state.selectedPath !== null) {
        console.warn('Path already selected!');
        return;
      }

      set((state) => {
        state.selectedPath = path;
      });

      // Recalculate derived values
      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },

    /**
     * Attempt a breakthrough to the next substage or realm
     */
    breakthrough: () => {
      const state = get();
      const currentRealm = REALMS[state.realm.index];

      // Calculate Qi requirement for current substage
      const baseRequirement = D(currentRealm.qiRequirement);
      const substageMultiplier = D(BREAKTHROUGH_QI_MULTIPLIER).pow(state.realm.substage - 1);
      const requiredQi = multiply(baseRequirement, substageMultiplier);

      // Check if player has enough Qi
      if (!greaterThanOrEqualTo(state.qi, requiredQi)) {
        return false;
      }

      set((state) => {
        // Deduct Qi
        state.qi = D(state.qi).minus(requiredQi).toString();

        // Increment total auras
        state.totalAuras += 1;

        // Check if advancing to next realm or just next substage
        if (state.realm.substage >= currentRealm.substages) {
          // Advance to next realm
          if (state.realm.index < REALMS.length - 1) {
            state.realm.index += 1;
            state.realm.substage = 1;
            state.realm.name = REALMS[state.realm.index].name;
          } else {
            // Max realm reached, just increment substage
            state.realm.substage += 1;
          }
        } else {
          // Advance substage
          state.realm.substage += 1;
        }
      });

      // Recalculate stats and Qi generation
      get().calculateQiPerSecond();
      get().calculatePlayerStats();

      return true;
    },

    /**
     * Calculate Qi per second based on realm, path, focus, and upgrades
     */
    calculateQiPerSecond: () => {
      const state = get();
      const currentRealm = REALMS[state.realm.index];

      // Base Qi/s from realm
      let qiPerSec = D(currentRealm.qiPerSecond);

      // Substage multiplier (each substage increases base slightly)
      const substageBonus = D(1).plus(D(0.2).times(state.realm.substage - 1));
      qiPerSec = multiply(qiPerSec, substageBonus);

      // Apply focus mode multiplier
      const focusMod = FOCUS_MODE_MODIFIERS[state.focusMode];
      qiPerSec = multiply(qiPerSec, focusMod.qiMultiplier);

      // Apply path multiplier
      if (state.selectedPath) {
        const pathMod = PATH_MODIFIERS[state.selectedPath];
        qiPerSec = multiply(qiPerSec, pathMod.qiMultiplier);
      }

      // Apply idle upgrade multiplier
      const idleUpgradeMultiplier = D(1).plus(
        D(UPGRADE_COSTS.idle.effectPerTier).times(state.upgradeTiers.idle)
      );
      qiPerSec = multiply(qiPerSec, idleUpgradeMultiplier);

      set((state) => {
        state.qiPerSecond = qiPerSec.toString();
      });
    },

    /**
     * Calculate player stats based on realm, path, focus, and upgrades
     */
    calculatePlayerStats: () => {
      const state = get();
      const currentRealm = REALMS[state.realm.index];
      const baseStats = currentRealm.baseStats;

      // Substage multiplier for stats
      const substageMultiplier = D(1).plus(D(0.15).times(state.realm.substage - 1));

      // Calculate base stats with substage multiplier
      let hp = multiply(baseStats.hp, substageMultiplier);
      let atk = multiply(baseStats.atk, substageMultiplier);
      let def = multiply(baseStats.def, substageMultiplier);
      let regen = multiply(baseStats.regen, substageMultiplier);

      let crit = baseStats.crit;
      let critDmg = baseStats.critDmg;
      let dodge = baseStats.dodge;
      let speed = baseStats.speed;

      // Apply focus mode modifiers
      const focusMod = FOCUS_MODE_MODIFIERS[state.focusMode];
      hp = multiply(hp, focusMod.hpMultiplier);
      atk = multiply(atk, focusMod.atkMultiplier);
      def = multiply(def, focusMod.defMultiplier);

      // Apply path modifiers
      if (state.selectedPath) {
        const pathMod = PATH_MODIFIERS[state.selectedPath];
        hp = multiply(hp, pathMod.hpMultiplier);
        atk = multiply(atk, pathMod.atkMultiplier);
        def = multiply(def, pathMod.defMultiplier);
        crit += pathMod.critBonus;
        dodge += pathMod.dodgeBonus;
      }

      // Apply upgrade multipliers
      const hpUpgradeMultiplier = D(1).plus(
        D(UPGRADE_COSTS.hp.effectPerTier).times(state.upgradeTiers.hp)
      );
      hp = multiply(hp, hpUpgradeMultiplier);

      const damageUpgradeMultiplier = D(1).plus(
        D(UPGRADE_COSTS.damage.effectPerTier).times(state.upgradeTiers.damage)
      );
      atk = multiply(atk, damageUpgradeMultiplier);

      // Apply equipment bonuses
      if (_getInventoryStore) {
        try {
          const inventoryStore = _getInventoryStore();
          const equipmentStats = inventoryStore.getEquipmentStats();

          hp = add(hp, equipmentStats.hp);
          atk = add(atk, equipmentStats.atk);
          def = add(def, equipmentStats.def);
          crit += equipmentStats.crit;
          critDmg += equipmentStats.critDmg;
          dodge += equipmentStats.dodge;

          // Qi gain bonus is applied in calculateQiPerSecond
        } catch (error) {
          // Equipment stats not available, skip
        }
      }

      set((state) => {
        state.stats = {
          hp: hp.toString(),
          maxHp: hp.toString(),
          atk: atk.toString(),
          def: def.toString(),
          crit,
          critDmg,
          dodge,
          regen: regen.toString(),
          speed,
        };
      });
    },

    /**
     * Purchase an upgrade tier
     */
    purchaseUpgrade: (type: 'idle' | 'damage' | 'hp') => {
      const state = get();
      const upgradeConfig = UPGRADE_COSTS[type];
      const currentTier = state.upgradeTiers[type];

      // Calculate cost
      const cost = D(upgradeConfig.baseCost).times(
        D(upgradeConfig.costMultiplier).pow(currentTier)
      );

      // Check if player can afford it
      if (!greaterThanOrEqualTo(state.qi, cost)) {
        return false;
      }

      set((state) => {
        // Deduct Qi
        state.qi = D(state.qi).minus(cost).toString();
        // Increment tier
        state.upgradeTiers[type] += 1;
      });

      // Recalculate derived values
      if (type === 'idle') {
        get().calculateQiPerSecond();
      } else {
        get().calculatePlayerStats();
      }

      return true;
    },

    /**
     * Reset the current run (for prestige systems)
     */
    resetRun: () => {
      set((state) => {
        state.realm = { ...INITIAL_REALM };
        state.qi = '0';
        state.qiPerSecond = '1';
        state.stats = { ...INITIAL_STATS };
        state.selectedPath = null;
        state.focusMode = 'balanced';
        state.upgradeTiers = {
          idle: 0,
          damage: 0,
          hp: 0,
        };
        state.lastTickTime = Date.now();
        // Note: totalAuras is NOT reset - it's a prestige currency
      });

      // Recalculate everything
      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },
  }))
);

/**
 * Initialize the game store
 * Call this on app startup to set initial calculated values
 */
export const initializeGameStore = () => {
  const store = useGameStore.getState();
  store.calculateQiPerSecond();
  store.calculatePlayerStats();
};
