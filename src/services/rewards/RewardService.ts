import { GameEvents } from '../events/GameEvents';
import { useInventoryStore } from '../../stores/inventoryStore';
import { normalizeItemList } from '../../utils/itemList';
import { buildRewardSummary, normalizeRewardBundle } from './rewardSummary';
import type { RewardBundle, GrantRewardsResult, RewardCurrencyBundle } from './types';

function sanitizeAmount(amount: string | undefined): string | null {
  if (!amount) return null;
  const trimmed = amount.trim();
  if (!trimmed) return null;
  return trimmed;
}

function applyCurrencies(currencies: RewardCurrencyBundle, result: GrantRewardsResult) {
  const inventory = useInventoryStore.getState();

  (Object.keys(currencies) as Array<keyof RewardCurrencyBundle>).forEach((key) => {
    const raw = currencies[key];
    const sanitized = sanitizeAmount(raw);
    if (!sanitized) return;

    inventory.addCurrency(key, sanitized);
    result.appliedCurrencies[key] = sanitized;
  });
}

function applyItems(items: RewardBundle['items'] | undefined, result: GrantRewardsResult) {
  if (!items || items.length === 0) return;
  const inventory = useInventoryStore.getState();

  for (const item of normalizeItemList(items)) {
    if (!item?.itemId || item.qty <= 0) continue;

    const before = inventory.getQty(item.itemId);
    const added = inventory.addItem(item.itemId, item.qty);
    const after = inventory.getQty(item.itemId);

    const appliedQty = Math.max(0, after - before);
    const droppedQty = Math.max(0, item.qty - appliedQty);

    if (appliedQty > 0) {
      result.appliedItems.push({ itemId: item.itemId, qty: appliedQty });
    }

    if (droppedQty > 0) {
      result.droppedItems.push({ itemId: item.itemId, qty: droppedQty });
    }

    if (!added) {
      break;
    }
  }
}

function emitRewardGranted(bundle: RewardBundle, result: GrantRewardsResult, reason: string, timestamp: number) {
  const summary = buildRewardSummary(result);
  GameEvents.emit({
    type: 'rewards/granted',
    payload: {
      bundle,
      result,
      reason,
      summary,
      timestamp,
    },
  });
}

export const RewardService = {
  grantRewards(bundle: RewardBundle, reason: string): GrantRewardsResult {
    const normalized = normalizeRewardBundle(bundle ?? {});

    const result: GrantRewardsResult = {
      appliedCurrencies: {},
      appliedItems: [],
      droppedItems: [],
    };

    if (normalized.currencies) {
      applyCurrencies(normalized.currencies, result);
    }

    applyItems(normalized.items, result);

    if (Array.isArray(normalized.techniqueFragments) && normalized.techniqueFragments.length > 0) {
      console.log('[RewardService] techniqueFragments not wired yet:', normalized.techniqueFragments);
    }

    if (typeof normalized.comprehension === 'number') {
      console.log('[RewardService] comprehension not wired yet:', normalized.comprehension);
    }

    emitRewardGranted(normalized, result, reason, Date.now());

    return result;
  },

  spendCurrency(costs: RewardCurrencyBundle, reason?: string): boolean {
    const inventory = useInventoryStore.getState();
    const ok = inventory.spendCurrencies(costs);
    if (!ok) {
      console.warn('[RewardService] Failed to spend currency', reason, costs);
    }
    return ok;
  },
};
