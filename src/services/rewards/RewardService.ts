import { GameEvents } from '../events/GameEvents.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { normalizeItemList } from '../../utils/itemList.js';
import { buildRewardSummary, normalizeRewardBundle } from './rewardSummary.js';
import type { RewardBundle, GrantRewardsResult, RewardCurrencyBundle } from './types.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';

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

function applyTechniqueFragments(fragments: RewardBundle['techniqueFragments'] | undefined, result: GrantRewardsResult) {
  if (!fragments || fragments.length === 0) return;
  const techCollection = useTechCollectionStore.getState();
  fragments.forEach((fragment) => {
    if (!fragment || !fragment.techId) {
      result.skippedRewards.push({ kind: 'techniqueFragment', reason: 'missing_id', payload: fragment });
      return;
    }
    const qty = Math.max(0, Math.floor(fragment.qty ?? 0));
    if (qty <= 0) {
      result.skippedRewards.push({ kind: 'techniqueFragment', reason: 'invalid_amount', payload: fragment });
      return;
    }
    techCollection.addFragments(fragment.techId, qty);
    result.appliedTechniqueFragments.push({ techId: fragment.techId, qty });
  });
}

function buildManualInstanceId(manualId: string, index: number, existingIds: Set<string>): string {
  if (index === 0 && !existingIds.has(manualId)) {
    existingIds.add(manualId);
    return manualId;
  }

  let candidate = '';
  do {
    candidate = `${manualId}_${Date.now()}_${index + 1}_${Math.random().toString(36).slice(2, 8)}`;
  } while (existingIds.has(candidate));
  existingIds.add(candidate);
  return candidate;
}

function applyManuals(manuals: RewardBundle['manuals'] | undefined, result: GrantRewardsResult) {
  if (!manuals || manuals.length === 0) return;
  const satchel = useManualSatchelStore.getState();
  const existingIds = new Set(satchel.manuals.map((manual) => manual.id));
  manuals.forEach((manual) => {
    if (!manual || !manual.manualId || !manual.techId) {
      result.skippedRewards.push({ kind: 'manual', reason: 'missing_id', payload: manual });
      return;
    }
    const qty = Math.max(0, Math.floor(manual.qty ?? 0));
    if (qty <= 0) {
      result.skippedRewards.push({ kind: 'manual', reason: 'invalid_amount', payload: manual });
      return;
    }
    for (let i = 0; i < qty; i += 1) {
      satchel.addManual({
        id: buildManualInstanceId(manual.manualId, i, existingIds),
        techId: manual.techId,
        grade: manual.grade,
        rarity: manual.rarity,
        acquiredAt: Date.now(),
      });
    }
    result.appliedManuals.push({ ...manual, qty });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function recordMalformedManualRewards(manuals: RewardBundle['manuals'] | undefined, result: GrantRewardsResult) {
  if (!Array.isArray(manuals) || manuals.length === 0) return;

  (manuals as unknown[]).forEach((manual) => {
    if (!isRecord(manual) || typeof manual.manualId !== 'string' || !manual.manualId || typeof manual.techId !== 'string' || !manual.techId) {
      result.skippedRewards.push({ kind: 'manual', reason: 'missing_id', payload: manual });
      return;
    }

    const qty = manual.qty;
    if (typeof qty !== 'number' || !Number.isFinite(qty) || Math.floor(qty) <= 0) {
      result.skippedRewards.push({ kind: 'manual', reason: 'invalid_amount', payload: manual });
    }
  });
}

function applyComprehension(amount: number | undefined, result: GrantRewardsResult, reason: string) {
  if (typeof amount === 'undefined') return;
  if (!Number.isFinite(amount) || amount <= 0) {
    result.appliedComprehension = {
      amount: Number.isFinite(amount) ? amount : 0,
      applied: false,
      source: reason,
      targetHeartLawId: null,
      skippedReason: 'invalid_amount',
    };
    result.skippedRewards.push({
      kind: 'comprehension',
      reason: 'invalid_amount',
      payload: { amount, source: reason },
    });
    return;
  }

  const heart = useHeartLawStore.getState();
  const selectedHeartLawId = heart.selectedHeartLawId;
  if (!selectedHeartLawId) {
    result.appliedComprehension = {
      amount,
      applied: false,
      source: reason,
      targetHeartLawId: null,
      skippedReason: 'no_selected_heart_law',
    };
    result.skippedRewards.push({
      kind: 'comprehension',
      reason: 'no_selected_heart_law',
      payload: { amount, source: reason },
    });
    return;
  }

  const before = {
    chapter: heart.chapter,
    comprehension: heart.comprehension,
  };
  heart.addComprehension(amount, 'rewardBundle');
  const afterState = useHeartLawStore.getState();
  result.appliedComprehension = {
    amount,
    applied: true,
    source: reason,
    targetHeartLawId: selectedHeartLawId,
    before,
    after: {
      chapter: afterState.chapter,
      comprehension: afterState.comprehension,
    },
  };
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
      appliedTechniqueFragments: [],
      appliedManuals: [],
      appliedComprehension: null,
      skippedRewards: [],
    };

    recordMalformedManualRewards(bundle?.manuals, result);

    if (normalized.currencies) {
      applyCurrencies(normalized.currencies, result);
    }

    applyItems(normalized.items, result);

    applyTechniqueFragments(normalized.techniqueFragments, result);
    applyManuals(normalized.manuals, result);
    applyComprehension(normalized.comprehension, result, reason);

    emitRewardGranted(normalized, result, reason, Date.now());

    return result;
  },

  spendCurrency(costs: RewardCurrencyBundle, reason?: string): boolean {
    const inventory = useInventoryStore.getState();
    const ok = inventory.spendCurrencies(costs);
    if (!ok) {
      console.warn('[RewardService] Failed to spend currency', reason, costs);
      return false;
    }
    GameEvents.emit({ type: 'rewards/spent', payload: { costs, reason } });
    return ok;
  },
};
