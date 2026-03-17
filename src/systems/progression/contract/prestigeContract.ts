import type { PrestigeClassificationHookSet } from './contractTypes.js';

const LIVE_PREFIXES = ['ap_', 'prestige_'];

export const createPrestigeClassificationHooks = (): PrestigeClassificationHookSet => ({
  classifyNode: (nodeId: string) => {
    if (LIVE_PREFIXES.some((prefix) => nodeId.startsWith(prefix))) return 'live';
    if (nodeId.startsWith('future_') || nodeId.startsWith('deferred_')) return 'deferred';
    return 'unknown';
  },
});
