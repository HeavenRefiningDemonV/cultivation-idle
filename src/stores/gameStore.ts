import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Decimal from 'decimal.js';
import type {
  GameState,
  FocusMode,
  CultivationPath,
  EquipmentStats,
} from '../types';
import {
  REALMS,
  PATH_MODIFIERS,
  FOCUS_MODE_MODIFIERS,
  INITIAL_REALM,
  INITIAL_STATS,
  BREAKTHROUGH_QI_MULTIPLIER,
  UPGRADE_COSTS,
  ELEMENT_BONUSES,
} from '../constants';
import { D, add, multiply, greaterThanOrEqualTo } from '../utils/numbers';
import { setGameStoreGetter } from './prestigeStore';
import { getPerkById } from '../data/pathPerks';
import { GATE_ITEMS } from '../systems/loot';
import {
  useZoneStore,
  ZONE_REALM_REQUIREMENTS,
  ZONE_UNLOCK_REQUIREMENTS,
} from './zoneStore';
import { useDungeonStore } from './dungeonStore';
import { useTechniqueStore } from './techniqueStore';

interface InventoryStoreDeps {
  getEquipmentStats: () => EquipmentStats;
  resetInventory: () => void;
}

interface PrestigeStoreDeps {
  updateHighestRealm: (index: number) => void;
  getQiMultiplier: () => Decimal.Value;
  getCombatMultiplier: () => Decimal.Value;
  getCultivationMultiplier: () => Decimal.Value;
  spiritRoot: { element?: string | null; purity: number } | null;
}

interface CombatStoreDeps {
  resetCombat: () => void;
  exitCombat: () => void;
}

/**
 * Lazy getter for inventory store to avoid circular dependency
 */
let _getInventoryStore: (() => InventoryStoreDeps) | null = null;
export function setInventoryStoreGetter(getter: () => InventoryStoreDeps) {
  _getInventoryStore = getter;
}

/**
 * Lazy getter for prestige store to avoid circular dependency
 */
let _getPrestigeStore: (() => PrestigeStoreDeps) | null = null;
export function setPrestigeStoreGetter(getter: () => PrestigeStoreDeps) {
  _getPrestigeStore = getter;
}

let _getCombatStore: (() => CombatStoreDeps) | null = null;
export function setCombatStoreGetter(getter: () => CombatStoreDeps) {
  _getCombatStore = getter;
}

const REALM_ZONE_UNLOCKS = Object.entries(ZONE_REALM_REQUIREMENTS)
  .filter(([zoneId]) => zoneId !== 'training_forest')
  .map(([zoneId, realmIndex]) => ({
    realmIndex: Number(realmIndex),
    zoneId,
    prerequisiteZone: ZONE_UNLOCK_REQUIREMENTS[zoneId],
  }));

function unlockContentForRealm(realmIndex: number) {
  try {
    const zoneStore = useZoneStore.getState();

    for (const unlock of REALM_ZONE_UNLOCKS) {
      const prerequisiteMet =
        !unlock.prerequisiteZone || zoneStore.isZoneCompleted(unlock.prerequisiteZone);

      if (
        realmIndex >= unlock.realmIndex &&
        prerequisiteMet &&
        !zoneStore.isZoneUnlocked(unlock.zoneId)
      ) {
        zoneStore.unlockZone(unlock.zoneId);
      }
    }
  } catch (error) {
    console.warn('[GameStore] Failed to unlock realm progression content', error);
  }
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
    pathPerks: [],
    totalAuras: 0,
    upgradeTiers: {
      idle: 0,
      damage: 0,
      hp: 0,
    },
    pityState: {
      killsSinceUncommon: 0,
      killsSinceRare: 0,
      killsSinceEpic: 0,
      killsSinceLegendary: 0,
    },
    playerLuck: 0,
    lastTickTime: Date.now(),
    runStartTime: Date.now(),

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
     * Select a path perk (adds to player's perk collection)
     */
    selectPerk: (perkId: string) => {
      const state = get();

      // Check if perk is already selected
      if (state.pathPerks.includes(perkId)) {
        console.warn('Perk already selected!');
        return false;
      }

      set((state) => {
        state.pathPerks.push(perkId);
      });

      // Recalculate derived values with new perk
      get().calculateQiPerSecond();
      get().calculatePlayerStats();

      return true;
    },

    /**
     * Attempt a breakthrough to the next substage or realm
     */
    breakthrough: () => {
      const state = get();
      const currentRealm = REALMS[state.realm.index];
      const isFinalSubstage = state.realm.substage >= currentRealm.substages;
      const canAdvanceToNextRealm = isFinalSubstage && state.realm.index < REALMS.length - 1;

      // Get Qi requirement (includes prestige multipliers)
      const requiredQi = get().getBreakthroughRequirement();

      // Check if player has enough Qi
      if (!greaterThanOrEqualTo(state.qi, requiredQi)) {
        return false;
      }

      // Check breakthrough gate item when advancing realms
      const gateItemId = canAdvanceToNextRealm ? GATE_ITEMS[state.realm.index] : undefined;
        let inventoryStore: InventoryStoreDeps | null = null;

      if (gateItemId) {
        if (_getInventoryStore) {
          try {
            inventoryStore = _getInventoryStore();
          } catch (error) {
            console.warn('[GameStore] Inventory store unavailable for breakthrough', error);
          }
        }

        if (!inventoryStore || !inventoryStore.hasItem(gateItemId)) {
          console.warn(`[GameStore] Missing required breakthrough item: ${gateItemId}`);
          return false;
        }

        const removed = inventoryStore.removeItem(gateItemId, 1);
        if (!removed) {
          console.warn(`[GameStore] Failed to consume breakthrough item: ${gateItemId}`);
          return false;
        }
      }

      const previousRealmIndex = state.realm.index;

      set((state) => {
        // Deduct Qi
        state.qi = D(state.qi).minus(requiredQi).toString();

        // Increment total auras
        state.totalAuras += 1;

        // Check if advancing to next realm or just next substage
        if (canAdvanceToNextRealm) {
          state.realm.index += 1;
          state.realm.substage = 1;
          state.realm.name = REALMS[state.realm.index].name;
        } else if (isFinalSubstage) {
          // Max realm reached, just increment substage
          state.realm.substage += 1;
        } else {
          // Advance substage
          state.realm.substage += 1;
        }
      });

      // Update highest realm in prestige store
      if (_getPrestigeStore) {
        try {
          const prestigeStore = _getPrestigeStore();
          prestigeStore.updateHighestRealm(get().realm.index);
        } catch {
          // Prestige store not available
        }
      }

      const newRealmIndex = get().realm.index;
      if (newRealmIndex > previousRealmIndex) {
        unlockContentForRealm(newRealmIndex);
      }

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

      // Apply prestige Qi multiplier
      if (_getPrestigeStore) {
        try {
          const prestigeStore = _getPrestigeStore();
          const prestigeMultiplier = prestigeStore.getQiMultiplier();
          qiPerSec = multiply(qiPerSec, prestigeMultiplier);
        } catch {
          // Prestige store not available
        }
      }

      // Apply equipment Qi gain bonus
      if (_getInventoryStore) {
        try {
          const inventoryStore = _getInventoryStore();
          const equipmentStats = inventoryStore.getEquipmentStats();
          if (equipmentStats.qiGain > 0) {
            const equipmentMultiplier = D(1).plus(D(equipmentStats.qiGain).dividedBy(100));
            qiPerSec = multiply(qiPerSec, equipmentMultiplier);
          }
        } catch {
          // Equipment stats not available
        }
      }

      // Apply path perk bonuses
      for (const perkId of state.pathPerks) {
        const perk = getPerkById(perkId);
        if (perk && perk.effect.stat === 'qiMultiplier') {
          const perkMultiplier = D(1).plus(perk.effect.value);
          qiPerSec = multiply(qiPerSec, perkMultiplier);
        }
      }

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
      const speed = baseStats.speed;

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

      // Apply prestige combat multiplier
      if (_getPrestigeStore) {
        try {
          const prestigeStore = _getPrestigeStore();
          const combatMultiplier = prestigeStore.getCombatMultiplier();
          hp = multiply(hp, combatMultiplier);
          atk = multiply(atk, combatMultiplier);
          def = multiply(def, combatMultiplier);
        } catch {
          // Prestige store not available
        }
      }

      // Apply spirit root element bonuses
      if (_getPrestigeStore) {
        try {
          const prestigeStore = _getPrestigeStore();
          const spiritRoot = prestigeStore.spiritRoot;

          if (spiritRoot && spiritRoot.element && spiritRoot.element in ELEMENT_BONUSES) {
            const elementBonus = ELEMENT_BONUSES[spiritRoot.element as keyof typeof ELEMENT_BONUSES];
            const purityMultiplier = spiritRoot.purity / 100; // Scale by purity (0-100 -> 0-1)

            if ('hp' in elementBonus && elementBonus.hp) {
              const hpBonus = D(1).plus(D(elementBonus.hp).times(purityMultiplier));
              hp = multiply(hp, hpBonus);
            }
            if ('atk' in elementBonus && elementBonus.atk) {
              const atkBonus = D(1).plus(D(elementBonus.atk).times(purityMultiplier));
              atk = multiply(atk, atkBonus);
            }
            if ('def' in elementBonus && elementBonus.def) {
              const defBonus = D(1).plus(D(elementBonus.def).times(purityMultiplier));
              def = multiply(def, defBonus);
            }
            if ('hpRegen' in elementBonus && elementBonus.hpRegen) {
              const regenBonus = D(1).plus(D(elementBonus.hpRegen).times(purityMultiplier));
              regen = multiply(regen, regenBonus);
            }
            if ('critRate' in elementBonus && elementBonus.critRate) {
              crit += elementBonus.critRate * purityMultiplier;
            }
            if ('dodge' in elementBonus && elementBonus.dodge) {
              dodge += elementBonus.dodge * purityMultiplier;
            }
          }
          } catch {
            // Prestige store not available
          }
        }

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
        } catch {
          // Equipment stats not available, skip
        }
      }

      // Apply path perk bonuses
      for (const perkId of state.pathPerks) {
        const perk = getPerkById(perkId);
        if (!perk) continue;

        switch (perk.effect.stat) {
          case 'hpMultiplier':
            hp = multiply(hp, D(1).plus(perk.effect.value));
            break;
          case 'atkMultiplier':
            atk = multiply(atk, D(1).plus(perk.effect.value));
            break;
          case 'defMultiplier':
            def = multiply(def, D(1).plus(perk.effect.value));
            break;
          case 'regenMultiplier':
            regen = multiply(regen, D(1).plus(perk.effect.value));
            break;
          case 'crit':
            crit += perk.effect.value;
            break;
          case 'critDmg':
            critDmg += perk.effect.value;
            break;
          case 'dodge':
            dodge += perk.effect.value;
            break;
          // qiMultiplier is handled in calculateQiPerSecond
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
     * Get Qi requirement for next breakthrough
     */
    getBreakthroughRequirement: () => {
      const state = get();
      const currentRealm = REALMS[state.realm.index];

      // Calculate Qi requirement for current substage
      const baseRequirement = D(currentRealm.qiRequirement);
      const substageMultiplier = D(BREAKTHROUGH_QI_MULTIPLIER).pow(state.realm.substage - 1);
      const requiredQi = multiply(baseRequirement, substageMultiplier);

      // Apply prestige cultivation multiplier (reduces cost)
      if (_getPrestigeStore) {
        try {
          const prestigeStore = _getPrestigeStore();
          const cultivationMultiplier = prestigeStore.getCultivationMultiplier();
          return requiredQi.dividedBy(cultivationMultiplier).toString();
          } catch {
            // Prestige store not available, return base requirement
          }
        }

      return requiredQi.toString();
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
        state.pathPerks = [];
        state.upgradeTiers = {
          idle: 0,
          damage: 0,
          hp: 0,
        };
        state.lastTickTime = Date.now();
        state.runStartTime = Date.now();
        // Note: totalAuras is NOT reset - it's a prestige currency
      });

      // Recalculate everything
      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },

    /**
     * Perform a prestige reset with AP upgrades support
     */
    performPrestigeReset: () => {
      // Reset game progression
      get().resetRun();

      // Clear inventory and equipment
      if (_getInventoryStore) {
        try {
          const inventoryStore = _getInventoryStore();
          inventoryStore.resetInventory();
        } catch {
          // Inventory store not available
        }
      }

      // Exit and reset combat state
      if (_getCombatStore) {
        try {
          const combatStore = _getCombatStore();
          if (combatStore.resetCombat) {
            combatStore.resetCombat();
          } else {
            combatStore.exitCombat();
          }
        } catch {
          // Combat store not available
        }
      }

      // Reset world progression
      try {
        useZoneStore.getState().resetAllZones();
      } catch {
        // Zone store not available
      }

      // Reset dungeon progression
      try {
        useDungeonStore.getState().resetDungeons();
      } catch {
        // Dungeon store not available
      }

      // Reset techniques and intent
      try {
        useTechniqueStore.getState().resetTechniques();
      } catch {
        // Technique store not available
      }

      // Prestige-specific logic handled in prestige store
      // Apply prestige bonuses (they're automatically applied through getters in prestigeStore)
      // Recalculate everything to apply prestige multipliers
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

  // Register game store with prestige store
  setGameStoreGetter(() => useGameStore.getState());
};
