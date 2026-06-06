import { getApothecaryBundleCatalogEntry } from './apothecaryBundleCatalog.js';
function toWholeNumber(value) {
    const qty = Math.floor(Number(value));
    return Number.isFinite(qty) && qty > 0 ? qty : 0;
}
function addPrice(total, unitPrice, qty) {
    if (!unitPrice || qty <= 0)
        return total;
    Object.keys(unitPrice).forEach((key) => {
        const base = toWholeNumber(unitPrice[key]);
        if (base <= 0)
            return;
        total[key] = String(toWholeNumber(total[key]) + base * qty);
    });
    return total;
}
function formatCityName(content, cityId) {
    return content?.cities.find((city) => city.id === cityId)?.name ?? 'Today';
}
function formatItemName(content, itemId) {
    return content?.items.find((item) => item.id === itemId)?.name ?? itemId;
}
export function buildApothecaryCityBundle(options) {
    const { content, shop, inventoryItems, purchasedTodayByStockId = {} } = options;
    if (!shop)
        return null;
    const bundleDef = getApothecaryBundleCatalogEntry(shop);
    if (!bundleDef)
        return null;
    const items = [];
    let cost = {};
    bundleDef.lines.forEach((line) => {
        const stockEntry = shop.stock.find((stock) => stock.itemId === line.itemId);
        if (!stockEntry)
            return;
        const ownedQty = inventoryItems[line.itemId] ?? 0;
        const missingQty = Math.max(0, line.targetQty - ownedQty);
        if (missingQty <= 0)
            return;
        const purchased = purchasedTodayByStockId[stockEntry.id] ?? 0;
        const remainingByLimit = stockEntry.dailyLimit == null ? missingQty : Math.max(0, stockEntry.dailyLimit - purchased);
        const qty = Math.min(missingQty, remainingByLimit);
        if (qty <= 0)
            return;
        items.push({
            stockId: stockEntry.id,
            itemId: line.itemId,
            qty,
            itemName: formatItemName(content, line.itemId),
        });
        cost = addPrice(cost, stockEntry.price, qty);
    });
    if (items.length === 0)
        return null;
    const cityName = formatCityName(content, shop.cityId);
    return {
        id: `${shop.id}_daily_readiness_bundle`,
        name: `${cityName} ${bundleDef.nameSuffix}`,
        description: bundleDef.description,
        cost,
        items,
    };
}
