import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InventoryState, ItemDefinition, InventoryItem, EquipmentStats } from '../types';
import { useGameStore } from './gameStore';
import { useCombatStore } from './combatStore';
import { D, add, subtract, greaterThanOrEqualTo } from '../utils/numbers';

/**
 * Item database - stores all item definitions
 * This will be populated from a separate constants file or loaded from JSON
 */
import { ITEMS_DATABASE } from '../constants/itemsDatabase';

/**
 * Get item definition by ID
 */
function getItemDefinition(itemId: string): ItemDefinition | null {
  return ITEMS_DATABASE[itemId] || null;
}

/**
 * Generate a unique ID for inventory items
 */
function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const createInitialInventoryState = () => ({
  items: [] as InventoryState['items'],
  equippedWeaponId: null as string | null,
  equippedAccessoryId: null as string | null,
  gold: '0',
  maxSlots: 20,
});

/**
 * Inventory store managing items, equipment, and gold
 */
export const useInventoryStore = create<InventoryState>()(
  immer((set, get) => ({
    // Initial state
    ...createInitialInventoryState(),

    /**
     * Add item to inventory
     */
    addItem: (itemId: string, quantity: number = 1) => {
      const itemDef = getItemDefinition(itemId);
      if (!itemDef) {
        console.warn(`Item ${itemId} not found in database`);
        return false;
      }

      const state = get();

      // Check if item is stackable and merge only with non-equipped stacks
      if (itemDef.stackable) {
        const stackTarget = state.items.find(
          (item) => item.itemId === itemId && !item.equipped && item.quantity < itemDef.maxStack
        );

        if (stackTarget) {
          set((state) => {
            const item = state.items.find(
              (i: InventoryItem) => i.id === stackTarget.id && !i.equipped
            );

            if (item) {
              const availableSpace = itemDef.maxStack - item.quantity;
              const toAdd = Math.min(quantity, availableSpace);
              item.quantity += toAdd;
            }
          });
          return true;
        }
      }

      // Check if inventory has space
      if (state.items.length >= state.maxSlots) {
        console.warn('Inventory is full');
        return false;
      }

      // Add new item
      set((state) => {
        const newItem: InventoryItem = {
          id: generateItemId(),
          itemId,
          quantity: Math.min(quantity, itemDef.stackable ? itemDef.maxStack : 1),
        };
        state.items.push(newItem);
      });

      return true;
    },

    /**
     * Remove item from inventory
     */
      removeItem: (itemId: string, quantity: number = 1) => {
        let remaining = quantity;

      set((state) => {
        for (const item of state.items) {
          if (item.itemId !== itemId || item.equipped || remaining <= 0) continue;

          const removeCount = Math.min(item.quantity, remaining);
          item.quantity -= removeCount;
          remaining -= removeCount;
        }

        state.items = state.items.filter((item) => item.quantity > 0 || item.equipped);
      });

      if (remaining > 0) {
        console.warn(`Not enough ${itemId} in inventory`);
        return false;
      }

      return true;
    },

    /**
     * Equip a weapon
     */
    equipWeapon: (inventoryItemId: string) => {
      const state = get();
      const itemInstance = state.items.find(
        (i) => i.id === inventoryItemId && !i.equipped
      );

      if (!itemInstance) {
        console.warn(`${inventoryItemId} not found or already equipped`);
        return false;
      }

      const itemDef = getItemDefinition(itemInstance.itemId);
      if (!itemDef || itemDef.type !== 'weapon') {
        console.warn(`${inventoryItemId} is not a valid weapon`);
        return false;
      }

      // Unequip current weapon first
      if (state.equippedWeaponId) {
        state.unequipWeapon();
      }

      set((state) => {
        const target = state.items.find((i) => i.id === inventoryItemId);
        if (!target) return;
        target.equipped = true;
        state.equippedWeaponId = target.id;
      });

      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Unequip weapon
     */
    unequipWeapon: () => {
      const state = get();
      if (!state.equippedWeaponId) {
        return false;
      }

      set((state) => {
        const equippedItem = state.items.find((i) => i.id === state.equippedWeaponId);
        if (equippedItem) {
          equippedItem.equipped = false;
        }
        state.equippedWeaponId = null;
      });

      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Equip an accessory
     */
    equipAccessory: (inventoryItemId: string) => {
      const state = get();
      const itemInstance = state.items.find(
        (i) => i.id === inventoryItemId && !i.equipped
      );

      if (!itemInstance) {
        console.warn(`${inventoryItemId} not found or already equipped`);
        return false;
      }

      const itemDef = getItemDefinition(itemInstance.itemId);
      if (!itemDef || itemDef.type !== 'accessory') {
        console.warn(`${inventoryItemId} is not a valid accessory`);
        return false;
      }

      if (state.equippedAccessoryId) {
        state.unequipAccessory();
      }

      set((state) => {
        const target = state.items.find((i) => i.id === inventoryItemId);
        if (!target) return;
        target.equipped = true;
        state.equippedAccessoryId = target.id;
      });

      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Unequip accessory
     */
    unequipAccessory: () => {
      const state = get();
      if (!state.equippedAccessoryId) {
        return false;
      }

      set((state) => {
        const equippedItem = state.items.find((i) => i.id === state.equippedAccessoryId);
        if (equippedItem) {
          equippedItem.equipped = false;
        }
        state.equippedAccessoryId = null;
      });

      // Recalculate player stats
      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Use a consumable item
     */
    useConsumable: (itemId: string) => {
      const itemDef = getItemDefinition(itemId);
      if (!itemDef || itemDef.type !== 'consumable' || !itemDef.consumable) {
        console.warn(`${itemId} is not a valid consumable`);
        return false;
      }

      const state = get();

      // Check if player has the item
      if (!state.hasItem(itemId)) {
        console.warn(`${itemId} not found in inventory`);
        return false;
      }

      const consumable = itemDef.consumable;

      // Apply healing effects
      if (consumable.healHP || consumable.healPercent) {
        const combatState = useCombatStore.getState();
        const gameState = useGameStore.getState();

        let healAmount = D(0);

        if (consumable.healHP) {
          healAmount = D(consumable.healHP);
        } else if (consumable.healPercent) {
          const maxHP = D(gameState.stats.maxHp);
          healAmount = maxHP.times(consumable.healPercent / 100);
        }

        // Apply healing
        if (combatState.inCombat) {
          // Heal in combat
          const newHP = D(combatState.playerHP).plus(healAmount);
          const maxHP = D(combatState.playerMaxHP);
          const finalHP = newHP.greaterThan(maxHP) ? maxHP : newHP;

          useCombatStore.setState({ playerHP: finalHP.toString() });
          combatState.addLogEntry(
            'heal',
            `Used ${itemDef.name}! Restored ${healAmount.toFixed(0)} HP.`,
            '#22c55e'
          );
        } else {
          // Heal outside combat
          const newHP = D(gameState.stats.hp).plus(healAmount);
          const maxHP = D(gameState.stats.maxHp);
          const finalHP = newHP.greaterThan(maxHP) ? maxHP : newHP;

          useGameStore.setState((state) => {
            state.stats.hp = finalHP.toString();
          });
        }
      }

      // Restore Qi resource (adds flat amount or percentage of current breakthrough requirement)
      if (consumable.restoreQi || consumable.restoreQiPercent) {
        const gameStore = useGameStore.getState();
        const restoreAmount = (() => {
          if (consumable.restoreQi) return D(consumable.restoreQi);
          const required = D(gameStore.getBreakthroughRequirement());
          return required.times((consumable.restoreQiPercent ?? 0) / 100);
        })();

        useGameStore.setState((state) => {
          state.qi = add(state.qi, restoreAmount).toString();
        });
      }

      // Attempt breakthrough if the consumable is designed for it
      if (consumable.triggerBreakthrough) {
        useGameStore.getState().breakthrough();
      }

      // TODO: Apply buff effects (would need a buff system)
      if (consumable.buffDuration && consumable.buffStats) {
        const buffDurationMs = consumable.buffDuration * 1000;
        const gameStore = useGameStore.getState();

        if (consumable.buffStats.atk) {
          gameStore.addBuff({
            id: `${itemId}_atk_buff`,
            stat: 'atk',
            value: consumable.buffStats.atk / 100,
            duration: buffDurationMs,
          });
        }

        if (consumable.buffStats.def) {
          gameStore.addBuff({
            id: `${itemId}_def_buff`,
            stat: 'def',
            value: consumable.buffStats.def / 100,
            duration: buffDurationMs,
          });
        }

        if (consumable.buffStats.crit) {
          gameStore.addBuff({
            id: `${itemId}_crit_buff`,
            stat: 'crit_chance',
            value: consumable.buffStats.crit / 100,
            duration: buffDurationMs,
          });
        }
      }

      // Remove item from inventory
      state.removeItem(itemId, 1);

      // Refresh stats after consumable effects are applied
      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Add gold to inventory
     */
    addGold: (amount: string) => {
      set((state) => {
        state.gold = add(state.gold, amount).toString();
      });
    },

    /**
     * Remove gold from inventory
     */
    removeGold: (amount: string) => {
      const state = get();

      if (!greaterThanOrEqualTo(state.gold, amount)) {
        console.warn('Not enough gold');
        return false;
      }

      set((state) => {
        state.gold = subtract(state.gold, amount).toString();
      });

      return true;
    },

    /**
     * Sell items for gold
     */
    sellItem: (itemId: string, quantity: number = 1) => {
      const itemDef = getItemDefinition(itemId);
      if (!itemDef) {
        console.warn(`${itemId} is not a valid item to sell`);
        return false;
      }

      if (quantity <= 0) {
        return false;
      }

      const state = get();
      if (!state.hasItem(itemId, quantity)) {
        console.warn(`Not enough ${itemId} to sell`);
        return false;
      }

      const removed = state.removeItem(itemId, quantity);
      if (!removed) {
        return false;
      }

      const saleValue = D(itemDef.value).times(quantity);

      set((state) => {
        state.gold = add(state.gold, saleValue).toString();
      });

      return true;
    },

    /**
     * Calculate total stats from equipped items
     */
    getEquipmentStats: () => {
      const state = get();

      const stats: EquipmentStats = {
        hp: '0',
        atk: '0',
        def: '0',
        crit: 0,
        critDmg: 0,
        dodge: 0,
        qiGain: 0,
      };

      const equippedWeaponDef = state.getEquippedWeaponDefinition();
      const equippedAccessoryDef = state.getEquippedAccessoryDefinition();

      // Add weapon stats
      if (equippedWeaponDef?.stats) {
        const weaponStats = equippedWeaponDef.stats;
        if (weaponStats.hp) stats.hp = add(stats.hp, weaponStats.hp).toString();
        if (weaponStats.atk) stats.atk = add(stats.atk, weaponStats.atk).toString();
        if (weaponStats.def) stats.def = add(stats.def, weaponStats.def).toString();
        if (weaponStats.crit) stats.crit += weaponStats.crit;
        if (weaponStats.critDmg) stats.critDmg += weaponStats.critDmg;
        if (weaponStats.dodge) stats.dodge += weaponStats.dodge;
        if (weaponStats.qiGain) stats.qiGain += weaponStats.qiGain;
      }

      // Add accessory stats
      if (equippedAccessoryDef?.stats) {
        const accessoryStats = equippedAccessoryDef.stats;
        if (accessoryStats.hp) stats.hp = add(stats.hp, accessoryStats.hp).toString();
        if (accessoryStats.atk) stats.atk = add(stats.atk, accessoryStats.atk).toString();
        if (accessoryStats.def) stats.def = add(stats.def, accessoryStats.def).toString();
        if (accessoryStats.crit) stats.crit += accessoryStats.crit;
        if (accessoryStats.critDmg) stats.critDmg += accessoryStats.critDmg;
        if (accessoryStats.dodge) stats.dodge += accessoryStats.dodge;
        if (accessoryStats.qiGain) stats.qiGain += accessoryStats.qiGain;
      }

      return stats;
    },

    getEquippedWeaponDefinition: () => {
      const state = get();
      const equippedItem = state.items.find(
        (item) => item.id === state.equippedWeaponId && item.equipped
      );
      if (!equippedItem) return null;
      return getItemDefinition(equippedItem.itemId);
    },

    getEquippedAccessoryDefinition: () => {
      const state = get();
      const equippedItem = state.items.find(
        (item) => item.id === state.equippedAccessoryId && item.equipped
      );
      if (!equippedItem) return null;
      return getItemDefinition(equippedItem.itemId);
    },

    /**
     * Get count of specific item in inventory
     */
    getItemCount: (itemId: string) => {
      const state = get();
      return state.items
        .filter((i) => i.itemId === itemId && !i.equipped)
        .reduce((total, item) => total + item.quantity, 0);
    },

    /**
     * Check if player has specific item (with optional quantity check)
     */
    hasItem: (itemId: string, quantity: number = 1) => {
      const state = get();
      return state.getItemCount(itemId) >= quantity;
    },

    /**
     * Reset all inventory progress for a new run
     */
    resetInventory: () => {
      set((state) => {
        Object.assign(state, createInitialInventoryState());
      });
    },

    hardResetInventory: () => {
      set((state) => {
        Object.assign(state, createInitialInventoryState());
      });
    },
  }))
);

/**
 * Get item definition from the database
 * Exported for use in other modules
 */
export { getItemDefinition };

