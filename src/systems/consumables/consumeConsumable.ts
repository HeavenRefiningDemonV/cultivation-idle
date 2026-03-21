import { useCombatStore } from '../../stores/combatStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { getConsumableSpec } from './consumableCatalog.js';
import { isLiveConsumableItem } from './liveConsumableRoster.js';

export type ConsumeConsumableResult =
  | { ok: true; itemId: string; domain: 'combat' | 'cultivation'; message: string }
  | { ok: false; itemId: string; reason: string };

export function consumeConsumable(itemId: string, now = Date.now()): ConsumeConsumableResult {
  const spec = getConsumableSpec(itemId);
  if (!spec) return { ok: false, itemId, reason: 'unknown_spec' };
  if (!isLiveConsumableItem(itemId)) return { ok: false, itemId, reason: 'not_live' };

  if (spec.domain === 'combat') {
    const result = useCombatStore.getState().consumeCombatConsumable(itemId, 'manual', now);
    if (!result.ok) {
      return { ok: false, itemId, reason: result.reason };
    }
    return { ok: true, itemId, domain: 'combat', message: `Used ${spec.shortLabel}.` };
  }

  const inventory = useInventoryStore.getState();
  if (!inventory.spendItem(itemId, 1)) {
    return { ok: false, itemId, reason: 'no_charges' };
  }

  const activation = useCultivationStore.getState().useCultivationConsumable(itemId, now);
  if (!activation.ok) {
    inventory.addItem(itemId, 1);
    return { ok: false, itemId, reason: activation.reason };
  }
  useGameStore.getState().calculateQiPerSecond();

  return {
    ok: true,
    itemId,
    domain: 'cultivation',
    message: `Consumed ${spec.shortLabel}. ${spec.longLabel ?? ''}`.trim(),
  };
}
