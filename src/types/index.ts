/**
 * Cultivation path types
 */
export type CultivationPath = 'heaven' | 'earth' | 'martial';

/**
 * Focus mode for cultivation
 */
export type FocusMode = 'balanced' | 'body' | 'spirit';

/**
 * Realm information
 */
export interface Realm {
  index: number;
  substage: number;
  name: string;
}

/**
 * Player combat and cultivation stats
 */
export interface PlayerStats {
  hp: string;           // Current HP (Decimal string)
  maxHp: string;        // Max HP (Decimal string)
  atk: string;          // Attack power (Decimal string)
  def: string;          // Defense (Decimal string)
  crit: number;         // Critical hit chance (0-100)
  critDmg: number;      // Critical damage multiplier (%)
  dodge: number;        // Dodge chance (0-100)
  regen: string;        // HP regeneration per second (Decimal string)
  speed: number;        // Attack speed
}

export type BuffStat = 'atk' | 'def' | 'crit_chance' | 'absorption';

export interface ActiveBuff {
  id: string;
  stat: BuffStat;
  value: number;
  expiresAt: number;
  remainingShield?: string;
}

/**
 * Upgrade tier levels
 */
export interface UpgradeTiers {
  idle: number;         // Idle cultivation upgrade tier
  damage: number;       // Damage upgrade tier
  hp: number;           // HP upgrade tier
}

/**
 * Realm definition with requirements and bonuses
 */
export interface RealmDefinition {
  index: number;
  name: string;
  majorRealm: string;
  substages: number;
  qiRequirement: string;        // Qi required for each substage (Decimal string)
  qiPerSecond: string;          // Base Qi/s for this realm (Decimal string)
  baseStats: {
    hp: string;
    atk: string;
    def: string;
    crit: number;
    critDmg: number;
    dodge: number;
    regen: string;
    speed: number;
  };
}

/**
 * Path modifier for stats and qi generation
 */
export interface PathModifiers {
  qiMultiplier: number;
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  critBonus: number;
  dodgeBonus: number;
}

/**
 * Focus mode modifiers
 */
export interface FocusModeModifiers {
  qiMultiplier: number;
  hpMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
}

/**
 * Pity system state for loot drops
 */
export interface PityState {
  killsSinceUncommon: number;
  killsSinceRare: number;
  killsSinceEpic: number;
  killsSinceLegendary: number;
}

/**
 * Main game state
 */
export interface GameState {
  // Core progression
  realm: Realm;
  qi: string;                           // Current Qi (Decimal string)
  qiPerSecond: string;                  // Qi generation rate (Decimal string)

  // Player stats
  stats: PlayerStats;
  activeBuffs: ActiveBuff[];
  absorptionShield: string;
  absorptionExpiresAt: number | null;

  // Cultivation choices
  selectedPath: CultivationPath | null;
  focusMode: FocusMode;
  pathPerks: string[];                  // Selected path perk IDs

  // Progression tracking
  totalAuras: number;                   // Total breakthroughs achieved
  upgradeTiers: UpgradeTiers;

  // Loot system
  pityState: PityState;                 // Pity counter for guaranteed drops
  playerLuck: number;                   // Luck stat for loot drop chance

  // Time management
  lastTickTime: number;                 // Timestamp of last tick
  runStartTime: number;                 // Timestamp when current run started (for prestige)

  // Actions
  tick: (deltaTime: number) => void;
  setFocusMode: (mode: FocusMode) => void;
  selectPath: (path: CultivationPath) => void;
  selectPerk: (perkId: string) => boolean;
  breakthrough: () => boolean;
  calculateQiPerSecond: () => void;
  calculatePlayerStats: () => void;
  addBuff: (buff: { id: string; stat: BuffStat; value: number; duration: number }) => void;
  removeExpiredBuffs: () => void;
  applyAbsorptionShield: (
    damage: string
  ) => {
    remainingDamage: string;
    absorbed: string;
  };
  resetRun: () => void;
  performPrestigeReset: () => void;
  purchaseUpgrade: (type: 'idle' | 'damage' | 'hp') => boolean;
  getBreakthroughRequirement: () => string;
}

/**
 * Save data structure
 */
export interface SaveData {
  version: string;              // Save format version
  timestamp: number;            // When save was created

  // Game state
  gameState: {
    realm: Realm;
    qi: string;
    selectedPath: CultivationPath | null;
    focusMode: FocusMode;
    pathPerks: string[];
    totalAuras: number;
    upgradeTiers: UpgradeTiers;
    pityState: PityState;
    playerLuck: number;
  };

  // Inventory state
  inventoryState: {
    items: InventoryItem[];
    equippedWeapon: ItemDefinition | null;
    equippedAccessory: ItemDefinition | null;
    gold: string;
    maxSlots: number;
  };

  // Combat settings (not combat state, just settings)
  combatSettings: {
    autoAttack: boolean;
    autoCombatAI: boolean;
  };

  // Zone progression
  zoneState: {
    unlockedZones: string[];
    zoneProgress: Record<string, {
      enemiesDefeated: number;
      enemyKills: Record<string, number>;
      bossDefeated: boolean;
      completed: boolean;
      firstClearTime?: number;
    }>;
  };
}

/**
 * Enemy definition
 */
export interface EnemyDefinition {
  id: string;
  name: string;
  level: number;
  zone: string;
  hp: string;              // Max HP (Decimal string)
  atk: string;             // Attack power (Decimal string)
  def: string;             // Defense (Decimal string)
  crit: number;            // Critical hit chance (0-100)
  critDmg: number;         // Critical damage multiplier (%)
  dodge: number;           // Dodge chance (0-100)
  speed: number;           // Attack speed
  goldReward: string;      // Gold dropped on defeat (Decimal string)
  expReward: string;       // Experience gained (Decimal string)
  lootTable?: LootDrop[];  // Possible item drops
  isBoss?: boolean;        // Is this a boss enemy
}

export interface EnemyMechanic {
  type: 'shield' | 'aura' | 'enrage';
  trigger: { hpPercent: number };
  effect: { shieldAmount?: number; auraDamagePerSec?: number };
  description?: string;
}

/**
 * Loot drop definition
 */
export interface LootDrop {
  itemId: string;
  dropChance: number;      // Probability (0-100)
  minAmount: number;
  maxAmount: number;
}

/**
 * Combat log entry
 */
export interface CombatLogEntry {
  type: 'player' | 'enemy' | 'system' | 'damage' | 'heal' | 'loot' | 'victory' | 'defeat';
  text: string;
  timestamp: number;
  color: string;
}

/**
 * Combat state
 */
export interface CombatState {
  // Combat status
  inCombat: boolean;
  currentZone: string | null;
  currentEnemy: EnemyDefinition | null;

  // HP tracking
  playerHP: string;        // Current player HP (Decimal string)
  playerMaxHP: string;     // Max player HP (Decimal string)
  enemyHP: string;         // Current enemy HP (Decimal string)
  enemyMaxHP: string;      // Max enemy HP (Decimal string)

  // Combat log
  combatLog: CombatLogEntry[];

  // Settings
  autoAttack: boolean;
  autoCombatAI: boolean;

  // Timing
  lastAttackTime: number;
  lastEnemyAttackTime: number;
  techniquesCooldowns: Record<string, number>;

  // Boss mechanics
  isBoss: boolean;
  combatStartTime: number;

  // Enemy mechanics
  enemyMechanics: EnemyMechanic[];
  activeAura: { damagePerSec: number; description?: string } | null;

  // Actions
  enterCombat: (zone: string, enemy: EnemyDefinition) => void;
  exitCombat: () => void;
  playerAttack: () => void;
  enemyAttack: () => void;
  defeatEnemy: () => void;
  playerDefeat: () => void;
  tick: (deltaTime: number) => void;
  addLogEntry: (type: CombatLogEntry['type'], text: string, color: string) => void;
  setAutoAttack: (enabled: boolean) => void;
  setAutoCombatAI: (enabled: boolean) => void;
}

/**
 * Item type categories
 */
export type ItemType = 'weapon' | 'accessory' | 'consumable' | 'material' | 'treasure';

/**
 * Item rarity tiers
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * Item definition (blueprint)
 */
export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;

  // Equipment stats (if applicable)
  stats?: {
    hp?: string;           // Bonus HP (Decimal string)
    atk?: string;          // Bonus attack (Decimal string)
    def?: string;          // Bonus defense (Decimal string)
    crit?: number;         // Bonus crit chance (0-100)
    critDmg?: number;      // Bonus crit damage (%)
    dodge?: number;        // Bonus dodge (0-100)
    qiGain?: number;       // Qi gain multiplier (%)
  };

  // Consumable effects (if applicable)
  consumable?: {
    healHP?: string;       // HP to restore (Decimal string)
    healPercent?: number;  // HP to restore (% of max)
    buffDuration?: number; // Buff duration in seconds
    buffStats?: {
      atk?: number;        // Temporary attack % bonus
      def?: number;        // Temporary defense % bonus
      crit?: number;       // Temporary crit % bonus
    };
  };

  // Value and usage
  value: string;           // Sell price (Decimal string)
  stackable: boolean;
  maxStack: number;
}

/**
 * Inventory item instance
 */
export interface InventoryItem {
  id: string;              // Unique instance ID
  itemId: string;          // Reference to ItemDefinition
  quantity: number;
}

/**
 * Equipment bonus stats
 */
export interface EquipmentStats {
  hp: string;
  atk: string;
  def: string;
  crit: number;
  critDmg: number;
  dodge: number;
  qiGain: number;
}

/**
 * Inventory state
 */
export interface InventoryState {
  // Items
  items: InventoryItem[];

  // Equipment
  equippedWeapon: ItemDefinition | null;
  equippedAccessory: ItemDefinition | null;

  // Currency
  gold: string;            // Gold amount (Decimal string)

  // Capacity
  maxSlots: number;

  // Actions
  addItem: (itemId: string, quantity: number) => boolean;
  removeItem: (itemId: string, quantity: number) => boolean;
  equipWeapon: (itemId: string) => boolean;
  unequipWeapon: () => boolean;
  equipAccessory: (itemId: string) => boolean;
  unequipAccessory: () => boolean;
  useConsumable: (itemId: string) => boolean;
  addGold: (amount: string) => void;
  removeGold: (amount: string) => boolean;
  getEquipmentStats: () => EquipmentStats;
  getItemCount: (itemId: string) => number;
  hasItem: (itemId: string, quantity?: number) => boolean;
  resetInventory: () => void;
}

/**
 * Spirit root element types
 */
export type SpiritRootElement = 'fire' | 'water' | 'earth' | 'metal' | 'wood';

/**
 * Spirit root quality grade
 */
export type SpiritRootGrade = 1 | 2 | 3 | 4 | 5; // 1=Mortal, 2=Common, 3=Uncommon, 4=Rare, 5=Legendary

/**
 * Spirit root definition
 */
export interface SpiritRoot {
  grade: SpiritRootGrade;
  element: SpiritRootElement;
  purity: number;          // 0-100, affects stat bonuses
}

/**
 * AP (Ascension Points) upgrades
 */
export interface APUpgrades {
  qiGain: number;          // Increases Qi generation
  combatPower: number;     // Increases combat stats
  cultivation: number;     // Reduces breakthrough costs
  luckBonus: number;       // Increases item drop rates
}

/**
 * Prestige state
 */
export interface PrestigeState {
  // Prestige progress
  totalRebirths: number;
  availableAP: number;     // Available Ascension Points
  lifetimeAP: number;      // Total AP ever earned

  // Spirit root (set once per rebirth)
  spiritRoot: SpiritRoot | null;

  // AP upgrades
  apUpgrades: APUpgrades;

  // Run tracking
  runStartTime: number;
  highestRealmReached: number;
  bossesDefeated: number;

  // Actions
  calculateAPGain: () => number;
  rebirth: () => number;
  purchaseAPUpgrade: (type: keyof APUpgrades) => boolean;
  setSpiritRoot: (spiritRoot: SpiritRoot) => boolean;
  getQiMultiplier: () => number;
  getCombatMultiplier: () => number;
  getCultivationMultiplier: () => number;
  getLuckBonus: () => number;
  updateHighestRealm: (realmIndex: number) => void;
  incrementBossesDefeated: () => void;
}
