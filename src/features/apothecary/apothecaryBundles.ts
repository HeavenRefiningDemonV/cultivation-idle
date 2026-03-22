import type { ApothecaryShopDef, ValidatedContent } from '../../content/index.js';
import type { ApothecaryPrice } from '../../content/types.js';
import type { ApothecaryRecommendedPackageEntry } from './apothecaryPrepReadModel.js';

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

export function buildApothecaryCityBundle(options: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  purchasedTodayByStockId?: Record<string, number>;
  recommendedPackage: ApothecaryRecommendedPackageEntry[];
}): ApothecaryCityBundle | null {
  const { content, shop, purchasedTodayByStockId = {}, recommendedPackage } = options;
  if (!shop) return null;

  const items: BundleLine[] = [];
  let cost: ApothecaryPrice = {};

  recommendedPackage.forEach((entry) => {
    if (entry.routeIntent.kind !== 'buy' || entry.missingQty <= 0) return;
    const stockEntry = shop.stock.find((stock) => stock.itemId === entry.itemId);
    if (!stockEntry) return;

    const purchased = purchasedTodayByStockId[stockEntry.id] ?? 0;
    const remainingByLimit =
      stockEntry.dailyLimit == null ? entry.missingQty : Math.max(0, stockEntry.dailyLimit - purchased);
    const qty = Math.min(entry.missingQty, remainingByLimit);
    if (qty <= 0) return;

    items.push({
      stockId: stockEntry.id,
      itemId: entry.itemId,
      qty,
      itemName: entry.itemName,
    });
    cost = addPrice(cost, stockEntry.price, qty);
  });

  if (items.length === 0) return null;

  const cityName = formatCityName(content, shop.cityId);
  const bundleLineNames = items.map((item) => item.itemName).join(', ');

  return {
    id: `${shop.id}_daily_readiness_bundle`,
    name: `${cityName} Readiness Bundle`,
    description: `Top back up to today’s reserve floor with ${bundleLineNames}.`,
    cost,
    items,
  };
}
