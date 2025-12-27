/**
 * Cultivation path types
 */
export type CultivationPath = 'heaven' | 'earth' | 'martial';
export type LifePath = 'heaven' | 'earth' | 'martial';

/**
 * Focus mode for cultivation
 */
export type FocusMode = 'balanced' | 'body' | 'spirit';
export type BreathMode = 'balanced' | 'safe' | 'fast';

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
 *
 * Percentage-based values (crit, dodge) are stored on a 0-100 scale.
 * UI should format them using helpers like formatPercentFromValue to avoid scaling mistakes.
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

export interface Technique {
  id: string;
  name: string;
  description: string;
  path: CultivationPath;
  tier: number;
  intentCost: number;
  cooldown: number;
  lastUsed: number;
  proficiency: number;
  level: number;
  unlocked: boolean;
  effect: {
    type: 'damage' | 'heal' | 'buff' | 'debuff';
    value: number;
    duration?: number;
    stat?: BuffStat;
  };
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
  lifePath: LifePath | null;
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
  lastActiveTime: number;               // Timestamp when player was last active (for offline gains)
  runStartTime: number;                 // Timestamp when current run started (for prestige)

  // Actions
  tick: (deltaTime: number) => void;
  setFocusMode: (mode: FocusMode) => void;
  selectPath: (path: CultivationPath) => void;
  setLifePath: (path: LifePath) => void;
  canChangeLifePath: () => boolean;
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
  hardResetGameState: () => void;
}

/**
 * Save data structure
 */
export type TechniqueSlotType = 'active' | 'passive' | 'ultimate';
export type AiProfile = 'balanced' | 'survivor' | 'burst' | 'farmer';
export type CastingPolicy = 'aggressive' | 'balanced' | 'defensive';

export interface SaveTechniqueLoadout {
  id: string;
  name: string;
  aiProfile: AiProfile;
  castingPolicy?: CastingPolicy;
  slots: {
    active: string[];
    passive: string[];
    ultimate: string | null;
  };
}

export interface SaveRewardBundle {
  currencies?: {
    gold?: string;
    spiritStones?: string;
    merit?: string;
  };
  items?: Array<{ itemId: string; qty: number }>;
  techniqueFragments?: Array<{ techId: string; qty: number }>;
  comprehension?: number;
}

export interface SaveBountyInstance {
  instanceId: string;
  cityId: string;
  cityIndex: number;
  templateId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  kind: 'OUTSKIRTS_KILL' | 'OUTSKIRTS_BOSS_KILL' | 'RUINS_ROOM_CLEAR' | 'RUINS_RUN_CLEAR' | 'TRIAL_CLEAR';
  title: string;
  description: string;
  progress: number;
  target: number;
  claimed: boolean;
  rewards: SaveRewardBundle;
  createdAt: number;
}

export interface SaveExpeditionRun {
  slotIndex: number;
  expeditionTypeId: string;
  durationId: string;
  cityId: string;
  cityIndex: number;
  startedAt: number;
  endsAt: number;
  status: 'running' | 'complete';
}

export interface SaveHeartLawState {
  selectedHeartLawId: string | null;
  chapter: number;
  comprehension: number;
  unlockedHeartLawIds: string[];
  breathMode: BreathMode;
  studyTechniqueId: string | null;
  lastInsightAt: number | null;
}

export interface SaveActivityState {
  active: {
    type: string;
    cityId?: string;
    sourceId?: string;
    startedAt: number;
    payload?: Record<string, unknown>;
  } | null;
  lastChangedAt?: number | null;
  history?: {
    previous: SaveActivityState['active'];
    next: SaveActivityState['active'];
    changedAt: number;
    reason?: string;
  }[];
}

export interface SaveOutskirtsState {
  progressByOutskirtsId: Record<
    string,
    {
      killsSinceBoss: number;
      totalKills: number;
      bossDefeated: boolean;
    }
  >;
}

export interface SaveManualSatchelEntry {
  id: string;
  pavilionId?: string | null;
  cityId?: string | null;
  techId: string;
  grade: 'mortal' | 'earth' | 'heaven' | 'mystic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  acquiredAt: number;
}

export interface SaveActiveManualStudy {
  studyId: string;
  manual: SaveManualSatchelEntry;
  startedAt: number;
  endsAt: number;
  focusUsed: boolean;
  focusReward?: 'time' | 'mastery' | 'traitQuality';
  focusAppliedAt?: number;
  completionHandled?: boolean;
}

export interface SaveManualSatchelState {
  manuals: SaveManualSatchelEntry[];
  activeStudy: SaveActiveManualStudy | null;
  lastLearned?: { techId: string; grade: SaveManualSatchelEntry['grade']; rarity: SaveManualSatchelEntry['rarity']; focusReward?: 'time' | 'mastery' | 'traitQuality'; learnedAt: number } | null;
}

export interface SaveData {
  version: string;              // Save format version
  timestamp: number;            // When save was created
  meta?: {
    lastActiveAtMs: number;
  };

  // Game state
  gameState: {
    realm: Realm;
    qi: string;
    spiritRoot?: SpiritRoot | null;
    selectedPath: CultivationPath | null;
    lifePath?: LifePath | null;
    focusMode: FocusMode;
    pathPerks: string[];
    totalAuras: number;
    upgradeTiers: UpgradeTiers;
    pityState: PityState;
    playerLuck: number;
    lastTickTime?: number;
    lastActiveTime?: number;
    runStartTime?: number;
  };

  // Prestige state
  prestigeState?: {
    totalAP: number;
    lifetimeAP: number;
    currentRunAP: number;
    prestigeCount: number;
    prestigeRuns: PrestigeRun[];
    purchasesById: Record<string, number>;
    highestRealmReached: number;
    runStartTime: number;
    rerollCount: number;
    spiritRoot: SpiritRoot | null;
  };

  // Inventory state
  inventoryState: {
    currencies: {
      gold: string;
      spiritStones: string;
      merit: string;
    };
    items: Record<string, number>;
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

  // City progression
  cityState?: {
    currentCityId: string | null;
    unlockedCityIds: string[];
    selectedModuleByCity: Record<string, string>;
    cityFlagsById: Record<
      string,
      {
        outskirtsBossDefeated: boolean;
        gateTrialCleared: boolean;
        ruinsCleared: boolean;
      }
    >;
    initializedFromContent?: boolean;
  };

  manualPavilionState: ManualPavilionSaveState;
  manualSatchelState: SaveManualSatchelState;

  activityState?: SaveActivityState;

  outskirtsState?: SaveOutskirtsState;

  bountyState?: {
    activeByCityId: Record<string, SaveBountyInstance[]>;
    lastRefreshAtByCityId: Record<string, number>;
  };

  expeditionState?: {
    slots: number;
    active: SaveExpeditionRun[];
  };

  heartLawState?: SaveHeartLawState;

  // Technique progression
  techniqueState: {
    loadouts: SaveTechniqueLoadout[];
    selectedLoadoutId: string;
  };

  techCollectionState?: {
    unlockedTechs: Record<
      string,
      {
        unlocked: boolean;
        masteryXp: number;
        rank: number;
        manualGrade?: 'mortal' | 'earth' | 'heaven' | 'mystic';
        rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
        traits?: Array<{ id: string; value: number }>;
        runes?: Array<string | null>;
        tier?: string;
        lastCastAt?: number;
        unlockedAt?: number;
        favorite?: boolean;
      }
    >;
    fragments: Record<string, number>;
    rngSeed?: number;
  };

  // Trial progression
  trialState?: {
    progressByTrialId: Record<
      string,
      {
        attempts: number;
        cleared: boolean;
        lastAttemptAt: number | null;
        lastClearAt: number | null;
      }
    >;
  };

  // Ruins progression
  ruinsState?: {
    progressByRuinId: Record<
      string,
      {
        totalRuns: number;
        totalRoomsCleared: number;
        bossKills: number;
        bestRunSeconds?: number;
        lastRun?: { endedAt: number; victory: boolean; roomsCleared: number; seconds: number };
      }
    >;
    autoRepeatDefault?: boolean;
  };

  // Shop state
  shopState?: {
    dayKey: string;
    purchasedToday: Record<string, Record<string, number>>;
  };

  equipmentState?: {
    equippedWeaponId: string | null;
    equippedAccessoryId: string | null;
    refineLevelBySlot: {
      weapon: number;
      accessory: number;
    };
  };

  buffState?: {
    activeTalismans: Array<{
      id: string;
      itemId: string;
      startedAt: number;
      endsAt: number;
      bonuses: {
        goldDropBonusPct?: number;
        matDropBonusPct?: number;
        fragmentDropBonusPct?: number;
        damageBonusPct?: number;
      };
    }>;
  };

  // Profession state
  professionState?: {
    alchemyQueue: Array<{
      id: string;
      recipeId: string;
      qty: number;
      startedAt: number;
      endsAt: number;
    }>;
    talismanQueue: Array<{
      id: string;
      recipeId: string;
      qty: number;
      startedAt: number;
      endsAt: number;
    }>;
    forgeQueue: Array<{
      id: string;
      blueprintId: string;
      qty: number;
      startedAt: number;
      endsAt: number;
      targetSlot?: 'weapon' | 'accessory';
    }>;
    lastTickAt: number;
  };
}

export interface PrestigeUpgradeEffect {
  type: 'multiplier' | 'unlock' | 'flat_bonus';
  stat?: string;
  value?: number;
  valuePerLevel?: number;
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: PrestigeUpgradeEffect;
}

export interface PrestigeRun {
  runNumber: number;
  realmReached: number;
  apGained: number;
  timeSpent: number;
  timestamp: number;
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

export type CombatEventType =
  | 'HIT'
  | 'SKILL_CAST'
  | 'STATUS_APPLIED'
  | 'STATUS_TICK'
  | 'SHIELD_GAINED'
  | 'HEAL'
  | 'ENEMY_SPECIAL_TELEGRAPH'
  | 'LOOT_DROP'
  | 'BOSS_SPAWN'
  | 'BOSS_DEFEATED'
  | 'PLAYER_DEFEATED';

export type CombatEventSource = 'player' | 'enemy' | 'system';
export type CombatEventTarget = 'player' | 'enemy';

export type CombatEvent =
  | {
      id: string;
      at: number;
      type: 'HIT';
      source: CombatEventSource;
      target: CombatEventTarget;
      amount: string;
      isCrit: boolean;
      techniqueId?: string;
      absorbed?: string;
      kind?: 'basic' | 'technique' | 'aura' | 'boss_ultimate';
    }
  | {
      id: string;
      at: number;
      type: 'SKILL_CAST';
      techniqueId: string;
      source: 'ai' | 'manual' | 'system';
    }
  | {
      id: string;
      at: number;
      type: 'STATUS_APPLIED';
      statusId: string;
      stacks: number;
      durationSec?: number;
      refreshed?: boolean;
      techniqueId?: string;
      target?: CombatEventTarget;
    }
  | {
      id: string;
      at: number;
      type: 'STATUS_TICK';
      statusId: string;
      amount: string;
      target?: CombatEventTarget;
    }
  | {
      id: string;
      at: number;
      type: 'SHIELD_GAINED';
      amount: string;
      total?: string;
      durationSec?: number;
      techniqueId?: string;
    }
  | {
      id: string;
      at: number;
      type: 'HEAL';
      amount: string;
      techniqueId?: string;
    }
  | {
      id: string;
      at: number;
      type: 'ENEMY_SPECIAL_TELEGRAPH';
      specialId: string;
      resolvesInMs: number;
    }
  | {
      id: string;
      at: number;
      type: 'LOOT_DROP';
      itemId: string;
      qty: number;
      rarity: string;
      reason?: string;
    }
  | {
      id: string;
      at: number;
      type: 'BOSS_SPAWN';
      enemyId: string;
      enemyName?: string;
    }
  | {
      id: string;
      at: number;
      type: 'BOSS_DEFEATED';
      enemyId: string;
      enemyName?: string;
    }
  | {
      id: string;
      at: number;
      type: 'PLAYER_DEFEATED';
      enemyId?: string;
      enemyName?: string;
    };

/**
 * Combat log entry
 */
export interface CombatLogEntry {
  type: 'player' | 'enemy' | 'system' | 'damage' | 'heal' | 'loot' | 'victory' | 'defeat';
  text: string;
  timestamp: number;
  color: string;
}

export interface CombatTechniqueLogEntry {
  at: number;
  kind: 'cast' | 'effect' | 'warn';
  message: string;
  techId?: string;
}

export interface CombatShield {
  amount: number;
  expiresAt: number | null;
}

export interface CombatBuff {
  id: string;
  stat: string;
  mode: 'pct' | 'flat';
  value: number;
  endsAt: number;
}

export interface CombatResources {
  qi: number;
  maxQi: number;
  intent: number;
  maxIntent: number;
}

/**
 * Combat context
 *
 * This tags where the fight originated (city module), so reward formulas and
 * progression hooks can be applied without hard-coding per-screen logic.
 */
export type CombatContextType = 'outskirts' | 'trial' | 'ruins' | null;

export type CombatContext =
  | { type: null }
  | {
      type: 'outskirts';
      cityId?: string;
      sourceId?: string;
      cityIndex?: number;
      isBoss?: boolean;
    }
  | {
      type: 'trial';
      cityId: string;
      trialId: string;
      gateItemId: string;
      eligible: boolean;
    }
  | {
      type: 'ruins';
      cityId: string;
      sourceId: string;
      ruinsId?: string;
      runId: string;
      roomIndex: number;
      roomCount: number;
      isBoss?: boolean;
      cityIndex?: number;
    };

/**
 * Combat state
 */
export interface CombatState {
  // Combat status
  inCombat: boolean;
  currentZone: string | null;
  currentEnemy: EnemyDefinition | null;

  // Context
  combatContext: CombatContext;

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
  techniqueCooldowns: Record<string, number>;
  lastTechniqueCastAt: number;
  nextAiDecisionAt: number;

  // Technique runtime state
  combatShield: CombatShield | null;
  combatBuffs: CombatBuff[];
  combatResources: CombatResources;
  techniqueLog: CombatTechniqueLogEntry[];
  events: CombatEvent[];

  // Boss mechanics
  isBoss: boolean;
  combatStartTime: number;

  // Enemy mechanics
  enemyMechanics: EnemyMechanic[];
  activeAura: { damagePerSec: number; description?: string } | null;

  // Actions
  enterCombat: (zone: string, enemy: EnemyDefinition) => void;
  startCombat: (enemyTemplateId: string, context: CombatContext) => void;
  endCombat: (victory: boolean) => void;
  exitCombat: () => void;
  playerAttack: () => void;
  enemyAttack: () => void;
  defeatEnemy: () => void;
  playerDefeat: () => void;
  tick: (deltaTime: number) => void;
  canCastTechnique: (techId: string, now?: number) => boolean;
  castTechnique: (techId: string, now?: number, source?: 'ai' | 'manual') => boolean;
  addLogEntry: (type: CombatLogEntry['type'], text: string, color: string) => void;
  pushEvent: (event: CombatEvent) => void;
  clearEvents: () => void;
  setAutoAttack: (enabled: boolean) => void;
  setAutoCombatAI: (enabled: boolean) => void;
  resetCombat: () => void;
  hardResetCombat: () => void;
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
    restoreQi?: string;    // Qi to restore (Decimal string)
    restoreQiPercent?: number; // Qi to restore (% of breakthrough requirement)
    triggerBreakthrough?: boolean; // If true, attempts a breakthrough when used
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

export type CurrencyKey = 'gold' | 'spiritStones' | 'merit';

/**
 * Inventory state
 */
export interface InventoryState {
  currencies: Record<CurrencyKey, string>;
  items: Record<string, number>;
  gold: string;
  spiritStones: string;
  merit: string;

  addCurrency: (key: CurrencyKey, amount: string) => void;
  spendCurrency: (key: CurrencyKey, amount: string) => boolean;
  canAffordCurrency: (costs: Partial<Record<CurrencyKey, string>>) => boolean;
  spendCurrencies: (costs: Partial<Record<CurrencyKey, string>>) => boolean;

  addItem: (itemId: string, quantity: number) => boolean;
  removeItem: (itemId: string, quantity: number) => boolean;
  getQty: (itemId: string) => number;

  addGold: (amount: string) => void;
  addSpiritStones: (amount: string) => void;
  addMerit: (amount: string) => void;
  getItemCount: (itemId: string) => number;

  resetInventory: () => void;
  hardResetInventory: () => void;
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
import type { ManualPavilionSaveState } from '../features/manuals/pavilionStockTypes';
