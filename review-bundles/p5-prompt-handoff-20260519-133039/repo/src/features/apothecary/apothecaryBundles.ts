import type { ApothecaryShopDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/index.js';
import type { ApothecaryPrice } from '../../content/types.js';
import { getApothecaryBundleCatalogEntry } from './apothecaryBundleCatalog.js';

type BundleLine = {
  stockId: string;
  itemId: string;
  qty: number;
  itemName: string;
};

export interface ApothecaryCityBundle {
  id: string;
  name: string;
  description: string;
  cost: ApothecaryPrice;
  items: BundleLine[];
}

function toWholeNumber(value: unknown): number {
  const qty = Math.floor(Number(value));
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function addPrice(total: ApothecaryPrice, unitPrice: ApothecaryPrice | undefined, qty: number) {
  if (!unitPrice || qty <= 0) return total;

  (Object.keys(unitPrice) as Array<keyof ApothecaryPrice>).forEach((key) => {
    const base = toWholeNumber(unitPrice[key]);
    if (base <= 0) return;
    total[key] = String(toWholeNumber(total[key]) + base * qty);
  });

  return total;
}

function formatCityName(content: ValidatedContent | null, cityId: string | undefined): string {
  return content?.cities.find((city) => city.id === cityId)?.name ?? 'Today';
}

function formatItemName(content: ValidatedContent | null, itemId: string) {
  return content?.items.find((item) => item.id === itemId)?.name ?? itemId;
}

export function buildApothecaryCityBundle(options: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
  purchasedTodayByStockId?: Record<string, number>;
}): ApothecaryCityBundle | null {
  const { content, shop, inventoryItems, purchasedTodayByStockId = {} } = options;
  if (!shop) return null;
  const bundleDef = getApothecaryBundleCatalogEntry(shop);
  if (!bundleDef) return null;

  const items: BundleLine[] = [];
  let cost: ApothecaryPrice = {};

  bundleDef.lines.forEach((line) => {
    const stockEntry = shop.stock.find((stock) => stock.itemId === line.itemId);
    if (!stockEntry) return;

    const ownedQty = inventoryItems[line.itemId] ?? 0;
    const missingQty = Math.max(0, line.targetQty - ownedQty);
    if (missingQty <= 0) return;

    const purchased = purchasedTodayByStockId[stockEntry.id] ?? 0;
    const remainingByLimit =
      stockEntry.dailyLimit == null ? missingQty : Math.max(0, stockEntry.dailyLimit - purchased);
    const qty = Math.min(missingQty, remainingByLimit);
    if (qty <= 0) return;

    items.push({
      stockId: stockEntry.id,
      itemId: line.itemId,
      qty,
      itemName: formatItemName(content, line.itemId),
    });
    cost = addPrice(cost, stockEntry.price, qty);
  });

  if (items.length === 0) return null;

  const cityName = formatCityName(content, shop.cityId);

  return {
    id: `${shop.id}_daily_readiness_bundle`,
    name: `${cityName} ${bundleDef.nameSuffix}`,
    description: bundleDef.description,
    cost,
    items,
  };
}
