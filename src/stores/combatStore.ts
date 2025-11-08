import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CombatState, EnemyDefinition, CombatLogEntry } from '../types';
import { useGameStore } from './gameStore';
import { useZoneStore } from './zoneStore';
import { D, subtract, greaterThan, lessThanOrEqualTo } from '../utils/numbers';

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
 * Combat store managing all combat state and actions
 */
export const useCombatStore = create<CombatState>()(
  immer((set, get) => ({
    // Initial state
    inCombat: false,
    currentZone: null,
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

    /**
     * Enter combat with an enemy
     */
    enterCombat: (zone: string, enemy: EnemyDefinition) => {
      const playerStats = useGameStore.getState().stats;

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
        state.lastAttackTime = Date.now();
        state.lastEnemyAttackTime = Date.now();
      });

      // Add entry to log
      get().addLogEntry('system', `Combat started with ${enemy.name}!`, '#fbbf24');
    },

    /**
     * Exit combat and clean up state
     */
    exitCombat: () => {
      set((state) => {
        state.inCombat = false;
        state.currentZone = null;
        state.currentEnemy = null;
        state.playerHP = '0';
        state.playerMaxHP = '0';
        state.enemyHP = '0';
        state.enemyMaxHP = '0';
        state.lastAttackTime = 0;
        state.lastEnemyAttackTime = 0;
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
      const atk = D(enemy.atk);
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

      // Add victory message
      get().addLogEntry('victory', `Victory! ${enemy.name} has been defeated!`, '#22c55e');

      // Add reward messages
      get().addLogEntry(
        'loot',
        `Gained ${enemy.goldReward} gold and ${enemy.expReward} experience!`,
        '#fbbf24'
      );

      // Record enemy defeat in zone progression
      if (currentZone) {
        useZoneStore.getState().recordEnemyDefeat(currentZone, enemy.id);
      }

      // TODO: Actually add rewards to game state (gold, exp)
      // This will be implemented when we have economy/progression systems

      // Roll for loot drops
      if (enemy.lootTable && enemy.lootTable.length > 0) {
        enemy.lootTable.forEach((drop) => {
          const dropRoll = Math.random() * 100;
          if (dropRoll < drop.dropChance) {
            const amount = Math.floor(
              Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount
            );
            get().addLogEntry(
              'loot',
              `Obtained ${amount}x ${drop.itemId}!`,
              '#a78bfa'
            );
            // TODO: Add item to inventory
          }
        });
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

      // Auto-attack if enabled
      if (state.autoAttack && now - state.lastAttackTime >= PLAYER_ATTACK_COOLDOWN) {
        get().playerAttack();
      }

      // Enemy auto-attacks
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
