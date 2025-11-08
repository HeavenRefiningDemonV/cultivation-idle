import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CombatState, EnemyDefinition, CombatLogEntry } from '../types';
import { useGameStore } from './gameStore';
import { useZoneStore } from './zoneStore';
import { useInventoryStore } from './inventoryStore';
import { useDungeonStore } from './dungeonStore';
import { D, subtract, greaterThan, lessThanOrEqualTo, add } from '../utils/numbers';
import { BossMechanics } from '../systems/bossMechanics';
import { generateLoot, updatePityCounters, formatLootMessage, getRarityColor } from '../systems/loot';

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

/**
 * Boss mechanics instance (single instance per combat)
 */
let bossMechanics: BossMechanics | null = null;

/**
 * Extended Combat State with dungeon support
 */
interface ExtendedCombatState extends CombatState {
  currentDungeon: string | null;
  startDungeonCombat: (dungeonId: string, boss: any, dungeonData: any) => void;
}

/**
 * Combat store managing all combat state and actions
 */
export const useCombatStore = create<ExtendedCombatState>()(
  immer((set, get) => ({
    // Initial state
    inCombat: false,
    currentZone: null,
    currentDungeon: null,
    currentEnemy: null,
    playerHP: '0',
    playerMaxHP: '0',
    enemyHP: '0',
    enemyMaxHP: '0',
    combatLog: [],
    autoAttack: false,
    autoCombatAI: false,
    lastAttackTime: 0,
    lastEnemyAttackTime: 0,
    techniquesCooldowns: {},
    isBoss: false,
    combatStartTime: 0,

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
     * Start dungeon combat with a boss
     */
    startDungeonCombat: (dungeonId: string, boss: any, dungeonData: any) => {
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

      // Initialize boss mechanics
      bossMechanics = new BossMechanics();
      console.log('[CombatStore] Dungeon boss mechanics initialized for', boss.name);

      // Start dungeon in dungeon store
      useDungeonStore.getState().startDungeon(dungeonId);

      set((state) => {
        state.inCombat = true;
        state.currentZone = null; // Not a zone fight
        state.currentDungeon = dungeonId;
        state.currentEnemy = enemy;

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
        state.playerHP = '0';
        state.playerMaxHP = '0';
        state.enemyHP = '0';
        state.enemyMaxHP = '0';
        state.lastAttackTime = 0;
        state.lastEnemyAttackTime = 0;
        state.isBoss = false;
        state.combatStartTime = 0;
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

      const playerStats = useGameStore.getState().stats;
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
        state.enemyHP = newHP.toString();
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

      const playerStats = useGameStore.getState().stats;
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
        get().addLogEntry(
          'damage',
          `${enemy.name} lands a critical hit! Takes ${finalDamage.toFixed(0)} damage!`,
          '#ef4444'
        );
      } else {
        get().addLogEntry(
          'enemy',
          `${enemy.name} deals ${finalDamage.toFixed(0)} damage.`,
          '#f87171'
        );
      }

      // Apply damage to player
      set((state) => {
        const newHP = subtract(state.playerHP, finalDamage.toString());
        state.playerHP = newHP.toString();
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

      // Handle dungeon rewards
      if (currentDungeon) {
        // Load dungeon data
        fetch('/config/dungeons.json')
          .then(res => res.json())
          .then(data => {
            const dungeon = data.dungeons.find((d: any) => d.id === currentDungeon);
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
        const lootResult = generateLoot(
          enemy,
          gameStore.playerLuck,
          gameStore.pityState,
          isBoss
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
        const droppedRarities = lootResult.items.map(item => item.rarity);
        const newPityState = updatePityCounters(gameStore.pityState, droppedRarities);
        useGameStore.setState({
          pityState: newPityState,
        });

        // Record enemy defeat in zone progression
        if (currentZone) {
          if (isBoss) {
            useZoneStore.getState().recordBossDefeat(currentZone);
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

      // Add defeat message
      get().addLogEntry(
        'defeat',
        `You have been defeated by ${enemy.name}...`,
        '#ef4444'
      );

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

      const now = Date.now();

      // Process boss mechanics
      if (state.isBoss && bossMechanics) {
        const combatTime = (now - state.combatStartTime) / 1000; // Convert to seconds
        const currentHP = D(state.enemyHP);
        const maxHP = D(state.enemyMaxHP);

        const mechanics = bossMechanics.update(deltaTime, currentHP, maxHP, combatTime);

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

          get().addLogEntry(
            'damage',
            `⚡ ${enemy.name} unleashes ULTIMATE ATTACK! Takes ${ultimateDamage.toFixed(0)} damage!`,
            '#a855f7'
          );

          // Apply damage to player
          set((state) => {
            const newHP = subtract(state.playerHP, ultimateDamage.toString());
            state.playerHP = newHP.toString();
          });

          // Check if player is defeated
          if (lessThanOrEqualTo(get().playerHP, 0)) {
            setTimeout(() => {
              get().playerDefeat();
            }, 500);
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
