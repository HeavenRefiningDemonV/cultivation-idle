export function normalizeItemList(input) {
    if (!input)
        return [];
    if (Array.isArray(input))
        return input;
    if (typeof input === 'object') {
        return Object.entries(input)
            .map(([itemId, qty]) => ({ itemId, qty: Number(qty) }))
            .filter((entry) => entry.itemId && Number.isFinite(entry.qty) && entry.qty > 0);
    }
    return [];
}
export function sumItemQty(items) {
    return items.reduce((sum, item) => sum + (Number.isFinite(item.qty) ? item.qty : 0), 0);
}
