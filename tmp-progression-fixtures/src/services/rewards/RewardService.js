import { GameEvents } from '../events/GameEvents.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { normalizeItemList } from '../../utils/itemList.js';
import { buildRewardSummary, normalizeRewardBundle } from './rewardSummary.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
function sanitizeAmount(amount) {
    if (!amount)
        return null;
    const trimmed = amount.trim();
    if (!trimmed)
        return null;
    return trimmed;
}
function applyCurrencies(currencies, result) {
    const inventory = useInventoryStore.getState();
    Object.keys(currencies).forEach((key) => {
        const raw = currencies[key];
        const sanitized = sanitizeAmount(raw);
        if (!sanitized)
            return;
        inventory.addCurrency(key, sanitized);
        result.appliedCurrencies[key] = sanitized;
    });
}
function applyItems(items, result) {
    if (!items || items.length === 0)
        return;
    const inventory = useInventoryStore.getState();
    for (const item of normalizeItemList(items)) {
        if (!item?.itemId || item.qty <= 0)
            continue;
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
function applyTechniqueFragments(fragments) {
    if (!fragments || fragments.length === 0)
        return;
    const techCollection = useTechCollectionStore.getState();
    fragments.forEach((fragment) => {
        if (!fragment || !fragment.techId)
            return;
        const qty = Math.max(0, Math.floor(fragment.qty ?? 0));
        if (qty <= 0)
            return;
        techCollection.addFragments(fragment.techId, qty);
    });
}
function applyManuals(manuals) {
    if (!manuals || manuals.length === 0)
        return;
    const satchel = useManualSatchelStore.getState();
    manuals.forEach((manual) => {
        if (!manual || !manual.techId)
            return;
        const qty = Math.max(1, Math.floor(manual.qty ?? 0));
        for (let i = 0; i < qty; i += 1) {
            satchel.addManual({
                techId: manual.techId,
                grade: manual.grade,
                rarity: manual.rarity,
                acquiredAt: Date.now(),
            });
        }
    });
}
function emitRewardGranted(bundle, result, reason, timestamp) {
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
    grantRewards(bundle, reason) {
        const normalized = normalizeRewardBundle(bundle ?? {});
        const result = {
            appliedCurrencies: {},
            appliedItems: [],
            droppedItems: [],
        };
        if (normalized.currencies) {
            applyCurrencies(normalized.currencies, result);
        }
        applyItems(normalized.items, result);
        applyTechniqueFragments(normalized.techniqueFragments);
        applyManuals(normalized.manuals);
        if (typeof normalized.comprehension === 'number') {
            console.log('[RewardService] comprehension not wired yet:', normalized.comprehension);
        }
        emitRewardGranted(normalized, result, reason, Date.now());
        return result;
    },
    spendCurrency(costs, reason) {
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
