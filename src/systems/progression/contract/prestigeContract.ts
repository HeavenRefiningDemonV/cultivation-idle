import type { PrestigeClassificationHookSet } from './contractTypes.js';

const LIVE_PREFIXES = ['ap_', 'prestige_'];

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

export const createPrestigeClassificationHooks = (): PrestigeClassificationHookSet => ({
  classifyNode: (nodeId: string) => {
    if (DEFERRED_PRESTIGE_NODE_IDS.includes(nodeId as (typeof DEFERRED_PRESTIGE_NODE_IDS)[number])) return 'deferred';
    if (LIVE_PREFIXES.some((prefix) => nodeId.startsWith(prefix))) return 'live';
    if (nodeId.startsWith('future_') || nodeId.startsWith('deferred_')) return 'deferred';
    return 'unknown';
  },
});
