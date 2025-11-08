import type { RealmDefinition, PathModifiers, FocusModeModifiers } from '../types';

/**
 * Realm definitions for cultivation progression
 * Each realm has substages (typically 9 for early realms, 3-6 for later ones)
 */
export const REALMS: RealmDefinition[] = [
  {
    index: 0,
    name: 'Qi Condensation',
    majorRealm: 'Mortal',
    substages: 9,
    qiRequirement: '100',
    qiPerSecond: '1',
    baseStats: {
      hp: '100',
      atk: '10',
      def: '5',
      crit: 5,
      critDmg: 150,
      dodge: 5,
      regen: '1',
      speed: 1.0,
    },
  },
  {
    index: 1,
    name: 'Foundation Establishment',
    majorRealm: 'Mortal',
    substages: 9,
    qiRequirement: '1000',
    qiPerSecond: '10',
    baseStats: {
      hp: '500',
      atk: '50',
      def: '25',
      crit: 8,
      critDmg: 160,
      dodge: 8,
      regen: '5',
      speed: 1.1,
    },
  },
  {
    index: 2,
    name: 'Golden Core',
    majorRealm: 'Spiritual',
    substages: 9,
    qiRequirement: '10000',
    qiPerSecond: '100',
    baseStats: {
      hp: '2500',
      atk: '250',
      def: '125',
      crit: 12,
      critDmg: 175,
      dodge: 12,
      regen: '25',
      speed: 1.2,
    },
  },
  {
    index: 3,
    name: 'Nascent Soul',
    majorRealm: 'Spiritual',
    substages: 6,
    qiRequirement: '100000',
    qiPerSecond: '1000',
    baseStats: {
      hp: '12500',
      atk: '1250',
      def: '625',
      crit: 15,
      critDmg: 190,
      dodge: 15,
      regen: '125',
      speed: 1.3,
    },
  },
  {
    index: 4,
    name: 'Soul Transformation',
    majorRealm: 'Spiritual',
    substages: 6,
    qiRequirement: '1000000',
    qiPerSecond: '10000',
    baseStats: {
      hp: '62500',
      atk: '6250',
      def: '3125',
      crit: 18,
      critDmg: 200,
      dodge: 18,
      regen: '625',
      speed: 1.4,
    },
  },
  {
    index: 5,
    name: 'Void Refinement',
    majorRealm: 'Immortal',
    substages: 6,
    qiRequirement: '10000000',
    qiPerSecond: '100000',
    baseStats: {
      hp: '312500',
      atk: '31250',
      def: '15625',
      crit: 22,
      critDmg: 215,
      dodge: 22,
      regen: '3125',
      speed: 1.5,
    },
  },
  {
    index: 6,
    name: 'Dao Integration',
    majorRealm: 'Immortal',
    substages: 3,
    qiRequirement: '100000000',
    qiPerSecond: '1000000',
    baseStats: {
      hp: '1562500',
      atk: '156250',
      def: '78125',
      crit: 25,
      critDmg: 225,
      dodge: 25,
      regen: '15625',
      speed: 1.6,
    },
  },
  {
    index: 7,
    name: 'Mahayana',
    majorRealm: 'Immortal',
    substages: 3,
    qiRequirement: '1000000000',
    qiPerSecond: '10000000',
    baseStats: {
      hp: '7812500',
      atk: '781250',
      def: '390625',
      crit: 30,
      critDmg: 240,
      dodge: 30,
      regen: '78125',
      speed: 1.7,
    },
  },
  {
    index: 8,
    name: 'Tribulation',
    majorRealm: 'Transcendent',
    substages: 9,
    qiRequirement: '10000000000',
    qiPerSecond: '100000000',
    baseStats: {
      hp: '39062500',
      atk: '3906250',
      def: '1953125',
      crit: 35,
      critDmg: 260,
      dodge: 35,
      regen: '390625',
      speed: 1.8,
    },
  },
];

/**
 * Path modifiers for different cultivation paths
 */
export const PATH_MODIFIERS: Record<string, PathModifiers> = {
  heaven: {
    qiMultiplier: 1.5,      // 50% more Qi generation
    hpMultiplier: 0.8,       // 20% less HP
    atkMultiplier: 1.3,      // 30% more attack
    defMultiplier: 0.9,      // 10% less defense
    critBonus: 10,           // +10% crit chance
    dodgeBonus: 5,           // +5% dodge
  },
  earth: {
    qiMultiplier: 1.0,       // Normal Qi generation
    hpMultiplier: 1.5,       // 50% more HP
    atkMultiplier: 0.9,      // 10% less attack
    defMultiplier: 1.4,      // 40% more defense
    critBonus: 0,            // No crit bonus
    dodgeBonus: 0,           // No dodge bonus
  },
  martial: {
    qiMultiplier: 1.2,       // 20% more Qi generation
    hpMultiplier: 1.2,       // 20% more HP
    atkMultiplier: 1.5,      // 50% more attack
    defMultiplier: 1.0,      // Normal defense
    critBonus: 15,           // +15% crit chance
    dodgeBonus: 10,          // +10% dodge
  },
};

/**
 * Focus mode modifiers for cultivation
 */
export const FOCUS_MODE_MODIFIERS: Record<string, FocusModeModifiers> = {
  balanced: {
    qiMultiplier: 1.0,
    hpMultiplier: 1.0,
    atkMultiplier: 1.0,
    defMultiplier: 1.0,
  },
  body: {
    qiMultiplier: 0.8,       // 20% less Qi generation
    hpMultiplier: 1.5,       // 50% more HP
    atkMultiplier: 1.2,      // 20% more attack
    defMultiplier: 1.3,      // 30% more defense
  },
  spirit: {
    qiMultiplier: 1.5,       // 50% more Qi generation
    hpMultiplier: 0.8,       // 20% less HP
    atkMultiplier: 0.9,      // 10% less attack
    defMultiplier: 0.9,      // 10% less defense
  },
};

/**
 * Upgrade costs and multipliers
 */
export const UPGRADE_COSTS = {
  idle: {
    baseCost: '1000',
    costMultiplier: 1.5,
    effectPerTier: 0.1,      // +10% Qi/s per tier
  },
  damage: {
    baseCost: '2000',
    costMultiplier: 1.6,
    effectPerTier: 0.15,     // +15% damage per tier
  },
  hp: {
    baseCost: '1500',
    costMultiplier: 1.55,
    effectPerTier: 0.12,     // +12% HP per tier
  },
};

/**
 * Breakthrough requirements
 * Multiplier for Qi needed to advance substages
 */
export const BREAKTHROUGH_QI_MULTIPLIER = 2.5;

/**
 * Initial game state values
 */
export const INITIAL_REALM = {
  index: 0,
  substage: 1,
  name: 'Qi Condensation',
};

export const INITIAL_STATS = {
  hp: '100',
  maxHp: '100',
  atk: '10',
  def: '5',
  crit: 5,
  critDmg: 150,
  dodge: 5,
  regen: '1',
  speed: 1.0,
};

/**
 * Game tick rate (milliseconds)
 */
export const TICK_RATE = 100; // 100ms = 10 ticks per second

/**
 * Maximum offline time to process (in milliseconds)
 * Prevents excessive calculations for very long offline periods
 */
export const MAX_OFFLINE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Game information
 */
export const GAME_VERSION = '1.0.0';
export const GAME_TITLE = 'Cultivation Idle';

/**
 * Save system constants
 */
export const SAVE_KEY = 'cultivation-idle-save-v3';
export const SAVE_ENCRYPTION_KEY = 'ImmortalCultivationSecretKey2025';
export const NUM_BACKUP_SAVES = 3;
export const AUTOSAVE_INTERVAL = 60000; // 60 seconds

/**
 * Offline progress constants
 */
export const MAX_OFFLINE_HOURS = 12;
export const DEFAULT_OFFLINE_EFFICIENCY = 0.5;

/**
 * Combat constants
 */
export const DEFENSE_CONSTANT_K = 100; // For damage reduction formula
export const BOSS_CHEST_COOLDOWN = 60; // seconds
export const MAX_COMBAT_LOG_ENTRIES = 100;
export const BASE_ATTACK_INTERVAL = 1000; // ms
export const ENEMY_ATTACK_INTERVAL = 1500; // ms

/**
 * Inventory constants
 */
export const MAX_INVENTORY_SLOTS = 20;

/**
 * Substage names
 */
export const SUBSTAGE_NAMES = ['Early', 'Middle', 'Late'] as const;

/**
 * Spirit Root multipliers by grade
 */
export const SPIRIT_ROOT_MULTIPLIERS: Record<number, number> = {
  1: 1.0,   // Mortal - no bonus
  2: 1.25,  // Common - +25% Qi/s
  3: 1.5,   // Uncommon - +50% Qi/s
  4: 2.0,   // Rare - +100% Qi/s
  5: 3.0,   // Legendary - +200% Qi/s
};

/**
 * Element stat bonuses
 */
export const ELEMENT_BONUSES = {
  fire: { atk: 0.2, def: -0.1 },
  water: { hp: 0.2, dodge: 0.1 },
  earth: { def: 0.3, critRate: -0.1 },
  metal: { critRate: 0.2, atk: 0.1 },
  wood: { hpRegen: 0.1, qiPerSecond: 0.1 },
} as const;

/**
 * Prestige AP calculation constants
 */
export const PRESTIGE_AP_BASE = 20;
export const PRESTIGE_AP_PER_REALM = 10;
export const PRESTIGE_AP_PER_BOSS = 5;
export const PRESTIGE_AP_TIME_BONUS_BASE = 50;
export const PRESTIGE_AP_TIME_BONUS_DECAY = 2; // Per hour
export const PRESTIGE_AP_AURA_DIVISOR = 10;

/**
 * Item rarity colors (for UI)
 */
export const RARITY_COLORS = {
  common: '#9ca3af',     // Gray
  uncommon: '#22c55e',   // Green
  rare: '#3b82f6',       // Blue
  epic: '#a855f7',       // Purple
  legendary: '#f59e0b',  // Orange/Gold
  mythic: '#ef4444',     // Red
} as const;
