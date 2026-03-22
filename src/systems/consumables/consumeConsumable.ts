import { useCombatStore } from '../../stores/combatStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { getConsumableSpec } from './consumableCatalog.js';

export type ConsumeConsumableResult = { ok: true; message: string } | { ok: false; reason: string; message: string };

export function consumeConsumable(itemId: string, now = Date.now()): ConsumeConsumableResult {
  const spec = getConsumableSpec(itemId);
  if (!spec) return { ok: false, reason: 'unknown_spec', message: 'Consumable effect data is missing.' };

  if (spec.domain === 'combat') {
    const result = useCombatStore.getState().consumeCombatConsumable(itemId, 'manual', now);
    if (!result.ok) {
      return { ok: false, reason: result.reason ?? 'combat_failed', message: 'Cannot use that combat consumable right now.' };
    }
    return { ok: true, message: `Used ${spec.shortLabel}.` };
  }

  const inventory = useInventoryStore.getState();
  if (!inventory.spendItem(itemId, 1)) {
    return { ok: false, reason: 'no_charges', message: 'You do not own that consumable.' };
  }

  const result = useCultivationStore.getState().useCultivationConsumable(itemId, now);
  if (!result.ok) {
    inventory.addItem(itemId, 1);
    return { ok: false, reason: result.reason, message: result.message };
  }

  return { ok: true, message: result.message };
}
