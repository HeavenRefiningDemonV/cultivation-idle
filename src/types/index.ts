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
 * Main game state
 */
export interface GameState {
  // Core progression
  realm: Realm;
  qi: string;                           // Current Qi (Decimal string)
  qiPerSecond: string;                  // Qi generation rate (Decimal string)

  // Player stats
  stats: PlayerStats;

  // Cultivation choices
  selectedPath: CultivationPath | null;
  focusMode: FocusMode;

  // Progression tracking
  totalAuras: number;                   // Total breakthroughs achieved
  upgradeTiers: UpgradeTiers;

  // Time management
  lastTickTime: number;                 // Timestamp of last tick

  // Actions
  tick: (deltaTime: number) => void;
  setFocusMode: (mode: FocusMode) => void;
  selectPath: (path: CultivationPath) => void;
  breakthrough: () => boolean;
  calculateQiPerSecond: () => void;
  calculatePlayerStats: () => void;
  resetRun: () => void;
  purchaseUpgrade: (type: 'idle' | 'damage' | 'hp') => boolean;
}

/**
 * Save data structure
 */
export interface SaveData {
  realm: Realm;
  qi: string;
  selectedPath: CultivationPath | null;
  focusMode: FocusMode;
  totalAuras: number;
  upgradeTiers: UpgradeTiers;
  lastSaveTime: number;
}
