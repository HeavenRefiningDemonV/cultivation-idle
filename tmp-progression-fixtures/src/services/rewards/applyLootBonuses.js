import { getItemDef } from '../../stores/contentStore.js';
import { getTalismanBonusesNow } from '../../stores/buffStore.js';
import { normalizeItemList } from '../../utils/itemList.js';
import { D } from '../../utils/numbers.js';
export function applyLootBonuses(bundle, _context) {
    if (!bundle || (!bundle.currencies && !bundle.items && !bundle.techniqueFragments)) {
        return bundle;
    }
    const bonuses = getTalismanBonusesNow();
    const goldBonus = Math.max(0, bonuses.goldDropBonusPct);
    const matBonus = Math.max(0, bonuses.matDropBonusPct);
    const fragmentBonus = Math.max(0, bonuses.fragmentDropBonusPct);
    if (goldBonus <= 0 && matBonus <= 0 && fragmentBonus <= 0) {
        return bundle;
    }
    const normalizedItems = normalizeItemList(bundle.items);
    const next = {
        currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
        items: normalizedItems.length > 0 ? normalizedItems.map((item) => ({ ...item })) : undefined,
        techniqueFragments: bundle.techniqueFragments
            ? bundle.techniqueFragments.map((fragment) => ({ ...fragment }))
            : undefined,
        comprehension: bundle.comprehension,
    };
    if (next.currencies?.gold && goldBonus > 0) {
        const baseGold = D(next.currencies.gold);
        const multiplier = D(1).plus(D(goldBonus).dividedBy(100));
        const adjusted = baseGold.times(multiplier).floor();
        next.currencies.gold = adjusted.toString();
    }
    if (Array.isArray(next.items) && matBonus > 0) {
        const multiplier = D(1).plus(D(matBonus).dividedBy(100));
        next.items = next.items.map((item) => {
            if (!item?.itemId || item.itemId.startsWith('gate_'))
                return item;
            const def = getItemDef(item.itemId);
            if (def?.category !== 'material')
                return item;
            const adjustedQty = D(item.qty).times(multiplier).floor().toNumber();
            return { ...item, qty: Math.max(0, adjustedQty) };
        });
    }
    if (Array.isArray(next.techniqueFragments) && fragmentBonus > 0) {
        const multiplier = D(1).plus(D(fragmentBonus).dividedBy(100));
        next.techniqueFragments = next.techniqueFragments.map((fragment) => {
            const adjustedQty = D(fragment.qty).times(multiplier).floor().toNumber();
            return { ...fragment, qty: Math.max(0, adjustedQty) };
        });
    }
    return next;
}
