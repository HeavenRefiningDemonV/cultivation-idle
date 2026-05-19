import type { ApothecaryShopDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/index.js';
import { greaterThanOrEqualTo } from '../../utils/numbers.js';
import type { CurrencyKey } from '../../stores/inventoryStore.js';
import { buildApothecaryCityBundle, type ApothecaryCityBundle } from './apothecaryBundles.js';
import { getApothecaryBundleCatalogEntry } from './apothecaryBundleCatalog.js';
import { evaluateGatePrepPackageCoverage, type GatePrepPackageCoverage } from './apothecaryPackageCoverage.js';
import { getGatePrepPackageForCity } from './gatePrepPackageCatalog.js';
import { APOTHECARY_STOCK_FLOORS, type ApothecaryStockFloorKey } from './apothecaryStockFloors.js';

export interface ApothecaryBuyFloorStatus {
  key: ApothecaryStockFloorKey;
  label: string;
  itemId: string | null;
  itemName: string;
  ownedQty: number;
  targetQty: number;
  met: boolean;
}

export interface ApothecaryBundleSurfaceState {
  bundle: ApothecaryCityBundle | null;
  buyableNow: boolean;
  remainingPurchasesToday: number;
  disableReason: string | null;
}

export interface ApothecaryBuyReadModel {
  cityId: string | null;
  cityName: string;
  bundleState: ApothecaryBundleSurfaceState;
  floorStatuses: ApothecaryBuyFloorStatus[];
  biggestShortfallKey: ApothecaryStockFloorKey | null;
  bundleImprovesBiggestShortfall: boolean;
  packageCoverage: GatePrepPackageCoverage | null;
}

function formatItemName(content: ValidatedContent | null, itemId: string | null) {
  if (!itemId) return 'Unavailable';
  return content?.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function pickFloorItemId(shop: ApothecaryShopDef | null, key: ApothecaryStockFloorKey) {
  const stockIds = (shop?.stock ?? []).map((entry) => entry.itemId);
  if (key === 'healing') return stockIds.find((itemId) => itemId.includes('healing')) ?? null;
  if (key === 'cultivation') {
    return (
      stockIds.find((itemId) => itemId.includes('qi_elixir') || itemId.includes('quiet_breath') || itemId.includes('meridian')) ??
      null
    );
  }
  return stockIds.find((itemId) => !itemId.includes('healing')) ?? null;
}

function buildFloorStatuses(content: ValidatedContent | null, shop: ApothecaryShopDef | null, inventoryItems: Record<string, number>) {
  return (Object.keys(APOTHECARY_STOCK_FLOORS) as ApothecaryStockFloorKey[]).map((key) => {
    const floor = APOTHECARY_STOCK_FLOORS[key];
    const itemId = pickFloorItemId(shop, key);
    const ownedQty = itemId ? inventoryItems[itemId] ?? 0 : 0;
    return {
      key,
      label: floor.label,
      itemId,
      itemName: formatItemName(content, itemId),
      ownedQty,
      targetQty: floor.targetQty,
      met: ownedQty >= floor.targetQty,
    };
  });
}

function getBundleDisableReason(options: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  bundle: ApothecaryCityBundle | null;
  inventoryItems: Record<string, number>;
  purchasedTodayByStockId: Record<string, number>;
  currencies: Partial<Record<CurrencyKey, string>>;
}) {
  const { shop, bundle, inventoryItems, purchasedTodayByStockId, currencies } = options;
  if (!shop) return 'No bundle in this city.';

  const catalogEntry = getApothecaryBundleCatalogEntry(shop);
  if (!catalogEntry) return 'No bundle in this city.';

  for (const line of catalogEntry.lines) {
    const stockEntry = shop.stock.find((entry) => entry.itemId === line.itemId);
    if (!stockEntry) return 'City bundle unavailable.';
    const missingQty = Math.max(0, line.targetQty - (inventoryItems[line.itemId] ?? 0));
    if (missingQty <= 0 || stockEntry.dailyLimit == null) continue;
    const remaining = Math.max(0, stockEntry.dailyLimit - (purchasedTodayByStockId[stockEntry.id] ?? 0));
    if (remaining <= 0 || remaining < missingQty) {
      return 'Daily specialty stock exhausted.';
    }
  }

  if (!bundle) return 'City bundle unavailable.';

  const cost = bundle.cost ?? {};
  for (const key of Object.keys(cost) as CurrencyKey[]) {
    const needed = cost[key];
    if (needed && !greaterThanOrEqualTo(currencies[key] ?? '0', needed)) {
      return `Not enough ${key === 'gold' ? 'gold' : key}.`;
    }
  }

  return null;
}

function getBundleRemainingPurchasesToday(
  shop: ApothecaryShopDef | null,
  bundle: ApothecaryCityBundle | null,
  inventoryItems: Record<string, number>,
  purchasedTodayByStockId: Record<string, number>,
) {
  if (!shop) return 0;
  const catalogEntry = getApothecaryBundleCatalogEntry(shop);
  if (!catalogEntry || !bundle) return 0;
  const limitedCaps = catalogEntry.lines
    .map((line) => {
      const stockEntry = shop.stock.find((entry) => entry.itemId === line.itemId);
      if (!stockEntry) return 0;
      const missingQty = Math.max(0, line.targetQty - (inventoryItems[line.itemId] ?? 0));
      if (missingQty <= 0) return null;
      if (stockEntry.dailyLimit == null) return null;
      const remaining = Math.max(0, stockEntry.dailyLimit - (purchasedTodayByStockId[stockEntry.id] ?? 0));
      return Math.floor(remaining / Math.max(1, missingQty));
    })
    .filter((value): value is number => value != null);

  if (limitedCaps.some((value) => value <= 0)) return 0;
  if (limitedCaps.length === 0) return bundle.items.length > 0 ? 99 : 0;
  return Math.max(0, Math.min(...limitedCaps));
}

export function buildApothecaryBuyReadModel(input: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  inventoryItems: Record<string, number>;
  currencies: Partial<Record<CurrencyKey, string>>;
  purchasedTodayByStockId?: Record<string, number>;
}): ApothecaryBuyReadModel {
  const { content, shop, inventoryItems, currencies, purchasedTodayByStockId = {} } = input;
  const cityName = content?.cities.find((city) => city.id === shop?.cityId)?.name ?? 'This city';
  const bundle = buildApothecaryCityBundle({
    content,
    shop,
    inventoryItems,
    purchasedTodayByStockId,
  });
  const floorStatuses = buildFloorStatuses(content, shop, inventoryItems);
  const biggestShortfall = [...floorStatuses]
    .map((floor) => ({ key: floor.key, shortfall: Math.max(0, floor.targetQty - floor.ownedQty), itemId: floor.itemId }))
    .sort((a, b) => b.shortfall - a.shortfall)[0];
  const biggestShortfallKey = biggestShortfall && biggestShortfall.shortfall > 0 ? biggestShortfall.key : null;
  const bundleImprovesBiggestShortfall = Boolean(
    biggestShortfallKey && bundle?.items.some((item) => item.itemId === biggestShortfall.itemId),
  );
  const disableReason = getBundleDisableReason({
    content,
    shop,
    bundle,
    inventoryItems,
    purchasedTodayByStockId,
    currencies,
  });
  const remainingPurchasesToday = getBundleRemainingPurchasesToday(shop, bundle, inventoryItems, purchasedTodayByStockId);
  const packageDef = getGatePrepPackageForCity(shop?.cityId);
  const packageCoverage = evaluateGatePrepPackageCoverage({ content, shop, bundle, packageDef });

  return {
    cityId: shop?.cityId ?? null,
    cityName,
    bundleState: {
      bundle,
      buyableNow: Boolean(bundle) && !disableReason,
      remainingPurchasesToday,
      disableReason,
    },
    floorStatuses,
    biggestShortfallKey,
    bundleImprovesBiggestShortfall,
    packageCoverage,
  };
}
