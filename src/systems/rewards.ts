import { useInventoryStore } from '../stores/inventoryStore';
import { useRewardsLogStore } from '../stores/rewardsLogStore';
import { getItemDef } from '../stores/contentStore';

export type RewardCurrencyBundle = {
  gold?: string;
  spiritStones?: string;
  merit?: string;
};

export type RewardItemBundle = {
  itemId: string;
  qty: number;
};

export type RewardTechniqueFragmentBundle = {
  techId: string;
  qty: number;
};

export type RewardBundle = {
  currencies?: RewardCurrencyBundle;
  items?: RewardItemBundle[];
  techniqueFragments?: RewardTechniqueFragmentBundle[];
  comprehension?: number;
};

export type GrantRewardsResult = {
  appliedCurrencies: RewardCurrencyBundle;
  appliedItems: RewardItemBundle[];
  droppedItems: RewardItemBundle[];
};

function normalizeCurrency(amount: string | undefined): string {
  if (!amount) return '0';
  if (typeof amount !== 'string') return '0';
  const trimmed = amount.trim();
  if (!trimmed) return '0';
  return trimmed;
}

function nameForItem(itemId: string): string {
  const def = getItemDef(itemId);
  return def?.name ?? itemId;
}

function buildSummary(result: GrantRewardsResult): string {
  const parts: string[] = [];

  const gold = normalizeCurrency(result.appliedCurrencies.gold);
  const spiritStones = normalizeCurrency(result.appliedCurrencies.spiritStones);
  const merit = normalizeCurrency(result.appliedCurrencies.merit);

  if (gold !== '0') parts.push(`+${gold} Gold`);
  if (spiritStones !== '0') parts.push(`+${spiritStones} Spirit Stones`);
  if (merit !== '0') parts.push(`+${merit} Merit`);

  for (const item of result.appliedItems) {
    if (!item || !item.itemId || item.qty <= 0) continue;
    parts.push(`+${item.qty} ${nameForItem(item.itemId)}`);
  }

  if (result.droppedItems.length > 0) {
    const dropped = result.droppedItems
      .filter((i) => i && i.itemId && i.qty > 0)
      .map((i) => `${i.qty} ${nameForItem(i.itemId)}`)
      .join(', ');
    if (dropped) parts.push(`(Dropped: ${dropped})`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No rewards.';
}

/**
 * Central reward pipeline used by all future modules.
 *
 * - Adds currencies + items to InventoryStore
 * - (Stub) Routes technique fragments / comprehension to their future systems
 * - Logs the reward grant with a reason
 */
export function grantRewards(bundle: RewardBundle, reason: string): GrantRewardsResult {
  const inventory = useInventoryStore.getState();

  const appliedCurrencies: RewardCurrencyBundle = {};
  const appliedItems: RewardItemBundle[] = [];
  const droppedItems: RewardItemBundle[] = [];

  // Currencies
  const currencies = bundle.currencies ?? {};

  const gold = normalizeCurrency(currencies.gold);
  if (gold !== '0') {
    inventory.addCurrency('gold', gold);
    appliedCurrencies.gold = gold;
  }

  const spiritStones = normalizeCurrency(currencies.spiritStones);
  if (spiritStones !== '0') {
    inventory.addCurrency('spiritStones', spiritStones);
    appliedCurrencies.spiritStones = spiritStones;
  }

  const merit = normalizeCurrency(currencies.merit);
  if (merit !== '0') {
    inventory.addCurrency('merit', merit);
    appliedCurrencies.merit = merit;
  }

  // Items
  const items = Array.isArray(bundle.items) ? bundle.items : [];
  for (const item of items) {
    if (!item || !item.itemId || typeof item.qty !== 'number' || item.qty <= 0) continue;

    const before = inventory.getItemCount(item.itemId);
    const success = inventory.addItem(item.itemId, item.qty);
    const after = inventory.getItemCount(item.itemId);

    const addedQty = Math.max(0, after - before);
    const droppedQty = Math.max(0, item.qty - addedQty);

    if (addedQty > 0) {
      appliedItems.push({ itemId: item.itemId, qty: addedQty });
    }

    if (droppedQty > 0) {
      droppedItems.push({ itemId: item.itemId, qty: droppedQty });
    }

    // If inventory is full, we stop processing additional items.
    if (!success) {
      break;
    }
  }

  // Technique fragments (stub)
  if (Array.isArray(bundle.techniqueFragments) && bundle.techniqueFragments.length > 0) {
    console.log('[Rewards] techniqueFragments not wired yet:', bundle.techniqueFragments);
  }

  // Comprehension (stub)
  if (typeof bundle.comprehension === 'number' && !Number.isNaN(bundle.comprehension)) {
    console.log('[Rewards] comprehension not wired yet:', bundle.comprehension);
  }

  const result: GrantRewardsResult = {
    appliedCurrencies,
    appliedItems,
    droppedItems,
  };

  const summary = buildSummary(result);

  useRewardsLogStore.getState().addEntry({
    reason,
    summary,
  });

  console.log(`[Rewards] ${reason}: ${summary}`);

  return result;
}
