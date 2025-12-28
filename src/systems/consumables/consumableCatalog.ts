export type ConsumableUsage = 'combat_only' | 'combat_or_world' | 'cultivate_only';

export type CombatConsumableEffect =
  | { kind: 'healPct'; pct: number }
  | { kind: 'shieldPct'; pct: number; durationSec: number }
  | {
      kind: 'combatBuff';
      stat: 'atk' | 'def' | 'crit' | 'critDmg' | 'dodge' | 'speed';
      mode: 'pct' | 'flat';
      value: number;
      durationSec: number;
    }
  | { kind: 'restoreQiPct'; pct: number }
  | { kind: 'restoreIntentPct'; pct: number };

export interface ConsumableSpec {
  itemId: string;
  usage: ConsumableUsage;
  cooldownSec: number;
  recommendedSlot: 'healing' | 'utility' | 'specialty';
  effect: CombatConsumableEffect;
  shortLabel: string;
  longLabel?: string;
}

export const CONSUMABLE_SPECS: Record<string, ConsumableSpec> = {
  cons_healing_pellet_t1: {
    itemId: 'cons_healing_pellet_t1',
    usage: 'combat_or_world',
    cooldownSec: 10,
    recommendedSlot: 'healing',
    effect: { kind: 'healPct', pct: 0.3 },
    shortLabel: 'Healing Pellet',
  },
  cons_ward_salt_t1: {
    itemId: 'cons_ward_salt_t1',
    usage: 'combat_only',
    cooldownSec: 45,
    recommendedSlot: 'utility',
    effect: { kind: 'shieldPct', pct: 0.2, durationSec: 15 },
    shortLabel: 'Ward Salt',
  },
  cons_ward_salt_t2: {
    itemId: 'cons_ward_salt_t2',
    usage: 'combat_only',
    cooldownSec: 45,
    recommendedSlot: 'utility',
    effect: { kind: 'shieldPct', pct: 0.3, durationSec: 18 },
    shortLabel: 'Ward Salt (Strong)',
  },
  cons_ironblood_pellet_t1: {
    itemId: 'cons_ironblood_pellet_t1',
    usage: 'combat_only',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.25, durationSec: 20 },
    shortLabel: 'Ironblood Pellet',
  },
  cons_ironblood_pellet_t2: {
    itemId: 'cons_ironblood_pellet_t2',
    usage: 'combat_only',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.35, durationSec: 25 },
    shortLabel: 'Ironblood Pellet (Strong)',
  },
  cons_windstep_powder_t1: {
    itemId: 'cons_windstep_powder_t1',
    usage: 'combat_only',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.2, durationSec: 20 },
    shortLabel: 'Windstep Powder',
  },
  cons_windstep_powder_t2: {
    itemId: 'cons_windstep_powder_t2',
    usage: 'combat_only',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.3, durationSec: 25 },
    shortLabel: 'Windstep Powder (Strong)',
  },
  cons_anti_venom_pellet_t1: {
    itemId: 'cons_anti_venom_pellet_t1',
    usage: 'combat_only',
    cooldownSec: 75,
    recommendedSlot: 'utility',
    effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.15, durationSec: 20 },
    shortLabel: 'Anti-Venom Pellet',
  },
  cons_focus_tonic_t1: {
    itemId: 'cons_focus_tonic_t1',
    usage: 'combat_only',
    cooldownSec: 90,
    recommendedSlot: 'utility',
    effect: { kind: 'combatBuff', stat: 'crit', mode: 'flat', value: 0.05, durationSec: 25 },
    shortLabel: 'Focus Tonic',
  },
  cons_mastery_tonic_t1: {
    itemId: 'cons_mastery_tonic_t1',
    usage: 'combat_only',
    cooldownSec: 90,
    recommendedSlot: 'utility',
    effect: { kind: 'combatBuff', stat: 'atk', mode: 'pct', value: 0.15, durationSec: 25 },
    shortLabel: 'Mastery Tonic',
  },
};

export function getConsumableSpec(itemId: string): ConsumableSpec | null {
  return CONSUMABLE_SPECS[itemId] ?? null;
}

export function isCombatUsableConsumable(itemId: string): boolean {
  const spec = getConsumableSpec(itemId);
  if (!spec) return false;
  return spec.usage !== 'cultivate_only';
}
