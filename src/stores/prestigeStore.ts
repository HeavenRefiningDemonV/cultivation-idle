import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, SpiritRoot, SpiritRootElement, SpiritRootQuality } from '../types';
import { D, add } from '../utils/numbers';

/**
 * Lazy getter for game store to avoid circular dependency
 */
let _getGameStore: (() => GameState) | null = null;
export function setGameStoreGetter(getter: () => GameState) {
  _getGameStore = getter;
}

/**
 * Lazy getter for inventory store to avoid circular dependency
 */
let _getInventoryStore: (() => any) | null = null;
export function setInventoryStoreGetter(getter: () => any) {
  _getInventoryStore = getter;
}

/**
 * Lazy getter for dungeon store to avoid circular dependency
 */
let _getDungeonStore: (() => any) | null = null;
export function setDungeonStoreGetter(getter: () => any) {
  _getDungeonStore = getter;
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: {
    type: 'multiplier' | 'unlock' | 'flat_bonus';
    stat?: string;
    value?: number;
    valuePerLevel?: number;
  };
}

export interface PrestigeRun {
  runNumber: number;
  realmReached: number;
  apGained: number;
  timeSpent: number;
  timestamp: number;
}

interface PrestigeState {
  totalAP: number;
  lifetimeAP: number;
  currentRunAP: number;
  prestigeCount: number;
  prestigeRuns: PrestigeRun[];
  upgrades: Record<string, PrestigeUpgrade>;

  // Spirit root
  spiritRoot: SpiritRoot | null;
  rootFloorTier: SpiritRootQuality; // Minimum spirit root quality from upgrades

  // Run tracking for AP calculation
  highestRealmReached: number;
  bossesDefeated: number;
  totalQiEarned: string; // Decimal string

  // Methods
  calculateAPGain: () => number;
  canPrestige: () => boolean;
  performPrestige: () => void;
  purchaseUpgrade: (upgradeId: string) => boolean;
  getUpgradeEffect: (upgradeId: string) => number;
  initializeUpgrades: () => void;

  // Spirit root methods
  generateSpiritRoot: () => void;
  rerollSpiritRoot: () => boolean;
  upgradeRootQuality: () => void;
  getSpiritRootMultiplier: () => number;

  // Tracking methods
  updateHighestRealm: (realmIndex: number) => void;
  incrementBossesDefeated: () => void;
  addQiEarned: (amount: string) => void;
}

/**
 * Spirit root quality names (0-4)
 */
const QUALITY_NAMES = ['Mortal', 'Earth', 'Heaven', 'Mystic', 'Divine'];

/**
 * Spirit root quality multipliers (0-4)
 * Mortal=1.0x, Earth=1.25x, Heaven=1.5x, Mystic=2.0x, Divine=3.0x
 */
const QUALITY_MULTIPLIERS = [1.0, 1.25, 1.5, 2.0, 3.0];

/**
 * Available elements
 */
const ELEMENTS: SpiritRootElement[] = ['fire', 'water', 'earth', 'metal', 'wood'];

export const usePrestigeStore = create<PrestigeState>()(
  immer((set, get) => ({
    totalAP: 0,
    lifetimeAP: 0,
    currentRunAP: 0,
    prestigeCount: 0,
    prestigeRuns: [],
    upgrades: {},
    spiritRoot: null,
    rootFloorTier: 0,

    // Run tracking
    highestRealmReached: 0,
    bossesDefeated: 0,
    totalQiEarned: '0',

    /**
     * Calculate AP gain based on current run progress
     * Formula: highestRealm * 10 + floor(log10(totalQi)/2) + bosses * 5 + trials * 10
     */
    calculateAPGain: () => {
      const state = get();
      let ap = 0;

      // Base AP from highest realm reached (10 per realm)
      ap += state.highestRealmReached * 10;

      // Bonus from total Qi earned (logarithmic scaling)
      const totalQi = D(state.totalQiEarned);
      if (totalQi.gt(0)) {
        const log10Qi = totalQi.log(10).toNumber();
        ap += Math.floor(log10Qi / 2);
      }

      // Bonus from bosses defeated (5 per boss)
      ap += state.bossesDefeated * 5;

      // Bonus from trials/dungeons completed (10 per trial)
      if (_getDungeonStore) {
        try {
          const dungeonStore = _getDungeonStore();
          const dungeonProgress = dungeonStore.dungeonProgress || {};
          let trialsCompleted = 0;
          Object.values(dungeonProgress).forEach((progress: any) => {
            trialsCompleted += progress.totalClears || 0;
          });
          ap += trialsCompleted * 10;
        } catch (error) {
          // Dungeon store not available
        }
      }

      // Minimum 1 AP
      return Math.max(1, Math.floor(ap));
    },

    /**
     * Check if player can perform rebirth
     * Available after Foundation realm (realm index >= 1)
     */
    canPrestige: () => {
      const state = get();
      return state.highestRealmReached >= 1; // Foundation realm
    },

    /**
     * Perform rebirth reset
     * Preserves: totalAP, upgrades, rootFloorTier, totalRebirths
     * Resets: all game state, generates new spirit root
     */
    performPrestige: () => {
      const state = get();
      if (!state.canPrestige()) {
        console.log('[Prestige] Cannot rebirth yet - need Foundation realm');
        return;
      }

      // Calculate AP gained
      const apGained = state.calculateAPGain();
      const runStartTime = _getGameStore?.().runStartTime || Date.now();
      const runTime = (Date.now() - runStartTime) / 1000;

      const newRun: PrestigeRun = {
        runNumber: state.prestigeCount + 1,
        realmReached: state.highestRealmReached,
        apGained,
        timeSpent: runTime,
        timestamp: Date.now(),
      };

      console.log(`[Prestige] Rebirth #${state.prestigeCount + 1} - Gained ${apGained} AP`);

      // Update prestige state (permanent data)
      set((state) => {
        state.totalAP += apGained;
        state.lifetimeAP += apGained;
        state.currentRunAP = 0;
        state.prestigeCount += 1;
        state.prestigeRuns = [...state.prestigeRuns, newRun].slice(-10); // Keep last 10 runs

        // Reset run tracking
        state.highestRealmReached = 0;
        state.bossesDefeated = 0;
        state.totalQiEarned = '0';
      });

      // Generate new spirit root
      get().generateSpiritRoot();

      // Reset all game stores
      if (_getGameStore) {
        const gameStore = _getGameStore();
        if (gameStore.performPrestigeReset) {
          gameStore.performPrestigeReset();
        }
      }

      // Reset inventory store
      if (_getInventoryStore) {
        const inventoryStore = _getInventoryStore();
        if (inventoryStore.resetForPrestige) {
          inventoryStore.resetForPrestige();
        }
      }

      // Reset dungeon store
      if (_getDungeonStore) {
        const dungeonStore = _getDungeonStore();
        if (dungeonStore.resetForPrestige) {
          dungeonStore.resetForPrestige();
        }
      }

      console.log('[Prestige] Rebirth complete - new run started');
    },

    /**
     * Purchase a prestige upgrade with AP
     */
    purchaseUpgrade: (upgradeId: string) => {
      const state = get();
      const upgrade = state.upgrades[upgradeId];

      if (!upgrade) {
        console.log(`[Prestige] Upgrade ${upgradeId} not found`);
        return false;
      }
      if (upgrade.currentLevel >= upgrade.maxLevel) {
        console.log(`[Prestige] Upgrade ${upgradeId} already at max level`);
        return false;
      }
      if (state.totalAP < upgrade.cost) {
        console.log(`[Prestige] Not enough AP (need ${upgrade.cost}, have ${state.totalAP})`);
        return false;
      }

      set((state) => {
        state.totalAP -= upgrade.cost;
        const upg = state.upgrades[upgradeId];
        upg.currentLevel += 1;

        // Update root floor tier if upgrading Root Purification
        if (upgradeId === 'root_purification') {
          state.rootFloorTier = Math.min(upg.currentLevel, 4) as SpiritRootQuality;
        }
      });

      console.log(`[Prestige] Purchased ${upgrade.name} level ${upgrade.currentLevel}`);

      // Recalculate stats if needed
      if (_getGameStore) {
        const gameStore = _getGameStore();
        gameStore.calculatePlayerStats?.();
        gameStore.calculateQiPerSecond?.();
      }

      return true;
    },

    /**
     * Get the effect value of an upgrade
     */
    getUpgradeEffect: (upgradeId: string) => {
      const upgrade = get().upgrades[upgradeId];
      if (!upgrade || upgrade.currentLevel === 0) return 0;

      if (upgrade.effect.type === 'multiplier' && upgrade.effect.valuePerLevel) {
        return upgrade.effect.valuePerLevel * upgrade.currentLevel;
      }

      if (upgrade.effect.type === 'flat_bonus' && upgrade.effect.value) {
        return upgrade.effect.value * upgrade.currentLevel;
      }

      if (upgrade.effect.type === 'unlock') {
        return upgrade.currentLevel > 0 ? 1 : 0;
      }

      return 0;
    },

    /**
     * Initialize prestige shop upgrades
     */
    initializeUpgrades: () => {
      set((state) => {
        state.upgrades = {
          // 1. Idle Qi Multiplier (5 AP, +20%/level, max 10)
          idle_qi_mult: {
            id: 'idle_qi_mult',
            name: 'Cultivation Efficiency',
            description: '+20% Qi generation per level',
            cost: 5,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'qi_generation',
              valuePerLevel: 0.2,
            },
          },

          // 2. Body Training (5 AP, +10% HP/level, max 10)
          body_training: {
            id: 'body_training',
            name: 'Body Training',
            description: '+10% maximum HP per level',
            cost: 5,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'max_hp',
              valuePerLevel: 0.1,
            },
          },

          // 3. Martial Might (5 AP, +10% damage/level, max 10)
          martial_might: {
            id: 'martial_might',
            name: 'Martial Might',
            description: '+10% damage per level',
            cost: 5,
            maxLevel: 10,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'damage',
              valuePerLevel: 0.1,
            },
          },

          // 4. Meditation Mastery (10 AP, +10% offline/level, max 5)
          meditation_mastery: {
            id: 'meditation_mastery',
            name: 'Timeless Meditation',
            description: '+10% offline progress efficiency per level',
            cost: 10,
            maxLevel: 5,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'offline_mult',
              valuePerLevel: 0.1,
            },
          },

          // 5. Root Purification (20 AP, +1 min root tier, max 4)
          root_purification: {
            id: 'root_purification',
            name: 'Root Purification',
            description: '+1 minimum spirit root quality tier',
            cost: 20,
            maxLevel: 4,
            currentLevel: 0,
            effect: {
              type: 'flat_bonus',
              stat: 'root_floor',
              value: 1,
            },
          },

          // 6. Starting Technique (15 AP, unlock)
          starting_technique: {
            id: 'starting_technique',
            name: 'Inherited Technique',
            description: 'Start each run with a basic combat technique',
            cost: 15,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'starter_technique',
            },
          },

          // 7. Auto Battle Speed (10 AP, +25% speed, max 4)
          auto_battle_speed: {
            id: 'auto_battle_speed',
            name: 'Swift Combat',
            description: '+25% auto-battle speed per level',
            cost: 10,
            maxLevel: 4,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'auto_battle_speed',
              valuePerLevel: 0.25,
            },
          },

          // 8. Resource Retention (25 AP, keep 10% resources, max 1)
          resource_retention: {
            id: 'resource_retention',
            name: 'Karmic Wealth',
            description: 'Keep 10% of gold and materials on rebirth',
            cost: 25,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'resource_retention',
            },
          },

          // 9. Breakthrough Discount (15 AP, -20% gold costs, max 5)
          breakthrough_discount: {
            id: 'breakthrough_discount',
            name: 'Frugal Cultivation',
            description: '-20% gold cost for breakthroughs per level',
            cost: 15,
            maxLevel: 5,
            currentLevel: 0,
            effect: {
              type: 'multiplier',
              stat: 'breakthrough_discount',
              valuePerLevel: 0.2,
            },
          },

          // 10. Dual-Path Cultivation (100 AP, LOCKED)
          dual_path: {
            id: 'dual_path',
            name: 'Dual-Path Cultivation',
            description: 'LOCKED - Cultivate two paths simultaneously',
            cost: 100,
            maxLevel: 1,
            currentLevel: 0,
            effect: {
              type: 'unlock',
              stat: 'dual_path',
            },
          },
        };
      });

      console.log('[Prestige] Upgrades initialized');
    },

    /**
     * Generate a new spirit root based on root floor tier
     * Uses weighted random roll with quality 0-4
     */
    generateSpiritRoot: () => {
      const state = get();
      const floor = state.rootFloorTier;

      // Quality roll with weighted probabilities
      // 50% current floor, 30% floor+1, 20% floor+2
      const roll = Math.random();
      let quality: SpiritRootQuality = floor;

      if (roll < 0.50) {
        quality = floor; // 50% chance
      } else if (roll < 0.80) {
        quality = Math.min(floor + 1, 4) as SpiritRootQuality; // 30% chance
      } else {
        quality = Math.min(floor + 2, 4) as SpiritRootQuality; // 20% chance
      }

      // Element roll (equal chances)
      const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];

      set((state) => {
        state.spiritRoot = { quality, element };
      });

      console.log(`[SpiritRoot] Generated: ${QUALITY_NAMES[quality]} ${element} (${QUALITY_MULTIPLIERS[quality]}x)`);

      // Recalculate player stats with new spirit root
      if (_getGameStore) {
        const gameStore = _getGameStore();
        gameStore.calculatePlayerStats?.();
        gameStore.calculateQiPerSecond?.();
      }
    },

    /**
     * Reroll spirit root using gold
     * Cost: 1000 * 2^quality gold
     */
    rerollSpiritRoot: () => {
      const state = get();
      if (!state.spiritRoot || !_getInventoryStore) return false;

      // Cost scales with current quality
      const cost = 1000 * Math.pow(2, state.spiritRoot.quality);
      const inventoryStore = _getInventoryStore();

      // Check if player has enough gold
      if (inventoryStore.gold.lt(cost)) {
        console.log(`[SpiritRoot] Not enough gold to reroll (need ${cost})`);
        return false;
      }

      // Deduct gold
      if (!inventoryStore.removeGold(cost.toString())) {
        return false;
      }

      // Generate new spirit root
      get().generateSpiritRoot();
      console.log(`[SpiritRoot] Rerolled for ${cost} gold`);

      return true;
    },

    /**
     * Upgrade spirit root quality (for future implementation)
     */
    upgradeRootQuality: () => {
      // TODO: Implement spirit root quality upgrade mechanic
      console.log('[SpiritRoot] Quality upgrade not yet implemented');
    },

    /**
     * Get spirit root multiplier to all stats
     * Quality 0=1.0x, 1=1.25x, 2=1.5x, 3=2.0x, 4=3.0x
     */
    getSpiritRootMultiplier: () => {
      const state = get();
      if (!state.spiritRoot) return 1.0;
      return QUALITY_MULTIPLIERS[state.spiritRoot.quality];
    },

    /**
     * Update highest realm reached for AP calculation
     */
    updateHighestRealm: (realmIndex: number) => {
      set((state) => {
        if (realmIndex > state.highestRealmReached) {
          state.highestRealmReached = realmIndex;
          console.log(`[Prestige] New highest realm: ${realmIndex}`);
        }
      });
    },

    /**
     * Increment bosses defeated counter
     */
    incrementBossesDefeated: () => {
      set((state) => {
        state.bossesDefeated += 1;
      });
    },

    /**
     * Add Qi to total earned for AP calculation
     */
    addQiEarned: (amount: string) => {
      set((state) => {
        state.totalQiEarned = add(state.totalQiEarned, amount).toString();
      });
    },
  }))
);
