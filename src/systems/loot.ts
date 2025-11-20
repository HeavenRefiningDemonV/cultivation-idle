import type { EnemyDefinition, LootDrop, ItemRarity, PityState } from '../types';
import { ITEMS_DATABASE } from '../constants/itemsDatabase';

/**
 * Loot generation result
 */
export interface LootResult {
  items: {
    itemId: string;
    quantity: number;
    rarity: ItemRarity;
  }[];
  gold: string;
  pityTriggered: boolean;
  updatedPityState: PityState;
}

/**
 * Pity thresholds (guaranteed drop after N kills)
 */
const PITY_THRESHOLDS = {
  uncommon: 10,   // Guarantee uncommon after 10 kills
  rare: 50,       // Guarantee rare after 50 kills
  epic: 200,      // Guarantee epic after 200 kills
  legendary: 1000 // Guarantee legendary after 1000 kills
};

/**
 * Rarity weights for pity drops
 */
const PITY_DROP_POOLS: Record<string, { itemId: string; rarity: ItemRarity }[]> = {
  uncommon: [
    { itemId: 'lesser_health_potion', rarity: 'uncommon' },
    { itemId: 'lesser_spirit_stone', rarity: 'uncommon' },
  ],
  rare: [
    { itemId: 'health_potion', rarity: 'rare' },
    { itemId: 'spirit_stone', rarity: 'rare' },
    { itemId: 'cultivation_manual', rarity: 'rare' },
  ],
  epic: [
    { itemId: 'greater_health_potion', rarity: 'epic' },
    { itemId: 'greater_spirit_stone', rarity: 'epic' },
    { itemId: 'ancient_scroll', rarity: 'epic' },
  ],
  legendary: [
    { itemId: 'supreme_elixir', rarity: 'legendary' },
    { itemId: 'heavenly_artifact', rarity: 'legendary' },
  ],
};

/**
 * Gate items required for realm breakthroughs
 * Key corresponds to the realm index the player is LEAVING
 *
 * Early breakthroughs are intentionally tied to dungeon rewards to force
 * players to complete the associated challenge before advancing.
 */
export const GATE_ITEMS: Record<number, string> = {
  0: 'foundation_pill',        // Qi Condensation → Foundation Establishment
  1: 'core_catalyst',          // Foundation Establishment → Golden Core
  2: 'soul_fragment',          // Golden Core → Nascent Soul
  3: 'core_gate_token',        // Nascent Soul → higher realms (placeholder)
};

function getItemRarity(itemId: string): ItemRarity {
  const item = ITEMS_DATABASE[itemId];
  return item?.rarity || 'common';
}

/**
 * Generate loot from an enemy defeat
 */
export function generateLoot(
  enemy: EnemyDefinition,
  playerLuck: number,
  pityState: PityState,
  isBoss: boolean = false,
  isFirstBossKill: boolean = false
): LootResult {
  const result: LootResult = {
    items: [],
    gold: enemy.goldReward,
    pityTriggered: false,
    updatedPityState: { ...pityState },
  };

  const droppedRarities: ItemRarity[] = [];

  // Process loot table if exists
  if (enemy.lootTable && enemy.lootTable.length > 0) {
    for (const drop of enemy.lootTable) {
      const lootItems = rollLoot(drop, playerLuck);
      result.items.push(...lootItems);
      droppedRarities.push(...lootItems.map((item) => item.rarity));
    }
  }

  // Boss guaranteed drops
  if (isBoss) {
    const bossDrops = generateBossLoot(enemy, isFirstBossKill);
    result.items.push(...bossDrops);
    droppedRarities.push(...bossDrops.map((item) => item.rarity));
  }

  // Update pity counters for this kill based on natural drops
  let pityStateAfterKill = updatePityCounters(pityState, droppedRarities);

  // Check pity system after applying counters
  const pityDrop = checkPity(pityStateAfterKill);
  if (pityDrop) {
    result.items.push(pityDrop);
    result.pityTriggered = true;
    pityStateAfterKill = resetPityAfterDrop(pityStateAfterKill, pityDrop.rarity);
  }

  result.updatedPityState = pityStateAfterKill;

  return result;
}

/**
 * Roll for loot from a loot table entry
 */
export function rollLoot(
  drop: LootDrop,
  playerLuck: number
): { itemId: string; quantity: number; rarity: ItemRarity }[] {
  const items: { itemId: string; quantity: number; rarity: ItemRarity }[] = [];

  // Apply luck modifier to drop chance (max +50% from luck)
  const luckBonus = Math.min(50, playerLuck / 2);
  const adjustedDropChance = Math.min(100, drop.dropChance + luckBonus);

  // Roll for drop
  const roll = Math.random() * 100;
  if (roll < adjustedDropChance) {
    const quantity = Math.floor(
      Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount
    );

    items.push({
      itemId: drop.itemId,
      quantity,
      rarity: getItemRarity(drop.itemId),
    });
  }

  return items;
}

/**
 * Generate boss-specific loot
 */
function generateBossLoot(
  enemy: EnemyDefinition,
  isFirstKill: boolean
): { itemId: string; quantity: number; rarity: ItemRarity }[] {
  const items: { itemId: string; quantity: number; rarity: ItemRarity }[] = [];

  // Determine boss tier based on level
  const bossLevel = enemy.level;

  // Gate bosses now drop the same materials required for breakthroughs so
  // Adventure progression mirrors the dungeon rewards.
  if (isFirstKill) {
    if (bossLevel <= 5) {
      items.push({
        itemId: 'foundation_pill',
        quantity: 1,
        rarity: 'rare',
      });
    } else if (bossLevel <= 10) {
      items.push({
        itemId: 'core_catalyst',
        quantity: 1,
        rarity: 'epic',
      });
    } else if (bossLevel <= 20) {
      items.push({
        itemId: 'soul_fragment',
        quantity: 1,
        rarity: 'legendary',
      });
    } else {
      items.push({
        itemId: 'core_gate_token',
        quantity: 1,
        rarity: 'legendary',
      });
    }
  }

  // Bosses always drop a rare material
  const rareMaterials = [
    'spirit_essence',
    'beast_core',
    'celestial_jade',
  ];
  const randomMaterial = rareMaterials[Math.floor(Math.random() * rareMaterials.length)];
  items.push({
    itemId: randomMaterial,
    quantity: Math.floor(Math.random() * 3) + 1,
    rarity: 'rare',
  });

  return items;
}

/**
 * Check pity system and generate guaranteed drop if threshold reached
 */
function checkPity(
  pityState: PityState
): { itemId: string; quantity: number; rarity: ItemRarity } | null {
  // Check legendary pity (highest priority)
  if (pityState.killsSinceLegendary >= PITY_THRESHOLDS.legendary) {
    const pool = PITY_DROP_POOLS.legendary;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      itemId: item.itemId,
      quantity: 1,
      rarity: item.rarity,
    };
  }

  // Check epic pity
  if (pityState.killsSinceEpic >= PITY_THRESHOLDS.epic) {
    const pool = PITY_DROP_POOLS.epic;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      itemId: item.itemId,
      quantity: 1,
      rarity: item.rarity,
    };
  }

  // Check rare pity
  if (pityState.killsSinceRare >= PITY_THRESHOLDS.rare) {
    const pool = PITY_DROP_POOLS.rare;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      itemId: item.itemId,
      quantity: 1,
      rarity: item.rarity,
    };
  }

  // Check uncommon pity
  if (pityState.killsSinceUncommon >= PITY_THRESHOLDS.uncommon) {
    const pool = PITY_DROP_POOLS.uncommon;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      itemId: item.itemId,
      quantity: 1,
      rarity: item.rarity,
    };
  }

  return null;
}

/**
 * Update pity counters after a kill
 */
export function updatePityCounters(
  pityState: PityState,
  droppedRarities: ItemRarity[]
): PityState {
  const newState = { ...pityState };

  // Increment all counters
  newState.killsSinceUncommon++;
  newState.killsSinceRare++;
  newState.killsSinceEpic++;
  newState.killsSinceLegendary++;

  // Reset counters based on what dropped
  for (const rarity of droppedRarities) {
    if (rarity === 'legendary' || rarity === 'mythic') {
      // Legendary/Mythic resets all pity counters
      newState.killsSinceUncommon = 0;
      newState.killsSinceRare = 0;
      newState.killsSinceEpic = 0;
      newState.killsSinceLegendary = 0;
    } else if (rarity === 'epic') {
      // Epic resets uncommon, rare, and epic
      newState.killsSinceUncommon = 0;
      newState.killsSinceRare = 0;
      newState.killsSinceEpic = 0;
    } else if (rarity === 'rare') {
      // Rare resets uncommon and rare
      newState.killsSinceUncommon = 0;
      newState.killsSinceRare = 0;
    } else if (rarity === 'uncommon') {
      // Uncommon resets only uncommon
      newState.killsSinceUncommon = 0;
    }
  }

  return newState;
}

function resetPityAfterDrop(pityState: PityState, rarity: ItemRarity): PityState {
  const newState = { ...pityState };

  if (rarity === 'legendary' || rarity === 'mythic') {
    newState.killsSinceUncommon = 0;
    newState.killsSinceRare = 0;
    newState.killsSinceEpic = 0;
    newState.killsSinceLegendary = 0;
  } else if (rarity === 'epic') {
    newState.killsSinceUncommon = 0;
    newState.killsSinceRare = 0;
    newState.killsSinceEpic = 0;
  } else if (rarity === 'rare') {
    newState.killsSinceUncommon = 0;
    newState.killsSinceRare = 0;
  } else if (rarity === 'uncommon') {
    newState.killsSinceUncommon = 0;
  }

  return newState;
}

/**
 * Get rarity color for display
 */
export function getRarityColor(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: '#9ca3af',      // Gray
    uncommon: '#22c55e',    // Green
    rare: '#3b82f6',        // Blue
    epic: '#a855f7',        // Purple
    legendary: '#f59e0b',   // Orange/Gold
    mythic: '#ef4444',      // Red
  };
  return colors[rarity] || colors.common;
}

/**
 * Format loot message for combat log
 */
export function formatLootMessage(loot: LootResult): string[] {
  const messages: string[] = [];

  // Gold message
  if (loot.gold && loot.gold !== '0') {
    messages.push(`Gained ${loot.gold} gold`);
  }

  // Item messages
  for (const item of loot.items) {
    const rarityTag = item.rarity !== 'common' ? ` [${item.rarity.toUpperCase()}]` : '';
    messages.push(`${item.quantity}x ${item.itemId}${rarityTag}`);
  }

  // Pity message
  if (loot.pityTriggered) {
    messages.push('⭐ Pity system activated!');
  }

  return messages;
}

/**
 * Create initial pity state
 */
export function createInitialPityState(): PityState {
  return {
    killsSinceUncommon: 0,
    killsSinceRare: 0,
    killsSinceEpic: 0,
    killsSinceLegendary: 0,
  };
}
