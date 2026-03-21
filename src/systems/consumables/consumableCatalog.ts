import type { CultivationConsumableFamily, CultivationConsumableModifiers } from './cultivationConsumableTypes.js';

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
  | {
      kind: 'cleanseOrFallbackCombatBuff';
      fallback: {
        stat: 'def';
        mode: 'pct';
        value: number;
        durationSec: number;
      };
    }
  | { kind: 'restoreQiPct'; pct: number }
  | { kind: 'restoreIntentPct'; pct: number };

export type CultivationConsumableEffect = {
  kind: 'cultivationBuff';
  family: CultivationConsumableFamily;
  durationSec: number;
  modifiers: CultivationConsumableModifiers;
  breakthroughChargesRemaining?: number;
};

type ConsumableSpecBase = {
  itemId: string;
  usage: ConsumableUsage;
  domain: 'combat' | 'cultivation';
  cooldownSec: number;
  shortLabel: string;
  longLabel?: string;
  family?: CultivationConsumableFamily;
};

export type CombatConsumableSpec = ConsumableSpecBase & {
  domain: 'combat';
  recommendedSlot: 'healing' | 'utility' | 'specialty';
  effect: CombatConsumableEffect;
};

export type CultivationConsumableSpec = ConsumableSpecBase & {
  domain: 'cultivation';
  usage: 'cultivate_only';
  family: CultivationConsumableFamily;
  recommendedSlot?: never;
  effect: CultivationConsumableEffect;
};

export type ConsumableSpec = CombatConsumableSpec | CultivationConsumableSpec;

const BASE_CULTIVATION_MODIFIERS: CultivationConsumableModifiers = Object.freeze({
  qiRateMult: 1,
  stabilityGainMult: 1,
  comprehensionGainMult: 1,
  insightFrequencyMult: 1,
  breakthroughQiCostMult: 1,
  breakthroughStabilityBonus: 0,
});

const withCultivationModifiers = (
  overrides: Partial<CultivationConsumableModifiers>,
): CultivationConsumableModifiers => ({
  ...BASE_CULTIVATION_MODIFIERS,
  ...overrides,
});

export const CONSUMABLE_SPECS: Record<string, ConsumableSpec> = {
  cons_healing_pellet_t1: {
    itemId: 'cons_healing_pellet_t1',
    usage: 'combat_or_world',
    domain: 'combat',
    cooldownSec: 10,
    recommendedSlot: 'healing',
    effect: { kind: 'healPct', pct: 0.3 },
    shortLabel: 'Healing Pellet',
    longLabel: 'Restore 30% max HP.',
  },
  cons_ward_salt_t1: {
    itemId: 'cons_ward_salt_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 45,
    recommendedSlot: 'utility',
    effect: { kind: 'shieldPct', pct: 0.2, durationSec: 15 },
    shortLabel: 'Ward Salt',
    longLabel: 'Gain a shield worth 20% max HP for 15s.',
  },
  cons_ward_salt_t2: {
    itemId: 'cons_ward_salt_t2',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 45,
    recommendedSlot: 'utility',
    effect: { kind: 'shieldPct', pct: 0.3, durationSec: 18 },
    shortLabel: 'Ward Salt (Strong)',
    longLabel: 'Gain a shield worth 30% max HP for 18s.',
  },
  cons_ironblood_pellet_t1: {
    itemId: 'cons_ironblood_pellet_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.25, durationSec: 20 },
    shortLabel: 'Ironblood Pellet',
    longLabel: 'Increase DEF by 25% for 20s.',
  },
  cons_ironblood_pellet_t2: {
    itemId: 'cons_ironblood_pellet_t2',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.35, durationSec: 25 },
    shortLabel: 'Ironblood Pellet (Strong)',
    longLabel: 'Increase DEF by 35% for 25s.',
  },
  cons_windstep_powder_t1: {
    itemId: 'cons_windstep_powder_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.2, durationSec: 20 },
    shortLabel: 'Windstep Powder',
    longLabel: 'Increase dodge by 20% for 20s.',
  },
  cons_windstep_powder_t2: {
    itemId: 'cons_windstep_powder_t2',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 60,
    recommendedSlot: 'specialty',
    effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.3, durationSec: 25 },
    shortLabel: 'Windstep Powder (Strong)',
    longLabel: 'Increase dodge by 30% for 25s.',
  },
  cons_anti_venom_pellet_t1: {
    itemId: 'cons_anti_venom_pellet_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 75,
    recommendedSlot: 'utility',
    effect: {
      kind: 'cleanseOrFallbackCombatBuff',
      fallback: { stat: 'def', mode: 'pct', value: 0.15, durationSec: 20 },
    },
    shortLabel: 'Anti-Venom Pellet',
    longLabel: 'Cleanse venom if present; otherwise gain 15% DEF for 20s.',
  },
  cons_focus_tonic_t1: {
    itemId: 'cons_focus_tonic_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 90,
    recommendedSlot: 'utility',
    effect: { kind: 'combatBuff', stat: 'crit', mode: 'flat', value: 0.05, durationSec: 25 },
    shortLabel: 'Focus Tonic',
    longLabel: 'Increase crit chance by 5 for 25s.',
  },
  cons_mastery_tonic_t1: {
    itemId: 'cons_mastery_tonic_t1',
    usage: 'combat_only',
    domain: 'combat',
    cooldownSec: 90,
    recommendedSlot: 'utility',
    effect: { kind: 'combatBuff', stat: 'atk', mode: 'pct', value: 0.15, durationSec: 25 },
    shortLabel: 'Mastery Tonic',
    longLabel: 'Increase ATK by 15% for 25s.',
  },
  cons_qi_elixir_t1: {
    itemId: 'cons_qi_elixir_t1',
    usage: 'cultivate_only',
    domain: 'cultivation',
    family: 'circulation',
    cooldownSec: 0,
    effect: {
      kind: 'cultivationBuff',
      family: 'circulation',
      durationSec: 10 * 60,
      modifiers: withCultivationModifiers({ qiRateMult: 1.25 }),
    },
    shortLabel: 'Qi Elixir',
    longLabel: '+25% Qi/sec for 10 minutes.',
  },
  cons_qi_elixir_t2: {
    itemId: 'cons_qi_elixir_t2',
    usage: 'cultivate_only',
    domain: 'cultivation',
    family: 'circulation',
    cooldownSec: 0,
    effect: {
      kind: 'cultivationBuff',
      family: 'circulation',
      durationSec: 15 * 60,
      modifiers: withCultivationModifiers({ qiRateMult: 1.4 }),
    },
    shortLabel: 'Qi Elixir (Refined)',
    longLabel: '+40% Qi/sec for 15 minutes.',
  },
  cons_meridian_warmth_draft_t1: {
    itemId: 'cons_meridian_warmth_draft_t1',
    usage: 'cultivate_only',
    domain: 'cultivation',
    family: 'warmth',
    cooldownSec: 0,
    effect: {
      kind: 'cultivationBuff',
      family: 'warmth',
      durationSec: 15 * 60,
      modifiers: withCultivationModifiers({ qiRateMult: 1.15, stabilityGainMult: 1.25 }),
    },
    shortLabel: 'Meridian Warmth Draft',
    longLabel: '+15% Qi/sec and +25% stability gain for 15 minutes.',
  },
  cons_quiet_breath_tea_t1: {
    itemId: 'cons_quiet_breath_tea_t1',
    usage: 'cultivate_only',
    domain: 'cultivation',
    family: 'doctrine',
    cooldownSec: 0,
    effect: {
      kind: 'cultivationBuff',
      family: 'doctrine',
      durationSec: 20 * 60,
      modifiers: withCultivationModifiers({ comprehensionGainMult: 1.35, insightFrequencyMult: 1.2 }),
    },
    shortLabel: 'Quiet Breath Tea',
    longLabel: '+35% comprehension gain and +20% insight frequency for 20 minutes.',
  },
  cons_purity_elixir_t1: {
    itemId: 'cons_purity_elixir_t1',
    usage: 'cultivate_only',
    domain: 'cultivation',
    family: 'breakthrough',
    cooldownSec: 0,
    effect: {
      kind: 'cultivationBuff',
      family: 'breakthrough',
      durationSec: 20 * 60,
      modifiers: withCultivationModifiers({
        breakthroughQiCostMult: 0.9,
        breakthroughStabilityBonus: 25,
      }),
      breakthroughChargesRemaining: 1,
    },
    shortLabel: 'Purity Elixir',
    longLabel: 'The next major breakthrough costs 10% less Qi and grants +25 stability.',
  },
};

export function getConsumableSpec(itemId: string): ConsumableSpec | null {
  return CONSUMABLE_SPECS[itemId] ?? null;
}

export function isCombatUsableConsumable(itemId: string): boolean {
  const spec = getConsumableSpec(itemId);
  if (!spec) return false;
  return spec.domain === 'combat';
}

export function isCultivationUsableConsumable(itemId: string): boolean {
  const spec = getConsumableSpec(itemId);
  if (!spec) return false;
  return spec.domain === 'cultivation';
}
