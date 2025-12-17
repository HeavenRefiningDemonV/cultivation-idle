import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CombatState, CombatContext, EnemyDefinition, CombatLogEntry, EnemyMechanic } from '../types';
import type { OutskirtsDef, OutskirtsDropsConfig } from '../content';
import { useGameStore } from './gameStore';
import { useZoneStore } from './zoneStore';
import { useInventoryStore } from './inventoryStore';
import { useDungeonStore } from './dungeonStore';
import { useContentStore } from './contentStore';
import { useActivityStore } from './activityStore';
import { useOutskirtsStore } from './outskirtsStore';
import { useCityStore } from './cityStore';
import { useTrialStore } from './trialStore';
import { D, subtract, greaterThan, lessThanOrEqualTo, add, clamp } from '../utils/numbers';
import { BossMechanics } from '../systems/bossMechanics';
import { generateLoot, formatLootMessage } from '../systems/loot';
import { grantRewards, type RewardBundle, type RewardItemBundle } from '../systems/rewards';
import { createEnemy } from '../systems/enemyFactory';

interface DungeonBoss {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  crit?: number;
  critDmg?: number;
  dodge?: number;
  speed?: number;
  mechanics?: EnemyMechanic[];
}

interface DungeonData {
  id: string;
  name: string;
  tier: number;
  rewards: {
    gold?: number;
    exp?: number;
    guaranteedDrop?: { itemId: string; name: string };
  };
  boss: DungeonBoss;
}

/**
 * Defense constant for damage calculation
 * Damage = ATK * (1 - DEF/(DEF + K))
 */
const DEFENSE_CONSTANT_K = 100;

/**
 * Combat timing constants (in milliseconds)
 */
const PLAYER_ATTACK_COOLDOWN = 1000;  // 1 second between attacks
const ENEMY_ATTACK_COOLDOWN = 1500;   // 1.5 seconds between enemy attacks
const MAX_COMBAT_LOG_ENTRIES = 100;   // Limit log size for performance
const OUTSKIRTS_NEXT_FIGHT_DELAY_MS = 700;

/**
 * Boss mechanics instance (single instance per combat)
 */
let bossMechanics: BossMechanics | null = null;

function randomIntInRange(range: [number, number] | undefined, fallback: [number, number] = [0, 0]): number {
  const [minRaw, maxRaw] = Array.isArray(range) && range.length === 2 ? range : fallback;
  const min = Number.isFinite(minRaw) ? Number(minRaw) : fallback[0];
  const max = Number.isFinite(maxRaw) ? Number(maxRaw) : fallback[1];
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomFromList<T>(list: T[]): T | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? null;
}

function valueByIndex<T>(
  source: Record<number, T> | T[] | undefined,
  index: number,
  fallback: T,
): T {
  if (Array.isArray(source)) {
    return source[index] ?? source[source.length - 1] ?? fallback;
  }

  if (source && typeof source === 'object') {
    const byIndex = (source as Record<number, T>)[index];
    if (byIndex !== undefined) return byIndex;

    const values = Object.values(source as Record<number, T>);
    if (values.length > 0) return values[values.length - 1] ?? fallback;
  }

  return fallback;
}

function pickFromWeightedPool(
  pool: { enemyId: string; weight: number }[],
  fallbackId?: string,
): string | null {
  if (!Array.isArray(pool) || pool.length === 0) return fallbackId ?? null;
  const totalWeight = pool.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (totalWeight <= 0) return fallbackId ?? pool[0]?.enemyId ?? null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight ?? 0;
    if (roll <= 0) return entry.enemyId;
  }

  return pool[pool.length - 1]?.enemyId ?? fallbackId ?? null;
}

function collapseItems(items: RewardItemBundle[]): RewardItemBundle[] {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    if (!item?.itemId || typeof item.qty !== 'number' || item.qty <= 0) return;
    merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.qty);
  });

  return Array.from(merged.entries()).map(([itemId, qty]) => ({ itemId, qty }));
}

function buildOutskirtsRewards(
  outskirtsDef: OutskirtsDef,
  dropsConfig: OutskirtsDropsConfig | undefined,
  cityIndex: number,
  isBoss: boolean,
): RewardBundle {
  const idx = Math.max(0, cityIndex ?? 0);
  const drops = dropsConfig ?? {};

  const mobGoldRange = valueByIndex<[number, number]>(drops.mobGoldByCityIndex, idx, [2, 6]);
  const mobCommonChance = drops.mobCommonMatChance ?? 0.35;
  const mobDoubleChance = drops.mobDoubleMatChance ?? 0.1;
  const mobRareChance = drops.mobRareMatChance ?? 0.02;

  const bossGoldRange = valueByIndex<[number, number]>(drops.bossGoldByCityIndex, idx, [20, 40]);
  const bossMatCountRange = valueByIndex<[number, number]>(drops.bossMatCountRangeByCityIndex, idx, [2, 4]);
  const bossRareChance = valueByIndex(drops.bossRareMatChanceByCityIndex, idx, 0.1);
  const bossSpiritChance = valueByIndex(drops.bossSpiritStoneChanceByCityIndex, idx, 0);
  const bossSpiritRange = valueByIndex<[number, number]>(drops.bossSpiritStoneRangeByCityIndex, idx, [0, 0]);

  const bundle: RewardBundle = { currencies: {} };
  const items: RewardItemBundle[] = [];

  if (isBoss) {
    const gold = randomIntInRange(bossGoldRange, bossGoldRange);
    bundle.currencies = { ...bundle.currencies, gold: gold.toString() };

    const matCount = Math.max(0, randomIntInRange(bossMatCountRange, bossMatCountRange));
    const commonPool = outskirtsDef.matPools?.common ?? [];
    for (let i = 0; i < matCount; i += 1) {
      const mat = randomFromList(commonPool);
      if (mat) items.push({ itemId: mat, qty: 1 });
    }

    const rarePool = outskirtsDef.matPools?.rare ?? [];
    const rareChance = bossRareChance ?? 0;
    if (rarePool.length > 0 && Math.random() < rareChance) {
      const rareMat = randomFromList(rarePool);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }

    if (Math.random() < bossSpiritChance) {
      const spiritQty = randomIntInRange(bossSpiritRange, bossSpiritRange);
      if (spiritQty > 0) {
        bundle.currencies = { ...bundle.currencies, spiritStones: spiritQty.toString() };
      }
    }
  } else {
    const gold = randomIntInRange(mobGoldRange, mobGoldRange);
    bundle.currencies = { ...bundle.currencies, gold: gold.toString() };

    const commonPool = outskirtsDef.matPools?.common ?? [];
    const rarePool = outskirtsDef.matPools?.rare ?? [];

    const commonChance = mobCommonChance ?? 0;
    const doubleChance = mobDoubleChance ?? 0;
    const rareChance = mobRareChance ?? 0;

    if (commonPool.length > 0 && Math.random() < commonChance) {
      const mat = randomFromList(commonPool);
      if (mat) items.push({ itemId: mat, qty: 1 });
      if (Math.random() < doubleChance) {
        const second = randomFromList(commonPool);
        if (second) items.push({ itemId: second, qty: 1 });
      }
    }

    if (rarePool.length > 0 && Math.random() < rareChance) {
      const rareMat = randomFromList(rarePool);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }
  }

  const collapsedItems = collapseItems(items);
  if (collapsedItems.length > 0) {
    bundle.items = collapsedItems;
  }

  return bundle;
}

/**
 * Extended Combat State with dungeon support
 */
interface ExtendedCombatState extends CombatState {
  currentDungeon: string | null;
  startDungeonCombat: (dungeonId: string, boss: DungeonBoss, dungeonData: DungeonData) => void;
  resetCombat: () => void;
  hardResetCombat: () => void;
}

const createInitialCombatState = () => ({
  inCombat: false,
  currentZone: null as string | null,
  currentDungeon: null as string | null,
  currentEnemy: null as EnemyDefinition | null,
  combatContext: { type: null } as CombatContext,
  playerHP: '0',
  playerMaxHP: '0',
  enemyHP: '0',
  enemyMaxHP: '0',
  combatLog: [] as CombatLogEntry[],
  autoAttack: false,
  autoCombatAI: false,
  lastAttackTime: 0,
  lastEnemyAttackTime: 0,
  techniquesCooldowns: {} as Record<string, number>,
  isBoss: false,
  combatStartTime: 0,
  enemyMechanics: [] as EnemyMechanic[],
  activeAura: null as ExtendedCombatState['activeAura'],
});

/**
 * Combat store managing all combat state and actions
 */
export const useCombatStore = create<ExtendedCombatState>()(
  immer((set, get) => ({
    // Initial state
    ...createInitialCombatState(),

    /**
     * Enter combat with an enemy
     */
    enterCombat: (zone: string, enemy: EnemyDefinition) => {
      const playerStats = useGameStore.getState().stats;
      const now = Date.now();

      // Initialize boss mechanics if this is a boss
      const isBoss = enemy.isBoss || false;
      if (isBoss) {
        bossMechanics = new BossMechanics();
        console.log('[CombatStore] Boss mechanics initialized for', enemy.name);
      } else {
        bossMechanics = null;
      }

      set((state) => {
        state.inCombat = true;
        state.currentZone = zone;
        state.currentEnemy = enemy;
        state.combatContext = { type: null };
        state.enemyMechanics = (enemy as EnemyDefinition & { mechanics?: EnemyMechanic[] }).mechanics || [];
        state.activeAura = null;

        // Initialize HP
        state.playerHP = playerStats.hp;
        state.playerMaxHP = playerStats.maxHp;
        state.enemyHP = enemy.hp;
        state.enemyMaxHP = enemy.hp;

        // Clear combat log
        state.combatLog = [];

        // Reset timing
        state.lastAttackTime = now;
        state.lastEnemyAttackTime = now;

        // Boss tracking
        state.isBoss = isBoss;
        state.combatStartTime = now;
      });

      // Add entry to log
      if (isBoss) {
        get().addLogEntry('system', `⚠️ BOSS FIGHT: ${enemy.name}!`, '#f59e0b');
      } else {
        get().addLogEntry('system', `Combat started with ${enemy.name}!`, '#fbbf24');
      }
    },



    /**
     * Start combat from a content-driven enemy template.
     *
     * This is the foundation entrypoint for city modules (Outskirts / Trials / Ruins).
     * Enemy stats are currently derived from player stats with simple multipliers and
     * will be refined when module-specific scaling is implemented.
     */
    startCombat: (enemyTemplateId: string, context: CombatContext) => {
      const playerStats = useGameStore.getState().stats;
      const now = Date.now();
      const contentStore = useContentStore.getState();

      const template = contentStore.maps.enemiesById[enemyTemplateId];
      if (!template) {
        console.warn('[CombatStore] Unknown enemy template', enemyTemplateId);
        return;
      }

      const tags = Array.isArray(template?.tags) ? template!.tags : [];
      const role = typeof template?.role === 'string' ? template!.role : 'mob';
      const contextCityId = context && 'cityId' in context ? (context as any).cityId : undefined;
      const contextCityIndex = context && 'cityIndex' in context ? (context as any).cityIndex : undefined;
      const cityIndex = typeof contextCityIndex === 'number'
        ? contextCityIndex
        : contextCityId
          ? contentStore.maps.citiesById[contextCityId]?.index ?? 0
          : 0;

      const isBoss =
        (context && 'isBoss' in context ? (context as any).isBoss : undefined) ??
        (role === 'boss' || tags.includes('boss'));

      const enemyScaled = createEnemy(enemyTemplateId, {
        cityIndex,
        isBoss,
        playerPowerSnapshot: {
          atk: playerStats.atk,
          def: playerStats.def,
          maxHp: playerStats.maxHp,
        },
      });

      const enemy: EnemyDefinition & { mechanics?: EnemyMechanic[] } = {
        id: enemyScaled.id,
        name: enemyScaled.name,
        level: enemyScaled.level,
        zone: context?.type ? context.type : 'unknown',
        hp: enemyScaled.maxHp,
        atk: enemyScaled.atk,
        def: enemyScaled.def,
        crit: enemyScaled.critChance ?? (isBoss ? 10 : 5),
        critDmg: isBoss ? 170 : 150,
        dodge: enemyScaled.dodgeChance ?? (isBoss ? 6 : 4),
        speed: enemyScaled.speed ?? 1.0,
        goldReward: enemyScaled.goldDrop ?? '0',
        expReward: enemyScaled.exp ?? '0',
        isBoss: enemyScaled.isBoss,
        mechanics: enemyScaled.mechanics ?? (Array.isArray(template?.mechanics)
          ? (template!.mechanics as unknown as EnemyMechanic[])
          : []),
      };

      // Initialize boss mechanics if this is a boss
      if (enemy.isBoss) {
        bossMechanics = new BossMechanics();
        console.log('[CombatStore] Boss mechanics initialized for', enemy.name);
      } else {
        bossMechanics = null;
      }

      set((state) => {
        state.inCombat = true;
        state.currentZone = null;
        state.currentDungeon = null;
        state.currentEnemy = enemy;
        state.combatContext = context ?? { type: null };
        state.enemyMechanics = enemy.mechanics || [];
        state.activeAura = null;

        // Initialize HP
        state.playerHP = playerStats.hp;
        state.playerMaxHP = playerStats.maxHp;
        state.enemyHP = enemy.hp;
        state.enemyMaxHP = enemy.hp;

        // Clear combat log
        state.combatLog = [];

        // Reset timing
        state.lastAttackTime = now;
        state.lastEnemyAttackTime = now;

        // Boss tracking
        state.isBoss = isBoss;
        state.combatStartTime = now;
      });

      if (enemy.isBoss) {
        get().addLogEntry('system', `⚠️ BOSS FIGHT: ${enemy.name}!`, '#f59e0b');
      } else {
        get().addLogEntry('system', `Combat started with ${enemy.name}!`, '#fbbf24');
      }
    },

    /**
     * End combat via a simple victory/defeat flag.
     *
     * This is a convenience wrapper for module callers.
     */
    endCombat: (victory: boolean) => {
      if (!get().inCombat) return;
      if (victory) get().defeatEnemy();
      else get().playerDefeat();
    },
    /**
     * Start dungeon combat with a boss
     */
    startDungeonCombat: (dungeonId: string, boss: DungeonBoss, dungeonData: DungeonData) => {
      const playerStats = useGameStore.getState().stats;
      const now = Date.now();

      // Create enemy definition from dungeon boss
      const enemy: EnemyDefinition = {
        id: boss.id,
        name: boss.name,
        level: dungeonData.tier * 10 + 10,
        zone: dungeonId,
        hp: boss.hp.toString(),
        atk: boss.atk.toString(),
        def: boss.def.toString(),
        crit: boss.crit || 5,
        critDmg: boss.critDmg || 150,
        dodge: boss.dodge || 5,
        speed: boss.speed || 1.0,
        goldReward: '0', // Dungeon rewards handled separately
        expReward: '0',
        isBoss: true,
      };

      // Initialize boss mechanics (skip global mechanics for tier 0 dungeons to keep early fights fair)
      if (dungeonData.tier > 0) {
        bossMechanics = new BossMechanics();
        console.log('[CombatStore] Dungeon boss mechanics initialized for', boss.name);
      } else {
        bossMechanics = null;
        console.log('[CombatStore] Global boss mechanics disabled for tier 0 dungeon', boss.name);
      }

      // Start dungeon in dungeon store
      useDungeonStore.getState().startDungeon(dungeonId);

      set((state) => {
        state.inCombat = true;
        state.currentZone = null; // Not a zone fight
        state.currentDungeon = dungeonId;
        state.currentEnemy = enemy;
        state.combatContext = { type: null };
        state.enemyMechanics = dungeonData.boss.mechanics || [];
        state.activeAura = null;

        // Initialize HP
        state.playerHP = playerStats.hp;
        state.playerMaxHP = playerStats.maxHp;
        state.enemyHP = enemy.hp;
        state.enemyMaxHP = enemy.hp;

        // Clear combat log
        state.combatLog = [];

        // Reset timing
        state.lastAttackTime = now;
        state.lastEnemyAttackTime = now;

        // Boss tracking
        state.isBoss = true;
        state.combatStartTime = now;
      });

      // Add entry to log
      get().addLogEntry('system', `⚠️ DUNGEON TRIAL: ${dungeonData.name}!`, '#f59e0b');
      get().addLogEntry('system', `⚔️ BOSS: ${enemy.name}!`, '#ef4444');
    },

    /**
     * Exit combat and clean up state
     */
    exitCombat: () => {
      // Clean up boss mechanics
      bossMechanics = null;

      // Exit dungeon if in one
      if (get().currentDungeon) {
        useDungeonStore.getState().exitDungeon();
      }

      set((state) => {
        state.inCombat = false;
        state.currentZone = null;
        state.currentDungeon = null;
        state.currentEnemy = null;
        state.combatContext = { type: null };
        state.playerHP = '0';
        state.playerMaxHP = '0';
        state.enemyHP = '0';
        state.enemyMaxHP = '0';
        state.lastAttackTime = 0;
        state.lastEnemyAttackTime = 0;
        state.isBoss = false;
        state.combatStartTime = 0;
        state.enemyMechanics = [];
        state.activeAura = null;
      });
    },

    resetCombat: () => {
      bossMechanics = null;

      set((state) => {
        Object.assign(state, createInitialCombatState());
      });
    },

    hardResetCombat: () => {
      bossMechanics = null;
      set((state) => {
        Object.assign(state, createInitialCombatState());
      });
    },

    /**
     * Player attacks the current enemy
     */
    playerAttack: () => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return;

      const now = Date.now();
      if (now - state.lastAttackTime < PLAYER_ATTACK_COOLDOWN) return;

      if (lessThanOrEqualTo(state.enemyHP, 0) || lessThanOrEqualTo(state.playerHP, 0)) return;

      const gameStore = useGameStore.getState();
      const playerStats = gameStore.stats;
      const enemy = state.currentEnemy;

      // Check if enemy dodges
      const dodgeRoll = Math.random() * 100;
      if (dodgeRoll < enemy.dodge) {
        get().addLogEntry('player', `${enemy.name} dodged your attack!`, '#94a3b8');
        set((state) => {
          state.lastAttackTime = now;
        });
        return;
      }

      // Calculate base damage: ATK * (1 - DEF/(DEF + K))
      const atk = D(playerStats.atk);
      const def = D(enemy.def);
      const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
      const baseDamage = atk.times(D(1).minus(defReduction));

      // Check for critical hit
      const critRoll = Math.random() * 100;
      const isCrit = critRoll < playerStats.crit;
      let finalDamage = baseDamage;

      if (isCrit) {
        const critMultiplier = D(playerStats.critDmg).dividedBy(100);
        finalDamage = baseDamage.times(critMultiplier);
        get().addLogEntry(
          'damage',
          `Critical hit! You deal ${finalDamage.toFixed(0)} damage!`,
          '#f59e0b'
        );
      } else {
        get().addLogEntry(
          'player',
          `You deal ${finalDamage.toFixed(0)} damage.`,
          '#60a5fa'
        );
      }

      // Apply damage to enemy
      set((state) => {
        const newHP = subtract(state.enemyHP, finalDamage.toString());
        const clampedHP = clamp(newHP, 0, state.enemyMaxHP);
        state.enemyHP = clampedHP.toString();
        state.lastAttackTime = now;
      });

      // Check if enemy is defeated
      if (lessThanOrEqualTo(get().enemyHP, 0)) {
        setTimeout(() => {
          get().defeatEnemy();
        }, 500);
      }
    },

    /**
     * Enemy attacks the player
     */
    enemyAttack: () => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return;

      const now = Date.now();
      if (now - state.lastEnemyAttackTime < ENEMY_ATTACK_COOLDOWN) return;

      if (lessThanOrEqualTo(state.playerHP, 0) || lessThanOrEqualTo(state.enemyHP, 0)) return;

      const gameStore = useGameStore.getState();
      const playerStats = gameStore.stats;
      const enemy = state.currentEnemy;

      // Check if player dodges
      const dodgeRoll = Math.random() * 100;
      if (dodgeRoll < playerStats.dodge) {
        get().addLogEntry('enemy', `You dodged ${enemy.name}'s attack!`, '#94a3b8');
        set((state) => {
          state.lastEnemyAttackTime = now;
        });
        return;
      }

      // Calculate base damage: ATK * (1 - DEF/(DEF + K))
      let atk = D(enemy.atk);

      // Apply boss enrage multiplier
      if (state.isBoss && bossMechanics) {
        const enrageMultiplier = bossMechanics.getEnrageMultiplier();
        if (enrageMultiplier > 1) {
          atk = atk.times(enrageMultiplier);
        }
      }

      const def = D(playerStats.def);
      const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
      const baseDamage = atk.times(D(1).minus(defReduction));

      // Check for critical hit
      const critRoll = Math.random() * 100;
      const isCrit = critRoll < enemy.crit;
      let finalDamage = baseDamage;

      if (isCrit) {
        const critMultiplier = D(enemy.critDmg).dividedBy(100);
        finalDamage = baseDamage.times(critMultiplier);
      }

      const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(finalDamage.toString());
      const damageAfterShield = D(remainingDamage);
      const absorbedAmount = D(absorbed);

      if (damageAfterShield.lessThanOrEqualTo(0)) {
        get().addLogEntry(
          'system',
          `${enemy.name}'s attack was absorbed by your shield!`,
          '#22c55e'
        );
      } else {
        const absorptionNote = absorbedAmount.greaterThan(0)
          ? ` (${absorbedAmount.toFixed(0)} absorbed)`
          : '';

        get().addLogEntry(
          isCrit ? 'damage' : 'enemy',
          isCrit
            ? `${enemy.name} lands a critical hit! Takes ${damageAfterShield.toFixed(0)} damage!${absorptionNote}`
            : `${enemy.name} deals ${damageAfterShield.toFixed(0)} damage.${absorptionNote}`,
          isCrit ? '#ef4444' : '#f87171'
        );
      }

      // Apply damage to player
      set((state) => {
        const newHP = subtract(state.playerHP, damageAfterShield.toString());
        const clampedHP = clamp(newHP, 0, state.playerMaxHP);
        state.playerHP = clampedHP.toString();
        state.lastEnemyAttackTime = now;
      });

      // Check if player is defeated
      if (lessThanOrEqualTo(get().playerHP, 0)) {
        setTimeout(() => {
          get().playerDefeat();
        }, 500);
      }
    },

    /**
     * Handle enemy defeat - award rewards
     */
    defeatEnemy: () => {
      const state = get();
      if (!state.currentEnemy) return;

      const enemy = state.currentEnemy;
      const currentZone = state.currentZone;
      const currentDungeon = state.currentDungeon;
      const isBoss = state.isBoss;
      const combatTime = (Date.now() - state.combatStartTime) / 1000; // Time in seconds
      const combatContext = state.combatContext;
      const activityToken = useActivityStore.getState().active?.startedAt;

      // Add victory message
      if (currentDungeon) {
        get().addLogEntry('victory', `🏆 DUNGEON TRIAL COMPLETE! ${enemy.name} has been vanquished!`, '#fbbf24');
      } else if (isBoss) {
        get().addLogEntry('victory', `🏆 BOSS DEFEATED! ${enemy.name} has fallen!`, '#fbbf24');
      } else {
        get().addLogEntry('victory', `Victory! ${enemy.name} has been defeated!`, '#22c55e');
      }

      const gameStore = useGameStore.getState();
      const inventoryStore = useInventoryStore.getState();

      if (combatContext.type === 'trial') {
        const { cityId, trialId, gateItemId, eligible } = combatContext;

        useActivityStore.getState().stopActivity();

        if (eligible) {
          useTrialStore.getState().markCleared(trialId);
          useCityStore.getState().markGateTrialCleared(cityId);
          grantRewards({ items: [{ itemId: gateItemId, qty: 1 }] }, 'Gate Trial clear');
        } else {
          grantRewards({ currencies: { gold: '500' } }, 'Gate Trial (not eligible)');
        }

        setTimeout(() => {
          get().exitCombat();
        }, 500);

        return;
      }

      if (combatContext.type === 'outskirts') {
        const { cityId, sourceId } = combatContext;
        const contentStore = useContentStore.getState();
        const outskirtsDef = sourceId ? contentStore.maps.outskirtsById[sourceId] : undefined;

        if (!outskirtsDef) {
          console.warn('[CombatStore] Missing outskirts def for', sourceId);
          setTimeout(() => get().exitCombat(), 500);
          return;
        }

        const cityIndex = combatContext.cityIndex ?? outskirtsDef.cityIndex ?? (cityId
          ? contentStore.maps.citiesById[cityId]?.index ?? 0
          : 0);
        const isBossFight = Boolean(combatContext.isBoss ?? isBoss);

        useOutskirtsStore.getState().recordKill(outskirtsDef.id, isBossFight);
        if (isBossFight && cityId) {
          useCityStore.getState().markOutskirtsBossDefeated(cityId);
        }

        const economy = contentStore.raw?.economy;
        const rewards = buildOutskirtsRewards(outskirtsDef, economy?.drops?.outskirts, cityIndex, isBossFight);
        grantRewards(rewards, `Outskirts Victory (${isBossFight ? 'Boss' : 'Mob'})`);

        setTimeout(() => {
          get().exitCombat();

          const activity = useActivityStore.getState().active;
          if (
            !activity ||
            activity.type !== 'outskirts' ||
            activity.cityId !== cityId ||
            activity.sourceId !== sourceId ||
            activity.startedAt !== activityToken
          ) {
            return;
          }

          const latestContent = useContentStore.getState();
          const latestDef = sourceId ? latestContent.maps.outskirtsById[sourceId] : undefined;
          if (!latestDef) return;

          const nextIsBoss = useOutskirtsStore.getState().shouldSpawnBoss(latestDef.id, latestDef);
          const nextEnemyId = nextIsBoss
            ? latestDef.bossId
            : pickFromWeightedPool(latestDef.mobPool, latestDef.mobPool?.[0]?.enemyId);

          if (!nextEnemyId) return;

          get().startCombat(nextEnemyId, {
            type: 'outskirts',
            cityId,
            sourceId,
            cityIndex: latestDef.cityIndex,
            isBoss: nextIsBoss,
          });
        }, OUTSKIRTS_NEXT_FIGHT_DELAY_MS);

        return;
      }

      // Handle dungeon rewards
      if (currentDungeon) {
        // Load dungeon data
        fetch('/config/dungeons.json')
          .then(res => res.json() as Promise<{ dungeons: DungeonData[] }>)
          .then((data) => {
            const dungeon = data.dungeons.find((d) => d.id === currentDungeon);
            if (!dungeon) return;

            const dungeonStore = useDungeonStore.getState();
            const isFirstClear = dungeonStore.isFirstClear(currentDungeon);

            // Award gold
            if (dungeon.rewards.gold) {
              inventoryStore.addGold(dungeon.rewards.gold.toString());
              get().addLogEntry('loot', `💰 Received ${dungeon.rewards.gold} Gold!`, '#fbbf24');
            }

            // Award guaranteed first-clear drop
            if (isFirstClear && dungeon.rewards.guaranteedDrop) {
              const drop = dungeon.rewards.guaranteedDrop;
              const success = inventoryStore.addItem(drop.itemId, 1);
              if (success) {
                get().addLogEntry('loot', `✨ FIRST CLEAR REWARD: ${drop.name}!`, '#a855f7');
              } else {
                get().addLogEntry('system', '⚠️ Inventory full! First clear reward was lost.', '#ef4444');
              }
            }

            // Complete dungeon in dungeon store
            dungeonStore.completeDungeon(currentDungeon, combatTime);

            // Display completion stats
            const totalClears = dungeonStore.getTotalClears(currentDungeon);
            get().addLogEntry('system', `📊 Total Clears: ${totalClears} | Time: ${combatTime.toFixed(1)}s`, '#60a5fa');
          })
          .catch(err => {
            console.error('[CombatStore] Error loading dungeon rewards:', err);
          });
      } else {
        // Regular combat rewards (zone/enemy)
        // Generate loot
        const zoneProgress = currentZone
          ? useZoneStore.getState().getZoneProgress(currentZone)
          : null;
        const isFirstBossKill = isBoss && zoneProgress ? !zoneProgress.bossDefeated : false;

        const lootResult = generateLoot(
          enemy,
          gameStore.playerLuck,
          gameStore.pityState,
          isBoss,
          isFirstBossKill
        );

        // Add gold to inventory
        inventoryStore.addGold(lootResult.gold);

        // Add items to inventory
        for (const lootItem of lootResult.items) {
          const success = inventoryStore.addItem(lootItem.itemId, lootItem.quantity);
          if (!success) {
            get().addLogEntry('system', '⚠️ Inventory full! Some items were lost.', '#ef4444');
            break;
          }
        }

        // Format and display loot messages
        const lootMessages = formatLootMessage(lootResult);
        for (const message of lootMessages) {
          if (message.includes('RARE') || message.includes('EPIC') || message.includes('LEGENDARY')) {
            get().addLogEntry('loot', message, '#a855f7');
          } else {
            get().addLogEntry('loot', message, '#fbbf24');
          }
        }

        // Update pity counters
        useGameStore.setState({
          pityState: lootResult.updatedPityState,
        });

        // Record enemy defeat in zone progression
        if (currentZone) {
          if (isBoss) {
            useZoneStore
              .getState()
              .recordBossDefeat(currentZone, gameStore.realm.index);
          } else {
            useZoneStore.getState().recordEnemyDefeat(currentZone, enemy.id);
          }
        }
      }

      // Exit combat after a short delay
      setTimeout(() => {
        get().exitCombat();
      }, 2000);
    },

    /**
     * Handle player defeat
     */
    playerDefeat: () => {
      const state = get();
      if (!state.currentEnemy) return;

      const enemy = state.currentEnemy;
      const context = state.combatContext;

      // Add defeat message
      get().addLogEntry(
        'defeat',
        `You have been defeated by ${enemy.name}...`,
        '#ef4444'
      );

      if (context?.type === 'outskirts') {
        useActivityStore.getState().stopActivity();
      }

      if (context?.type === 'trial') {
        useActivityStore.getState().stopActivity();
        if (context.eligible) {
          useTrialStore.getState().recordFailure(context.trialId);
        }
      }

      // Add respawn message (no death penalty in idle games usually)
      get().addLogEntry(
        'system',
        'You will respawn shortly...',
        '#94a3b8'
      );

      // Respawn player and exit combat
      setTimeout(() => {
        // Restore player HP
        const playerStats = useGameStore.getState().stats;
        set((state) => {
          state.playerHP = playerStats.maxHp;
        });

        get().exitCombat();
      }, 2000);
    },

    /**
     * Game tick for combat timing
     */
    tick: (deltaTime: number) => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return;

      if (lessThanOrEqualTo(state.playerHP, 0) || lessThanOrEqualTo(state.enemyHP, 0)) return;

      const gameStore = useGameStore.getState();
      gameStore.removeExpiredBuffs();

      const now = Date.now();
      const currentEnemyHP = D(state.enemyHP);
      const currentEnemyMaxHP = D(state.enemyMaxHP);

      // Process boss mechanics
      if (state.isBoss && bossMechanics) {
        const combatTime = (now - state.combatStartTime) / 1000; // Convert to seconds
        const mechanics = bossMechanics.update(deltaTime, currentEnemyHP, currentEnemyMaxHP, combatTime);

        // Handle enrage trigger
        if (mechanics.enrageTriggered) {
          get().addLogEntry(
            'system',
            `🔥 ${state.currentEnemy.name} has ENRAGED! Attack power increased by 50%!`,
            '#ef4444'
          );
        }

        // Handle heal trigger
        if (mechanics.healTriggered && mechanics.healAmount) {
          const healedHP = add(state.enemyHP, mechanics.healAmount.toString());
          const cappedHP = greaterThan(healedHP, state.enemyMaxHP) ? state.enemyMaxHP : healedHP.toString();

          set((state) => {
            state.enemyHP = cappedHP;
          });

          get().addLogEntry(
            'system',
            `💚 ${state.currentEnemy.name} heals for ${mechanics.healAmount.toFixed(0)} HP!`,
            '#22c55e'
          );
        }

        // Handle ultimate trigger
        if (mechanics.ultimateTriggered && mechanics.ultimateDamageMultiplier) {
          // Apply massive damage to player
          const playerStats = useGameStore.getState().stats;
          const enemy = state.currentEnemy;

          // Calculate base damage with ultimate multiplier
          let atk = D(enemy.atk).times(mechanics.ultimateDamageMultiplier);

          // Apply enrage if active
          const enrageMultiplier = bossMechanics.getEnrageMultiplier();
          if (enrageMultiplier > 1) {
            atk = atk.times(enrageMultiplier);
          }

          const def = D(playerStats.def);
          const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
          const ultimateDamage = atk.times(D(1).minus(defReduction));

          const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(
            ultimateDamage.toString()
          );
          const damageAfterShield = D(remainingDamage);
          const absorbedAmount = D(absorbed);

          const absorptionNote = absorbedAmount.greaterThan(0)
            ? ` (${absorbedAmount.toFixed(0)} absorbed)`
            : '';

          get().addLogEntry(
            'damage',
            `⚡ ${enemy.name} unleashes ULTIMATE ATTACK! Takes ${damageAfterShield.toFixed(0)} damage!${absorptionNote}`,
            '#a855f7'
          );

          // Apply damage to player
          set((state) => {
            const newHP = subtract(state.playerHP, damageAfterShield.toString());
            const clampedHP = clamp(newHP, 0, state.playerMaxHP);
            state.playerHP = clampedHP.toString();
          });

          // Check if player is defeated
          if (lessThanOrEqualTo(get().playerHP, 0)) {
            setTimeout(() => {
              get().playerDefeat();
            }, 500);
          }

          if (lessThanOrEqualTo(get().playerHP, 0)) {
            return;
          }

          // Reset ultimate triggered flag so it can trigger again
          bossMechanics.resetUltimateTriggered();
        }

        // Handle ultimate warning
        if (mechanics.ultimateWarning && !mechanics.ultimateTriggered) {
          const progress = bossMechanics.getUltimateWarningProgress();
          if (progress === 0) {
            // Just started warning
            get().addLogEntry(
              'system',
              `⚠️ ${state.currentEnemy.name} is charging a powerful attack! (3s)`,
              '#f59e0b'
            );
          }
        }
      }

      // Handle aura mechanics
      const hpPercentRemaining = currentEnemyMaxHP.greaterThan(0)
        ? currentEnemyHP.dividedBy(currentEnemyMaxHP).times(100).toNumber()
        : 0;

      const auraMechanic = state.enemyMechanics.find((mechanic) => mechanic.type === 'aura');
      if (auraMechanic && !state.activeAura && hpPercentRemaining <= auraMechanic.trigger.hpPercent) {
        set((state) => {
          state.activeAura = {
            damagePerSec: auraMechanic.effect.auraDamagePerSec || 0,
            description: auraMechanic.description,
          };
        });

        get().addLogEntry(
          'system',
          `☠️ ${state.currentEnemy.name}'s ${auraMechanic.description || 'aura'} activates!`,
          '#ef4444'
        );
      }

      if (state.activeAura && state.activeAura.damagePerSec > 0) {
        const auraDamage = D(state.activeAura.damagePerSec).times(deltaTime / 1000);
        const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(auraDamage.toString());
        const damageAfterShield = D(remainingDamage);
        const absorbedAmount = D(absorbed);

        if (damageAfterShield.greaterThan(0) || absorbedAmount.greaterThan(0)) {
          set((state) => {
            const newHP = subtract(state.playerHP, damageAfterShield.toString());
            const clampedHP = clamp(newHP, 0, state.playerMaxHP);
            state.playerHP = clampedHP.toString();
          });

          const absorptionNote = absorbedAmount.greaterThan(0)
            ? ` (${absorbedAmount.toFixed(0)} absorbed by shield)`
            : '';

          get().addLogEntry(
            'damage',
            `${state.currentEnemy.name}'s aura deals ${damageAfterShield.toFixed(0)} damage${absorptionNote}.`,
            '#ef4444'
          );

          if (lessThanOrEqualTo(get().playerHP, 0)) {
            setTimeout(() => {
              get().playerDefeat();
            }, 500);
            return;
          }
        }
      }

      // Auto-attack if enabled
      if (state.autoAttack && now - state.lastAttackTime >= PLAYER_ATTACK_COOLDOWN) {
        get().playerAttack();
      }

      // Enemy auto-attacks (skip if ultimate just triggered)
      if (now - state.lastEnemyAttackTime >= ENEMY_ATTACK_COOLDOWN) {
        // Check if enemy is still alive before attacking
        if (greaterThan(state.enemyHP, 0)) {
          get().enemyAttack();
        }
      }

      // Update technique cooldowns
      set((state) => {
        const updatedCooldowns: Record<string, number> = {};
        Object.keys(state.techniquesCooldowns).forEach((techniqueId) => {
          const remaining = state.techniquesCooldowns[techniqueId] - deltaTime;
          if (remaining > 0) {
            updatedCooldowns[techniqueId] = remaining;
          }
        });
        state.techniquesCooldowns = updatedCooldowns;
      });
    },

    /**
     * Add an entry to the combat log
     */
    addLogEntry: (type: CombatLogEntry['type'], text: string, color: string) => {
      set((state) => {
        const entry: CombatLogEntry = {
          type,
          text,
          timestamp: Date.now(),
          color,
        };

        state.combatLog.push(entry);

        // Limit log size for performance
        if (state.combatLog.length > MAX_COMBAT_LOG_ENTRIES) {
          state.combatLog.shift();
        }
      });
    },

    /**
     * Toggle auto-attack
     */
    setAutoAttack: (enabled: boolean) => {
      set((state) => {
        state.autoAttack = enabled;
      });

      if (enabled) {
        get().addLogEntry('system', 'Auto-attack enabled.', '#94a3b8');
      } else {
        get().addLogEntry('system', 'Auto-attack disabled.', '#94a3b8');
      }
    },

    /**
     * Toggle auto-combat AI (for techniques)
     */
    setAutoCombatAI: (enabled: boolean) => {
      set((state) => {
        state.autoCombatAI = enabled;
      });

      if (enabled) {
        get().addLogEntry('system', 'Combat AI enabled.', '#94a3b8');
      } else {
        get().addLogEntry('system', 'Combat AI disabled.', '#94a3b8');
      }
    },
  }))
);

