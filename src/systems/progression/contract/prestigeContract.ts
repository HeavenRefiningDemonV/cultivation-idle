import type { PrestigeUpgradeDef } from '../../../content/index.js';
import type { PrestigeClassificationHookSet } from './contractTypes.js';

const LIVE_PREFIXES = ['ap_', 'prestige_'] as const;
const SUPPORTED_STAT_CONSUMERS = {
  idleQiMult: 'qi_multiplier',
  combatMult: 'combat_multiplier',
  offlineEfficiencyAdd: 'offline_efficiency',
} as const;
const SUPPORTED_UNLOCKS = new Set(['tier1', 'tier2', 'tier3']);

export type PrestigeRuntimeConsumer =
  | 'qi_multiplier'
  | 'combat_multiplier'
  | 'offline_efficiency'
  | 'heart_law_unlock'
  | 'extra_technique_slot';

export type PrestigeNodeRuntimeStatus =
  | 'visible_live'
  | 'hidden_unsupported'
  | 'deferred'
  | 'unknown';

export const DEFERRED_PRESTIGE_NODE_IDS = [
  'ap_unlock_meridian_hall',
  'ap_unlock_spirit_garden',
  'ap_unlock_jade_core',
  'ap_unlock_pagoda',
  'ap_pagoda_sweep',
] as const;

export const DEFERRED_PRESTIGE_REFUND_COSTS: Record<(typeof DEFERRED_PRESTIGE_NODE_IDS)[number], number> = {
  ap_unlock_meridian_hall: 80,
  ap_unlock_spirit_garden: 80,
  ap_unlock_jade_core: 120,
  ap_unlock_pagoda: 120,
  ap_pagoda_sweep: 220,
};

export const VISIBLE_LIVE_PRESTIGE_NODE_IDS = [
  'ap_idle_qi_mult',
  'ap_combat_mult',
  'ap_offline_efficiency',
  'ap_unlock_heartlaw_t1',
  'ap_unlock_heartlaw_t2',
  'ap_unlock_heartlaw_t3',
  'ap_extra_technique_slot_1',
  'ap_extra_technique_slot_2',
] as const;

const PRESTIGE_UPGRADE_COSTS_BY_ID: Readonly<Record<string, readonly number[]>> = {
  ap_idle_qi_mult: [5, 8, 12, 18, 26, 36, 50, 70, 95, 125],
  ap_combat_mult: [5, 8, 12, 18, 26, 36, 50, 70, 95, 125],
  ap_offline_efficiency: [8, 14, 22, 34, 50],
  ap_unlock_heartlaw_t1: [25],
  ap_unlock_heartlaw_t2: [80],
  ap_unlock_heartlaw_t3: [220],
  ap_extra_heartlaw_choice: [120],
  ap_extra_technique_slot_1: [35],
  ap_extra_technique_slot_2: [120],
  ap_fragment_gain_boost: [10, 16, 24, 36, 52, 74, 105, 150],
  ap_pavilion_refresh_discount: [12, 22, 36, 54, 80],
  ap_mastery_retention_10: [40],
  ap_mastery_retention_25: [120],
  ap_mastery_retention_50: [320],
  ap_unlock_alchemy_queue: [20, 60, 140],
  ap_unlock_forge_queue: [20, 60, 140],
  ap_unlock_talisman_queue: [30, 90],
  ap_craft_speed_boost: [6, 10, 15, 22, 32, 46, 65, 90, 120, 160],
  ap_autosell_filter: [18],
  ap_autobuy_consumables: [26],
  ap_loot_filter: [30],
  ap_auto_retry_bosses: [45],
  ap_unlock_meridian_hall: [80],
  ap_unlock_spirit_garden: [80],
  ap_unlock_jade_core: [120],
  ap_unlock_pagoda: [120],
  ap_pagoda_sweep: [220],
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getNumericEffect = (effect: unknown, key: string): number | null => {
  if (!isRecord(effect)) return null;
  return typeof effect[key] === 'number' ? (effect[key] as number) : null;
};

export const getPrestigeRuntimeConsumers = (upgrade: PrestigeUpgradeDef): PrestigeRuntimeConsumer[] => {
  const consumers = new Set<PrestigeRuntimeConsumer>();

  if (upgrade.stat && upgrade.stat in SUPPORTED_STAT_CONSUMERS) {
    consumers.add(SUPPORTED_STAT_CONSUMERS[upgrade.stat as keyof typeof SUPPORTED_STAT_CONSUMERS]);
  }

  if (Array.isArray(upgrade.unlocks) && upgrade.unlocks.some((unlockId) => SUPPORTED_UNLOCKS.has(unlockId))) {
    consumers.add('heart_law_unlock');
  }

  if (getNumericEffect(upgrade.effect, 'extraTechniqueSlots') || getNumericEffect(upgrade.effectPerLevel, 'extraTechniqueSlots')) {
    consumers.add('extra_technique_slot');
  }

  return Array.from(consumers);
};

export const getPrestigeNodeRuntimeStatus = (
  nodeId: string,
  upgrade?: PrestigeUpgradeDef,
): PrestigeNodeRuntimeStatus => {
  if (DEFERRED_PRESTIGE_NODE_IDS.includes(nodeId as (typeof DEFERRED_PRESTIGE_NODE_IDS)[number])) return 'deferred';
  if (nodeId.startsWith('future_') || nodeId.startsWith('deferred_')) return 'deferred';

  if (upgrade) {
    return getPrestigeRuntimeConsumers(upgrade).length > 0 ? 'visible_live' : 'hidden_unsupported';
  }

  if (VISIBLE_LIVE_PRESTIGE_NODE_IDS.includes(nodeId as (typeof VISIBLE_LIVE_PRESTIGE_NODE_IDS)[number])) return 'visible_live';
  if (LIVE_PREFIXES.some((prefix) => nodeId.startsWith(prefix))) return 'hidden_unsupported';
  return 'unknown';
};

export const isRefundableHiddenPrestigeNode = (
  nodeId: string,
  upgrade?: PrestigeUpgradeDef,
): boolean => {
  const status = getPrestigeNodeRuntimeStatus(nodeId, upgrade);
  return status === 'hidden_unsupported' || status === 'deferred';
};

export const getPrestigeRefundAmount = (
  nodeId: string,
  purchasedLevels: number,
  upgrade?: PrestigeUpgradeDef,
): number => {
  if (purchasedLevels <= 0) return 0;

  const authoredCosts = upgrade?.costs?.filter((cost): cost is number => typeof cost === 'number' && Number.isFinite(cost) && cost >= 0);
  const costs = authoredCosts && authoredCosts.length > 0 ? authoredCosts : PRESTIGE_UPGRADE_COSTS_BY_ID[nodeId];
  if (!costs || costs.length === 0) {
    return 0;
  }

  return costs.slice(0, purchasedLevels).reduce((sum, cost) => sum + cost, 0);
};

export const createPrestigeClassificationHooks = (): PrestigeClassificationHookSet => ({
  classifyNode: (nodeId: string) => {
    if (DEFERRED_PRESTIGE_NODE_IDS.includes(nodeId as (typeof DEFERRED_PRESTIGE_NODE_IDS)[number])) return 'deferred';
    if (LIVE_PREFIXES.some((prefix) => nodeId.startsWith(prefix))) return 'live';
    if (nodeId.startsWith('future_') || nodeId.startsWith('deferred_')) return 'deferred';
    return 'unknown';
  },
});
