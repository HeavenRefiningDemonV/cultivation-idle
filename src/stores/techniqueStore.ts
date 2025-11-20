import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Decimal from 'decimal.js';
import type { BuffStat, CultivationPath, CombatLogEntry } from '../types';
import { D, multiply, subtract, greaterThanOrEqualTo, lessThanOrEqualTo } from '../utils/numbers';

/**
 * Technique definition
 */
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
 * Technique store state
 */
interface TechniqueState {
  techniques: Record<string, Technique>;
  currentIntent: string;
  maxIntent: string;
  intentRegenRate: string;

  // Actions
  initializeTechniques: () => void;
  unlockTechnique: (techniqueId: string) => void;
  useTechnique: (techniqueId: string) => boolean;
  canUseTechnique: (techniqueId: string) => boolean;
  updateTechniques: (deltaTime: number) => void;
  gainProficiency: (techniqueId: string, amount: number) => void;
  autocastTechniques: () => void;
  resetTechniques: () => void;
}

/**
 * Lazy getters for stores to avoid circular dependencies
 */
interface CombatStoreDeps {
  currentEnemy: { id: string; name: string } | null;
  inCombat: boolean;
  enemyHP: string;
  addLogEntry: (type: CombatLogEntry['type'], text: string, color: string) => void;
  defeatEnemy: () => void;
}

interface GameStoreDeps {
  stats: { atk: string };
  selectedPath: CultivationPath | null;
  addBuff: (buff: { id: string; stat: BuffStat; value: number; duration: number }) => void;
}

let _getCombatStore: (() => CombatStoreDeps) | null = null;
let _getGameStore: (() => GameStoreDeps) | null = null;

export function setTechniqueStoreDependencies(
  getCombatStore: () => CombatStoreDeps,
  getGameStore: () => GameStoreDeps
) {
  _getCombatStore = getCombatStore;
  _getGameStore = getGameStore;
}

/**
 * Technique store managing combat techniques, intent, and proficiency
 */
export const useTechniqueStore = create<TechniqueState>()(
  immer((set, get) => ({
    techniques: {},
    currentIntent: '0',
    maxIntent: '100',
    intentRegenRate: '5', // per second

    /**
     * Initialize all techniques with default values
     */
    initializeTechniques: () => {
      set((state) => {
        state.techniques = {
          // ===== HEAVEN PATH TECHNIQUES =====
          heaven_bolt: {
            id: 'heaven_bolt',
            name: 'Heaven Bolt',
            description: 'Unleash a bolt of pure Qi that deals 200% damage',
            path: 'heaven',
            tier: 1,
            intentCost: 20,
            cooldown: 5000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 2.0,
            },
          },
          spirit_shield: {
            id: 'spirit_shield',
            name: 'Spirit Shield',
            description: 'Create a shield that absorbs 30% damage for 10 seconds',
            path: 'heaven',
            tier: 2,
            intentCost: 30,
            cooldown: 15000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'buff',
              value: 0.3,
              duration: 10000,
              stat: 'absorption',
            },
          },
          celestial_strike: {
            id: 'celestial_strike',
            name: 'Celestial Strike',
            description: 'Channel heaven\'s power for massive damage (500%)',
            path: 'heaven',
            tier: 3,
            intentCost: 50,
            cooldown: 30000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 5.0,
            },
          },

          // ===== EARTH PATH TECHNIQUES =====
          stone_fist: {
            id: 'stone_fist',
            name: 'Stone Fist',
            description: 'A powerful punch that deals 150% damage',
            path: 'earth',
            tier: 1,
            intentCost: 20,
            cooldown: 6000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 1.5,
            },
          },
          iron_body: {
            id: 'iron_body',
            name: 'Iron Body',
            description: 'Harden your body, gaining +50% defense for 15 seconds',
            path: 'earth',
            tier: 2,
            intentCost: 25,
            cooldown: 20000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'buff',
              value: 0.5,
              duration: 15000,
              stat: 'def',
            },
          },
          mountain_crash: {
            id: 'mountain_crash',
            name: 'Mountain Crash',
            description: 'Devastating ground slam dealing 400% damage',
            path: 'earth',
            tier: 3,
            intentCost: 45,
            cooldown: 25000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 4.0,
            },
          },

          // ===== MARTIAL PATH TECHNIQUES =====
          blade_rush: {
            id: 'blade_rush',
            name: 'Blade Rush',
            description: 'Rapid slashes dealing 180% damage',
            path: 'martial',
            tier: 1,
            intentCost: 15,
            cooldown: 4000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 1.8,
            },
          },
          battle_focus: {
            id: 'battle_focus',
            name: 'Battle Focus',
            description: 'Enter a focused state, gaining +30% crit chance for 12 seconds',
            path: 'martial',
            tier: 2,
            intentCost: 30,
            cooldown: 18000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'buff',
              value: 0.3,
              duration: 12000,
              stat: 'crit_chance',
            },
          },
          killing_intent: {
            id: 'killing_intent',
            name: 'Killing Intent',
            description: 'Unleash your killing intent, dealing 600% damage',
            path: 'martial',
            tier: 3,
            intentCost: 60,
            cooldown: 35000,
            lastUsed: 0,
            proficiency: 0,
            level: 1,
            unlocked: false,
            effect: {
              type: 'damage',
              value: 6.0,
            },
          },
        };
      });
    },

    /**
     * Unlock a specific technique
     */
    unlockTechnique: (techniqueId: string) => {
      set((state) => {
        if (state.techniques[techniqueId]) {
          state.techniques[techniqueId].unlocked = true;
        }
      });
    },

    /**
     * Check if a technique can be used
     */
    canUseTechnique: (techniqueId: string) => {
      const state = get();
      const tech = state.techniques[techniqueId];
      if (!tech || !tech.unlocked) return false;

      const now = Date.now();
      const hasIntent = greaterThanOrEqualTo(state.currentIntent, tech.intentCost);
      const notOnCooldown = now - tech.lastUsed >= tech.cooldown;

      return hasIntent && notOnCooldown;
    },

    /**
     * Use a technique
     */
    useTechnique: (techniqueId: string) => {
      const state = get();
      if (!state.canUseTechnique(techniqueId)) return false;

      const tech = state.techniques[techniqueId];

      if (!_getCombatStore || !_getGameStore) {
        console.warn('Technique store dependencies not set');
        return false;
      }

      const combatStore = _getCombatStore();
      const gameStore = _getGameStore();

      // Deduct intent and update last used
      set((state) => {
        state.currentIntent = subtract(state.currentIntent, tech.intentCost).toString();
        state.techniques[techniqueId].lastUsed = Date.now();
      });

      // Apply technique effect
      if (tech.effect.type === 'damage') {
        const baseAtk = D(gameStore.stats.atk);
        const damageMultiplier = D(tech.effect.value);
        const damage = multiply(baseAtk, damageMultiplier);

        // Apply damage to current enemy
        if (combatStore.currentEnemy && combatStore.inCombat) {
          const newEnemyHP = subtract(combatStore.enemyHP, damage.toString());

          combatStore.addLogEntry(
            'player',
            `Used ${tech.name}! Dealt ${damage.toFixed(0)} damage!`,
            '#3b82f6'
          );

          // Update enemy HP
          if (!_getCombatStore) return false;
          const combat = _getCombatStore();
          combat.enemyHP = newEnemyHP.toString();

          // Check if enemy defeated
          if (lessThanOrEqualTo(newEnemyHP, 0)) {
            combatStore.defeatEnemy();
          }
        }
      } else if (tech.effect.type === 'buff') {
        if (tech.effect.stat && tech.effect.duration) {
          gameStore.addBuff({
            id: tech.id,
            stat: tech.effect.stat,
            value: tech.effect.value,
            duration: tech.effect.duration,
          });
        }

        combatStore.addLogEntry(
          'system',
          `Used ${tech.name}! Gained ${(tech.effect.value * 100).toFixed(0)}% ${tech.effect.stat} for ${((tech.effect.duration ?? 0) / 1000).toFixed(0)}s!`,
          '#22c55e'
        );
      }

      // Gain proficiency
      get().gainProficiency(techniqueId, 10);

      return true;
    },

    /**
     * Gain proficiency for a technique
     */
    gainProficiency: (techniqueId: string, amount: number) => {
      set((state) => {
        const tech = state.techniques[techniqueId];
        if (!tech) return;

        const newProficiency = tech.proficiency + amount;
        const proficiencyPerLevel = 1000;
        const newLevel = Math.floor(newProficiency / proficiencyPerLevel) + 1;

        state.techniques[techniqueId].proficiency = newProficiency;
        state.techniques[techniqueId].level = newLevel;
      });
    },

    /**
     * Auto-cast techniques based on AI priority
     */
    autocastTechniques: () => {
      if (!_getCombatStore || !_getGameStore) return;

      const combatStore = _getCombatStore();
      const gameStore = _getGameStore();

      if (!combatStore.inCombat) return;

      const selectedPath = gameStore.selectedPath;
      if (!selectedPath) return;

      const state = get();

      // Get all unlocked techniques for current path, sorted by priority
      const pathTechniques = Object.values(state.techniques)
        .filter(t => t.path === selectedPath && t.unlocked)
        .sort((a, b) => {
          const currentIntent = D(state.currentIntent);
          const canAffordA = greaterThanOrEqualTo(currentIntent, a.intentCost);
          const canAffordB = greaterThanOrEqualTo(currentIntent, b.intentCost);

          // Priority: tier 3 > tier 2 > tier 1, but only if we have enough intent
          if (canAffordA && canAffordB) {
            return b.tier - a.tier;
          }
          // Otherwise prefer techniques we can actually use
          if (canAffordA) return -1;
          if (canAffordB) return 1;
          return 0;
        });

      // Try to use the highest priority technique that's off cooldown
      for (const tech of pathTechniques) {
        if (get().canUseTechnique(tech.id)) {
          get().useTechnique(tech.id);
          break; // Only cast one technique per autocast cycle
        }
      }
    },

    /**
     * Update techniques (regenerate intent and auto-cast)
     */
    updateTechniques: (deltaTime: number) => {
      if (!_getCombatStore) return;
      const combatStoreGetter = _getCombatStore;

      // Regenerate intent
      set((state) => {
        const combatStore = combatStoreGetter?.();
        if (!combatStore) return;

        // Intent regen is 2x faster in combat
        const regenMultiplier = combatStore.inCombat ? 2 : 1;
        const intentGain = D(state.intentRegenRate)
          .times(deltaTime / 1000)
          .times(regenMultiplier);

        const currentIntent = D(state.currentIntent);
        const maxIntent = D(state.maxIntent);
        const newIntent = Decimal.min(currentIntent.plus(intentGain), maxIntent);

        state.currentIntent = newIntent.toString();
      });

      // Auto-cast techniques if in combat
      const combatStore = _getCombatStore();
      if (!combatStore) return;

      if (combatStore.inCombat) {
        get().autocastTechniques();
      }
    },

    /**
     * Reset techniques to their initial state for a new run
     */
    resetTechniques: () => {
      set((state) => {
        state.currentIntent = '0';
        state.maxIntent = '100';
        state.intentRegenRate = '5';
      });

      get().initializeTechniques();
    },
  }))
);
