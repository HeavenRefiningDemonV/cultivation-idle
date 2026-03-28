export const CONSUMABLE_SPECS = {
    cons_healing_pellet_t1: {
        itemId: 'cons_healing_pellet_t1', domain: 'combat', usage: 'combat_or_world', cooldownSec: 10, recommendedSlot: 'healing',
        effect: { kind: 'healPct', pct: 0.3 }, shortLabel: 'Healing Pellet',
    },
    cons_ward_salt_t1: {
        itemId: 'cons_ward_salt_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 45, recommendedSlot: 'utility', durationSec: 15,
        effect: { kind: 'shieldPct', pct: 0.2, durationSec: 15 }, shortLabel: 'Ward Salt',
    },
    cons_ward_salt_t2: {
        itemId: 'cons_ward_salt_t2', domain: 'combat', usage: 'combat_only', cooldownSec: 45, recommendedSlot: 'utility', durationSec: 18,
        effect: { kind: 'shieldPct', pct: 0.3, durationSec: 18 }, shortLabel: 'Ward Salt (Strong)',
    },
    cons_ironblood_pellet_t1: {
        itemId: 'cons_ironblood_pellet_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 60, recommendedSlot: 'specialty', durationSec: 20,
        effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.25, durationSec: 20 }, shortLabel: 'Ironblood Pellet',
    },
    cons_ironblood_pellet_t2: {
        itemId: 'cons_ironblood_pellet_t2', domain: 'combat', usage: 'combat_only', cooldownSec: 60, recommendedSlot: 'specialty', durationSec: 25,
        effect: { kind: 'combatBuff', stat: 'def', mode: 'pct', value: 0.35, durationSec: 25 }, shortLabel: 'Ironblood Pellet (Strong)',
    },
    cons_windstep_powder_t1: {
        itemId: 'cons_windstep_powder_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 60, recommendedSlot: 'specialty', durationSec: 20,
        effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.2, durationSec: 20 }, shortLabel: 'Windstep Powder',
    },
    cons_windstep_powder_t2: {
        itemId: 'cons_windstep_powder_t2', domain: 'combat', usage: 'combat_only', cooldownSec: 60, recommendedSlot: 'specialty', durationSec: 25,
        effect: { kind: 'combatBuff', stat: 'dodge', mode: 'pct', value: 0.3, durationSec: 25 }, shortLabel: 'Windstep Powder (Strong)',
    },
    cons_anti_venom_pellet_t1: {
        itemId: 'cons_anti_venom_pellet_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 75, recommendedSlot: 'utility', durationSec: 20,
        effect: { kind: 'cleanseOrFallbackBuff', fallbackStat: 'def', fallbackValue: 0.15, durationSec: 20 }, shortLabel: 'Anti-Venom Pellet',
    },
    cons_focus_tonic_t1: {
        itemId: 'cons_focus_tonic_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 90, recommendedSlot: 'utility', durationSec: 25,
        effect: { kind: 'combatBuff', stat: 'crit', mode: 'flat', value: 0.05, durationSec: 25 }, shortLabel: 'Focus Tonic',
    },
    cons_mastery_tonic_t1: {
        itemId: 'cons_mastery_tonic_t1', domain: 'combat', usage: 'combat_only', cooldownSec: 90, recommendedSlot: 'utility', durationSec: 25,
        effect: { kind: 'combatBuff', stat: 'atk', mode: 'pct', value: 0.15, durationSec: 25 }, shortLabel: 'Mastery Tonic',
    },
    cons_qi_elixir_t1: {
        itemId: 'cons_qi_elixir_t1', domain: 'cultivation', usage: 'cultivate_only', cooldownSec: 0, recommendedSlot: null, family: 'circulation', durationSec: 600,
        effect: { kind: 'cultivationBuff', family: 'circulation', durationSec: 600, modifiers: { qiRateMult: 1.25, comprehensionGainMult: 1, stabilityGainMult: 1, insightFrequencyMult: 1, majorBreakthroughQiCostMult: 1, majorBreakthroughStabilityBonus: 0 } },
        shortLabel: 'Qi Elixir', longLabel: '+25% Qi/sec for 10 minutes.',
    },
    cons_qi_elixir_t2: {
        itemId: 'cons_qi_elixir_t2', domain: 'cultivation', usage: 'cultivate_only', cooldownSec: 0, recommendedSlot: null, family: 'circulation', durationSec: 900,
        effect: { kind: 'cultivationBuff', family: 'circulation', durationSec: 900, modifiers: { qiRateMult: 1.4, comprehensionGainMult: 1, stabilityGainMult: 1, insightFrequencyMult: 1, majorBreakthroughQiCostMult: 1, majorBreakthroughStabilityBonus: 0 } },
        shortLabel: 'Qi Elixir (Strong)', longLabel: '+40% Qi/sec for 15 minutes.',
    },
    cons_meridian_warmth_draft_t1: {
        itemId: 'cons_meridian_warmth_draft_t1', domain: 'cultivation', usage: 'cultivate_only', cooldownSec: 0, recommendedSlot: null, family: 'warmth', durationSec: 900,
        effect: { kind: 'cultivationBuff', family: 'warmth', durationSec: 900, modifiers: { qiRateMult: 1.15, comprehensionGainMult: 1, stabilityGainMult: 1.25, insightFrequencyMult: 1, majorBreakthroughQiCostMult: 1, majorBreakthroughStabilityBonus: 0 } },
        shortLabel: 'Meridian Warmth Draft', longLabel: '+15% Qi/sec and +25% stability gain for 15 minutes.',
    },
    cons_quiet_breath_tea_t1: {
        itemId: 'cons_quiet_breath_tea_t1', domain: 'cultivation', usage: 'cultivate_only', cooldownSec: 0, recommendedSlot: null, family: 'doctrine', durationSec: 1200,
        effect: { kind: 'cultivationBuff', family: 'doctrine', durationSec: 1200, modifiers: { qiRateMult: 1, comprehensionGainMult: 1.35, stabilityGainMult: 1, insightFrequencyMult: 1.2, majorBreakthroughQiCostMult: 1, majorBreakthroughStabilityBonus: 0 } },
        shortLabel: 'Quiet Breath Tea', longLabel: '+35% comprehension gain and +20% insight frequency for 20 minutes.',
    },
    cons_purity_elixir_t1: {
        itemId: 'cons_purity_elixir_t1', domain: 'cultivation', usage: 'cultivate_only', cooldownSec: 0, recommendedSlot: null, family: 'breakthrough', durationSec: 1200,
        effect: { kind: 'cultivationBuff', family: 'breakthrough', durationSec: 1200, modifiers: { qiRateMult: 1, comprehensionGainMult: 1, stabilityGainMult: 1, insightFrequencyMult: 1, majorBreakthroughQiCostMult: 0.9, majorBreakthroughStabilityBonus: 25 } },
        shortLabel: 'Purity Elixir', longLabel: 'Next major breakthrough costs 10% less Qi and grants +25 stability on success for 20 minutes.',
    },
};
export function getConsumableSpec(itemId) { return CONSUMABLE_SPECS[itemId] ?? null; }
export function isCombatUsableConsumable(itemId) { const spec = getConsumableSpec(itemId); return !!spec && spec.domain === 'combat'; }
export function isCultivationUsableConsumable(itemId) { const spec = getConsumableSpec(itemId); return !!spec && spec.domain === 'cultivation'; }
