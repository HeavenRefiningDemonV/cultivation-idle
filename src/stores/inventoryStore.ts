import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InventoryState, ItemDefinition, InventoryItem, EquipmentStats } from '../types';
import { useGameStore, setInventoryStoreGetter } from './gameStore';
import { useCombatStore } from './combatStore';
import { D, add, subtract, greaterThanOrEqualTo } from '../utils/numbers';

/**
 * Item database - stores all item definitions
 * This will be populated from a separate constants file or loaded from JSON
 */
const ITEMS_DATABASE: Record<string, ItemDefinition> = {
  // ===== WEAPONS =====
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    description: 'An old, worn blade. Better than nothing.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    stats: { atk: '10' },
    value: '50',
    stackable: false,
    maxStack: 1,
  },
  basic_sword: {
    id: 'basic_sword',
    name: 'Iron Sword',
    description: 'A simple iron sword for beginners.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    stats: { atk: '25', crit: 2 },
    value: '100',
    stackable: false,
    maxStack: 1,
  },
  steel_blade: {
    id: 'steel_blade',
    name: 'Steel Blade',
    description: 'A well-crafted steel sword.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 5,
    stats: { atk: '50', crit: 5, critDmg: 10 },
    value: '500',
    stackable: false,
    maxStack: 1,
  },
  spirit_blade: {
    id: 'spirit_blade',
    name: 'Spirit Blade',
    description: 'A blade infused with spiritual energy.',
    type: 'weapon',
    rarity: 'rare',
    level: 10,
    stats: { atk: '100', crit: 10, critDmg: 25 },
    value: '2000',
    stackable: false,
    maxStack: 1,
  },
  dragon_fang: {
    id: 'dragon_fang',
    name: 'Dragon Fang Sword',
    description: 'Forged from the fang of an ancient dragon.',
    type: 'weapon',
    rarity: 'epic',
    level: 15,
    stats: { atk: '250', crit: 15, critDmg: 50 },
    value: '10000',
    stackable: false,
    maxStack: 1,
  },
  immortal_blade: {
    id: 'immortal_blade',
    name: 'Immortal\'s Edge',
    description: 'A legendary blade wielded by immortals.',
    type: 'weapon',
    rarity: 'legendary',
    level: 20,
    stats: { atk: '500', crit: 25, critDmg: 100, dodge: 5 },
    value: '50000',
    stackable: false,
    maxStack: 1,
  },

  // ===== ACCESSORIES =====
  worn_talisman: {
    id: 'worn_talisman',
    name: 'Worn Talisman',
    description: 'An old protective charm.',
    type: 'accessory',
    rarity: 'common',
    level: 1,
    stats: { hp: '50', def: '5' },
    value: '50',
    stackable: false,
    maxStack: 1,
  },
  jade_pendant: {
    id: 'jade_pendant',
    name: 'Jade Pendant',
    description: 'A beautiful jade pendant that enhances cultivation.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 5,
    stats: { hp: '150', def: '15', qiGain: 10 },
    value: '400',
    stackable: false,
    maxStack: 1,
  },
  spirit_ring: {
    id: 'spirit_ring',
    name: 'Spirit Ring',
    description: 'A ring that channels spiritual power.',
    type: 'accessory',
    rarity: 'rare',
    level: 10,
    stats: { hp: '300', def: '30', qiGain: 20, dodge: 3 },
    value: '1500',
    stackable: false,
    maxStack: 1,
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather Amulet',
    description: 'Contains the essence of a phoenix.',
    type: 'accessory',
    rarity: 'epic',
    level: 15,
    stats: { hp: '600', def: '60', qiGain: 40, dodge: 8 },
    value: '8000',
    stackable: false,
    maxStack: 1,
  },
  heavenly_jade: {
    id: 'heavenly_jade',
    name: 'Heavenly Jade Seal',
    description: 'A jade seal blessed by the heavens.',
    type: 'accessory',
    rarity: 'legendary',
    level: 20,
    stats: { hp: '1200', def: '120', qiGain: 80, dodge: 15, crit: 10 },
    value: '40000',
    stackable: false,
    maxStack: 1,
  },

  // ===== CONSUMABLES =====
  health_pill: {
    id: 'health_pill',
    name: 'Health Pill',
    description: 'Restores 50% of maximum HP.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    consumable: { healPercent: 50 },
    value: '25',
    stackable: true,
    maxStack: 99,
  },
  greater_health_pill: {
    id: 'greater_health_pill',
    name: 'Greater Health Pill',
    description: 'Restores 100% of maximum HP.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 5,
    consumable: { healPercent: 100 },
    value: '100',
    stackable: true,
    maxStack: 99,
  },
  supreme_health_pill: {
    id: 'supreme_health_pill',
    name: 'Supreme Health Pill',
    description: 'Fully restores HP and grants temporary vitality.',
    type: 'consumable',
    rarity: 'rare',
    level: 10,
    consumable: { healPercent: 100, buffDuration: 30, buffStats: { def: 20 } },
    value: '500',
    stackable: true,
    maxStack: 99,
  },

  // ===== MATERIALS =====
  spirit_stone: {
    id: 'spirit_stone',
    name: 'Spirit Stone',
    description: 'A stone containing concentrated spiritual energy. Used for crafting.',
    type: 'material',
    rarity: 'common',
    level: 1,
    value: '10',
    stackable: true,
    maxStack: 999,
  },
  qi_crystal: {
    id: 'qi_crystal',
    name: 'Qi Crystal',
    description: 'A crystallized form of pure Qi. Valuable crafting material.',
    type: 'material',
    rarity: 'uncommon',
    level: 5,
    value: '50',
    stackable: true,
    maxStack: 999,
  },
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    description: 'A scale from a mighty dragon. Extremely rare.',
    type: 'material',
    rarity: 'epic',
    level: 15,
    value: '5000',
    stackable: true,
    maxStack: 99,
  },
  immortal_essence: {
    id: 'immortal_essence',
    name: 'Immortal Essence',
    description: 'The essence of immortality itself. Priceless.',
    type: 'material',
    rarity: 'legendary',
    level: 20,
    value: '100000',
    stackable: true,
    maxStack: 10,
  },

  // ===== TREASURE ITEMS =====
  gold_coin: {
    id: 'gold_coin',
    name: 'Gold Coin',
    description: 'Currency used throughout the cultivation world.',
    type: 'treasure',
    rarity: 'common',
    level: 1,
    value: '1',
    stackable: true,
    maxStack: 999999,
  },
};

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

/**
 * Inventory store managing items, equipment, and gold
 */
export const useInventoryStore = create<InventoryState>()(
  immer((set, get) => ({
    // Initial state
    items: [],
    equippedWeapon: null,
    equippedAccessory: null,
    gold: '0',
    maxSlots: 20,

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

      // Check if item is stackable
      if (itemDef.stackable) {
        // Find existing stack
        const existingItem = state.items.find((item) => item.itemId === itemId);

        if (existingItem) {
          // Add to existing stack
          set((state) => {
            const item = state.items.find((i: InventoryItem) => i.itemId === itemId);
            if (item) {
              const newQuantity = Math.min(item.quantity + quantity, itemDef.maxStack);
              item.quantity = newQuantity;
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
      const state = get();
      const item = state.items.find((i) => i.itemId === itemId);

      if (!item) {
        console.warn(`Item ${itemId} not found in inventory`);
        return false;
      }

      if (item.quantity < quantity) {
        console.warn(`Not enough ${itemId} in inventory`);
        return false;
      }

      set((state) => {
        const itemIndex = state.items.findIndex((i: InventoryItem) => i.itemId === itemId);
        if (itemIndex !== -1) {
          const item = state.items[itemIndex];
          item.quantity -= quantity;

          // Remove if quantity reaches 0
          if (item.quantity <= 0) {
            state.items.splice(itemIndex, 1);
          }
        }
      });

      return true;
    },

    /**
     * Equip a weapon
     */
    equipWeapon: (itemId: string) => {
      const itemDef = getItemDefinition(itemId);
      if (!itemDef || itemDef.type !== 'weapon') {
        console.warn(`${itemId} is not a valid weapon`);
        return false;
      }

      const state = get();

      // Check if player has the item
      if (!state.hasItem(itemId)) {
        console.warn(`${itemId} not found in inventory`);
        return false;
      }

      // Unequip current weapon first
      if (state.equippedWeapon) {
        state.unequipWeapon();
      }

      // Remove from inventory and equip
      set((state) => {
        state.removeItem(itemId, 1);
        state.equippedWeapon = itemDef;
      });

      // Recalculate player stats
      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Unequip weapon
     */
    unequipWeapon: () => {
      const state = get();
      if (!state.equippedWeapon) {
        return false;
      }

      const weaponId = state.equippedWeapon.id;

      set((state) => {
        state.equippedWeapon = null;
      });

      // Add back to inventory
      state.addItem(weaponId, 1);

      // Recalculate player stats
      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Equip an accessory
     */
    equipAccessory: (itemId: string) => {
      const itemDef = getItemDefinition(itemId);
      if (!itemDef || itemDef.type !== 'accessory') {
        console.warn(`${itemId} is not a valid accessory`);
        return false;
      }

      const state = get();

      // Check if player has the item
      if (!state.hasItem(itemId)) {
        console.warn(`${itemId} not found in inventory`);
        return false;
      }

      // Unequip current accessory first
      if (state.equippedAccessory) {
        state.unequipAccessory();
      }

      // Remove from inventory and equip
      set((state) => {
        state.removeItem(itemId, 1);
        state.equippedAccessory = itemDef;
      });

      // Recalculate player stats
      useGameStore.getState().calculatePlayerStats();

      return true;
    },

    /**
     * Unequip accessory
     */
    unequipAccessory: () => {
      const state = get();
      if (!state.equippedAccessory) {
        return false;
      }

      const accessoryId = state.equippedAccessory.id;

      set((state) => {
        state.equippedAccessory = null;
      });

      // Add back to inventory
      state.addItem(accessoryId, 1);

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

      // TODO: Apply buff effects (would need a buff system)
      if (consumable.buffDuration && consumable.buffStats) {
        console.log(`Applied buffs from ${itemDef.name} for ${consumable.buffDuration}s`);
        // This would be implemented with a buff system
      }

      // Remove item from inventory
      state.removeItem(itemId, 1);

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

      // Add weapon stats
      if (state.equippedWeapon?.stats) {
        const weaponStats = state.equippedWeapon.stats;
        if (weaponStats.hp) stats.hp = add(stats.hp, weaponStats.hp).toString();
        if (weaponStats.atk) stats.atk = add(stats.atk, weaponStats.atk).toString();
        if (weaponStats.def) stats.def = add(stats.def, weaponStats.def).toString();
        if (weaponStats.crit) stats.crit += weaponStats.crit;
        if (weaponStats.critDmg) stats.critDmg += weaponStats.critDmg;
        if (weaponStats.dodge) stats.dodge += weaponStats.dodge;
        if (weaponStats.qiGain) stats.qiGain += weaponStats.qiGain;
      }

      // Add accessory stats
      if (state.equippedAccessory?.stats) {
        const accessoryStats = state.equippedAccessory.stats;
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

    /**
     * Get count of specific item in inventory
     */
    getItemCount: (itemId: string) => {
      const state = get();
      const item = state.items.find((i) => i.itemId === itemId);
      return item ? item.quantity : 0;
    },

    /**
     * Check if player has specific item (with optional quantity check)
     */
    hasItem: (itemId: string, quantity: number = 1) => {
      const state = get();
      return state.getItemCount(itemId) >= quantity;
    },
  }))
);

/**
 * Get item definition from the database
 * Exported for use in other modules
 */
export { getItemDefinition };

/**
 * Register inventory store with game store for equipment stats
 */
setInventoryStoreGetter(() => useInventoryStore.getState());
