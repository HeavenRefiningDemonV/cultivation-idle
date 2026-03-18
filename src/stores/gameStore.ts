import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Decimal from 'decimal.js';
import type { GameState, FocusMode, CultivationPath, ActiveBuff, BuffStat, SpiritRoot } from '../types';
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
import {
  clampRealmIndexToSemesterSlice,
  getGateTransitionItemIdForRealmIndex,
  hasNextLiveRealm,
} from '../systems/progression/runtime/index.js';
import { getAvailablePerks, getPerkById } from '../data/pathPerks';
import {
  useZoneStore,
  ZONE_REALM_REQUIREMENTS,
  ZONE_UNLOCK_REQUIREMENTS,
} from './zoneStore';
import { useUIStore } from './uiStore';
import { useEquipmentStore } from './equipmentStore';
import { getBreathModeMultipliers } from '../content/tuning/cultivationTuning';
import { useHeartLawStore } from './heartLawStore';
import { getHeartLawBonuses } from '../systems/heartLaw/heartLawLogic';
import { useContentStore } from './contentStore';
import { useCityStore } from './cityStore';
import { getLiveRealmByIndex } from '../systems/progression/runtime';
import { performPrestigeReset as performCentralPrestigeReset } from '../services/prestige/PrestigeResetService.js';

interface InventoryStoreDeps {
  getItemCount: (itemId: string) => number;
  removeItem: (itemId: string, quantity: number) => boolean;
  resetInventory: () => void;
}

interface PrestigeStoreDeps {
  updateHighestRealm: (index: number) => void;
  getQiMultiplier: () => Decimal.Value;
  getCombatMultiplier: () => Decimal.Value;
  getSpiritRootTotalMultiplier: () => number;
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

export function getSpiritRootSnapshot(): SpiritRoot | null {
  const prestigeStore = _getPrestigeStore ? _getPrestigeStore() : null;
  const root = prestigeStore?.spiritRoot ?? null;
  if (!root || typeof root.grade !== 'number') return null;
  return root as SpiritRoot;
}

// Kept for runtime wiring parity with the game loop even though prestige reset orchestration no longer reads it here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const createInitialGameState = () => ({
  realm: { ...INITIAL_REALM },
  qi: '0',
  qiPerSecond: '1',
  stats: { ...INITIAL_STATS },
  activeBuffs: [],
  absorptionShield: '0',
  absorptionExpiresAt: null as number | null,
  selectedPath: null as CultivationPath | null,
  focusMode: 'balanced' as FocusMode,
  pathPerks: [] as string[],
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
  lastActiveTime: Date.now(),
  runStartTime: Date.now(),
});

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
    ...createInitialGameState(),

    /**
     * Main game tick - called regularly to update Qi and state
     */
    tick: (deltaTime: number) => {
      get().removeExpiredBuffs();

      set((state) => {
        // Calculate Qi gained this tick
        const breath = getBreathModeMultipliers(useHeartLawStore.getState().breathMode);
        const qiGain = multiply(state.qiPerSecond, (deltaTime / 1000) * breath.qiRateMult);
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
        state.lastActiveTime = state.lastTickTime;
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

    addBuff: (buff: { id: string; stat: BuffStat; value: number; duration: number }) => {
      const now = Date.now();

      set((state) => {
        // Remove expired buffs and replace any existing buff of the same type/id
        state.activeBuffs = state.activeBuffs
          .filter((existing) => existing.expiresAt > now)
          .filter((existing) => !(existing.id === buff.id && existing.stat === buff.stat));

        const expiresAt = now + buff.duration;
        const newBuff: ActiveBuff = {
          id: buff.id,
          stat: buff.stat,
          value: buff.value,
          expiresAt,
        };

        if (buff.stat === 'absorption') {
          const shieldAmount = multiply(state.stats.maxHp, buff.value).toString();
          newBuff.remainingShield = shieldAmount;
          state.absorptionShield = shieldAmount;
          state.absorptionExpiresAt = expiresAt;
        }

        state.activeBuffs.push(newBuff);
      });

      get().calculatePlayerStats();
    },

    removeExpiredBuffs: () => {
      const now = Date.now();
      let buffsChanged = false;

      set((state) => {
        const filtered = state.activeBuffs.filter((buff) => buff.expiresAt > now);
        buffsChanged = filtered.length !== state.activeBuffs.length;
        state.activeBuffs = filtered;

        const activeShield = filtered.find(
          (buff) => buff.stat === 'absorption' && buff.remainingShield && buff.expiresAt > now
        );

        if (activeShield) {
          state.absorptionShield = activeShield.remainingShield ?? '0';
          state.absorptionExpiresAt = activeShield.expiresAt;
        } else {
          state.absorptionShield = '0';
          state.absorptionExpiresAt = null;
        }
      });

      if (buffsChanged) {
        get().calculatePlayerStats();
      }
    },

    applyAbsorptionShield: (damage: string) => {
      let remainingDamage = D(damage);
      let absorbed = D(0);

      set((state) => {
        const now = Date.now();
        const shieldBuff = state.activeBuffs.find(
          (buff) => buff.stat === 'absorption' && buff.expiresAt > now && buff.remainingShield
        );

        if (shieldBuff && shieldBuff.remainingShield) {
          const shieldRemaining = D(shieldBuff.remainingShield);
          const absorbAmount = Decimal.min(shieldRemaining, remainingDamage);
          absorbed = absorbAmount;
          remainingDamage = remainingDamage.minus(absorbAmount);

          const newShieldValue = shieldRemaining.minus(absorbAmount).toString();
          shieldBuff.remainingShield = newShieldValue;
          state.absorptionShield = newShieldValue;
          state.absorptionExpiresAt = shieldBuff.expiresAt;

          if (D(newShieldValue).lessThanOrEqualTo(0)) {
            state.activeBuffs = state.activeBuffs.filter((buff) => buff !== shieldBuff);
          }
        } else {
          state.absorptionShield = '0';
          state.absorptionExpiresAt = null;
        }
      });

      return {
        remainingDamage: remainingDamage.toString(),
        absorbed: absorbed.toString(),
      };
    },

    /**
     * Attempt a breakthrough to the next substage or realm
     */
    breakthrough: () => {
      const state = get();
      const currentRealmIndex = clampRealmIndexToSemesterSlice(state.realm.index);
      const currentRealm = REALMS[currentRealmIndex] ?? REALMS[0];
      const isFinalSubstage = state.realm.substage >= currentRealm.substages;
      const canAdvanceToNextRealm = isFinalSubstage && hasNextLiveRealm(currentRealmIndex);

      // Get Qi requirement (includes prestige multipliers)
      const requiredQi = get().getBreakthroughRequirement();

      // Check if player has enough Qi
      if (!greaterThanOrEqualTo(state.qi, requiredQi)) {
        return false;
      }

      // Check breakthrough gate proof when advancing realms
      const gateItemId = canAdvanceToNextRealm
        ? getGateTransitionItemIdForRealmIndex(useContentStore.getState().raw, currentRealmIndex)
        : null;

      if (gateItemId) {
        let inventoryStore: InventoryStoreDeps | null = null;
        try {
          inventoryStore = _getInventoryStore ? _getInventoryStore() : null;
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[GameStore] Inventory store unavailable for breakthrough', error);
          }
        }

        if (!inventoryStore || inventoryStore.getItemCount(gateItemId) <= 0) {
          console.warn(`[GameStore] Missing required breakthrough item: ${gateItemId}`);
          return false;
        }

        const removed = inventoryStore.removeItem(gateItemId, 1);
        if (!removed) {
          console.warn(`[GameStore] Failed to consume breakthrough item: ${gateItemId}`);
          return false;
        }
      }

      const previousRealmIndex = clampRealmIndexToSemesterSlice(state.realm.index);

      set((state) => {
        // Deduct Qi
        state.qi = D(state.qi).minus(requiredQi).toString();

        // Increment total auras
        state.totalAuras += 1;

        // Check if advancing to next realm or just next substage
        if (canAdvanceToNextRealm) {
          state.realm.index = currentRealmIndex + 1;
          state.realm.substage = 1;
          state.realm.name = REALMS[state.realm.index]?.name ?? REALMS[0].name;
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
        useCityStore.getState().syncRealmEntry(getLiveRealmByIndex(newRealmIndex).id);
      }

      // Recalculate stats and Qi generation
      get().calculateQiPerSecond();
      get().calculatePlayerStats();

      // Trigger perk selection for newly reached realms when a path is selected
      const selectedPath = get().selectedPath;

      if (selectedPath) {
        const hasRealmPerk = get().pathPerks.some((perkId) => {
          const perk = getPerkById(perkId);
          return perk?.requiredRealm === newRealmIndex;
        });

        const availablePerks = getAvailablePerks(selectedPath, newRealmIndex);

        if (!hasRealmPerk && availablePerks.length > 0) {
          try {
            useUIStore.getState().showPerkSelection(newRealmIndex);
          } catch {
            // UI store unavailable
          }
        }
      }

      return true;
    },

    /**
     * Calculate Qi per second based on realm, path, focus, and upgrades
     */
    calculateQiPerSecond: () => {
      const state = get();
      const currentRealm = REALMS[clampRealmIndexToSemesterSlice(state.realm.index)] ?? REALMS[0];

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

          // Apply spirit root multipliers to cultivation gains
          const spiritRootMultiplier = prestigeStore.getSpiritRootTotalMultiplier();
          qiPerSec = multiply(qiPerSec, spiritRootMultiplier);

          // Apply spirit root element Qi bonus (scaled by purity)
          const spiritRoot = prestigeStore.spiritRoot;
          if (spiritRoot && spiritRoot.element && spiritRoot.element in ELEMENT_BONUSES) {
            const elementBonus = ELEMENT_BONUSES[spiritRoot.element as keyof typeof ELEMENT_BONUSES];
            if ('qiPerSecond' in elementBonus && elementBonus.qiPerSecond) {
              const purityMultiplier = spiritRoot.purity / 100;
              const qiBonus = D(1).plus(D(elementBonus.qiPerSecond).times(purityMultiplier));
              qiPerSec = multiply(qiPerSec, qiBonus);
            }
          }
        } catch {
          // Prestige store not available
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

      const heartLawId = useHeartLawStore.getState().selectedHeartLawId;
      if (heartLawId) {
        const heartLawDef = useContentStore.getState().maps.heartLawsById[heartLawId] ?? null;
        const bonuses = getHeartLawBonuses({
          heartLawDef,
          chapter: useHeartLawStore.getState().chapter,
          spiritRoot: getSpiritRootSnapshot(),
        });
        qiPerSec = multiply(qiPerSec, D(bonuses.cultivateRateMult));
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
      const currentRealm = REALMS[clampRealmIndexToSemesterSlice(state.realm.index)] ?? REALMS[0];
      const baseStats = currentRealm.baseStats;

      const now = Date.now();
      const activeBuffs = state.activeBuffs.filter((buff) => buff.expiresAt > now);
      const hpRatio = (() => {
        try {
          const currentHp = D(state.stats.hp);
          const currentMax = D(state.stats.maxHp);
          if (currentMax.lessThanOrEqualTo(0)) return D(1);
          return Decimal.min(D(1), currentHp.dividedBy(currentMax));
        } catch {
          return D(1);
        }
      })();

      // Substage multiplier for stats
      const substageMultiplier = D(1).plus(D(0.15).times(state.realm.substage - 1));

      // Calculate base stats with substage multiplier
      let hp = multiply(baseStats.hp, substageMultiplier);
      let atk = multiply(baseStats.atk, substageMultiplier);
      let def = multiply(baseStats.def, substageMultiplier);
      let regen = multiply(baseStats.regen, substageMultiplier);

      // Percentage-based stats are stored on a 0-100 scale and compared against percentile rolls
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

          // Apply spirit root quality/purity bonuses to core stats
          const spiritRootMultiplier = prestigeStore.getSpiritRootTotalMultiplier();
          hp = multiply(hp, spiritRootMultiplier);
          atk = multiply(atk, spiritRootMultiplier);
          def = multiply(def, spiritRootMultiplier);
          regen = multiply(regen, spiritRootMultiplier);
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

      const equipmentState = useEquipmentStore.getState();
      const weaponLevel = equipmentState.refineLevelBySlot.weapon;
      const accessoryLevel = equipmentState.refineLevelBySlot.accessory;
      const weaponMultiplier = equipmentState.equippedWeaponId
        ? Decimal.min(D(1.25), D(1).plus(D(0.02).times(weaponLevel)))
        : D(1);
      const accessoryMultiplier = equipmentState.equippedAccessoryId
        ? Decimal.min(D(1.25), D(1).plus(D(0.02).times(accessoryLevel)))
        : D(1);

      atk = multiply(atk, weaponMultiplier);
      hp = multiply(hp, accessoryMultiplier);
      def = multiply(def, accessoryMultiplier);
      regen = multiply(regen, accessoryMultiplier);

      const temperAffixes = [
        ...(equipmentState.temperBonusesBySlot.weapon ?? []),
        ...(equipmentState.temperBonusesBySlot.accessory ?? []),
      ];
      temperAffixes.forEach((affix) => {
        switch (affix.stat) {
          case 'atkPct':
            atk = multiply(atk, D(1).plus(affix.valuePct));
            break;
          case 'defPct':
            def = multiply(def, D(1).plus(affix.valuePct));
            break;
          case 'hpPct':
            hp = multiply(hp, D(1).plus(affix.valuePct));
            regen = multiply(regen, D(1).plus(affix.valuePct * 0.5));
            break;
          case 'critPct':
            crit += affix.valuePct * 100;
            break;
          case 'dodgePct':
            dodge += affix.valuePct * 100;
            break;
        }
      });

      // Apply active buffs
      for (const buff of activeBuffs) {
        switch (buff.stat) {
          case 'atk':
            atk = multiply(atk, D(1).plus(buff.value));
            break;
          case 'def':
            def = multiply(def, D(1).plus(buff.value));
            break;
          case 'crit_chance':
            crit += buff.value * 100;
            break;
        }
      }

      const newHpValue = Decimal.min(hp, hp.times(hpRatio));
      const activeShield = activeBuffs.find(
        (buff) => buff.stat === 'absorption' && buff.expiresAt > now && buff.remainingShield
      );

      set((state) => {
        state.stats = {
          hp: newHpValue.toString(),
          maxHp: hp.toString(),
          atk: atk.toString(),
          def: def.toString(),
          crit,
          critDmg,
          dodge,
          regen: regen.toString(),
          speed,
        };

        // Keep only valid buffs (drop expired)
        state.activeBuffs = activeBuffs;

        if (activeShield) {
          state.absorptionShield = activeShield.remainingShield ?? '0';
          state.absorptionExpiresAt = activeShield.expiresAt;
        } else {
          state.absorptionShield = '0';
          state.absorptionExpiresAt = null;
        }
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
      const currentRealm = REALMS[clampRealmIndexToSemesterSlice(state.realm.index)] ?? REALMS[0];

      // Calculate Qi requirement for current substage
      const baseRequirement = D(currentRealm.qiRequirement);
      const substageMultiplier = D(BREAKTHROUGH_QI_MULTIPLIER).pow(state.realm.substage - 1);
      const requiredQi = multiply(baseRequirement, substageMultiplier);

      return requiredQi.toString();
    },

    /**
     * Reset the current run (for prestige systems)
     */
    resetRun: () => {
      const baseState = createInitialGameState();
      set((state) => {
        const preservedAuras = state.totalAuras;
        Object.assign(state, baseState);
        state.totalAuras = preservedAuras; // Prestige currency persists through run resets
      });

      // Recalculate everything
      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },

    hardResetGameState: () => {
      const baseState = createInitialGameState();
      set((state) => {
        Object.assign(state, baseState);
      });

      get().calculateQiPerSecond();
      get().calculatePlayerStats();
    },

    /**
     * Perform a prestige reset with AP upgrades support
     */
    performPrestigeReset: () => {
      performCentralPrestigeReset({
        resetGameRun: () => get().resetRun(),
      });

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
