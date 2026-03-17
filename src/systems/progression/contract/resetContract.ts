import type { ResetClassificationHookSet } from './contractTypes.js';

const PERMANENT_KEYS = ['prestigeState.totalAP', 'prestigeState.purchasesById'];
const PER_LIFE_KEYS = ['gameState.realm', 'inventoryState.items', 'zoneState.zoneProgress'];

export const createResetClassificationHooks = (): ResetClassificationHookSet => ({
  classifyKey: (key: string) => {
    if (PERMANENT_KEYS.includes(key)) return 'permanent';
    if (PER_LIFE_KEYS.includes(key)) return 'per_life';
    const normalized = key.toLowerCase();
    if (normalized.includes('retention') || normalized.includes('carryover')) return 'hybrid';
    return 'unknown';
  },
});
