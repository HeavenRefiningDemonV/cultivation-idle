import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ApothecaryShopDef, ApothecaryStock } from '../content';
import { useContentStore } from './contentStore';
import { type CurrencyKey, useInventoryStore } from './inventoryStore';
import { getDayKey } from '../utils/dayKey';
import { D, greaterThanOrEqualTo } from '../utils/numbers';

const CURRENCY_LABELS: Record<CurrencyKey, string> = {
  gold: 'Gold',
  spiritStones: 'Spirit Stones',
  merit: 'Merit',
};

const SPEND_ORDER: CurrencyKey[] = ['gold', 'spiritStones', 'merit'];

type PurchasedTodayMap = Record<string, Record<string, number>>;

type PurchaseCheck =
  | { ok: true; shop: ApothecaryShopDef; stock: ApothecaryStock; totalPrice: Partial<Record<CurrencyKey, string>>; itemQty: number }
  | { ok: false; error: string };

type BuyResult = { ok: true; purchasedQty: number; itemQty: number } | { ok: false; error: string };

type ShopStoreState = {
  dayKey: string;
  purchasedToday: PurchasedTodayMap;
  lastError: string | null;

  ensureDayKeyCurrent: (nowTs?: number) => string;
  getPurchased: (shopId: string, stockId: string) => number;
  getRemainingToday: (shopId: string, stockId: string, dailyLimit?: number | null) => number | null;
  canBuy: (shopId: string, stockId: string, qty?: number) => { ok: boolean; error?: string };
  buy: (shopId: string, stockId: string, qty?: number) => BuyResult;
  hydrate: (data: Partial<Pick<ShopStoreState, 'dayKey' | 'purchasedToday'>>) => void;
  hardReset: () => void;
  evaluatePurchase: (shopId: string, stockId: string, qty: number) => PurchaseCheck;
};

function sanitizeQty(qty: number | undefined): number | null {
  if (qty === undefined) return 1;
  const normalized = Math.floor(qty);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return normalized;
}

function computeTotalPrice(stock: ApothecaryStock, qty: number): Partial<Record<CurrencyKey, string>> {
  const total: Partial<Record<CurrencyKey, string>> = {};

  SPEND_ORDER.forEach((key) => {
    const value = stock.price?.[key];
    if (value === undefined) return;
    try {
      const cost = D(value).times(qty);
      if (cost.lessThanOrEqualTo(0)) return;
      total[key] = cost.toString();
    } catch {
      // If value cannot be parsed, skip to avoid breaking purchase logic
    }
  });

  return total;
}

function affordabilityError(
  totalPrice: Partial<Record<CurrencyKey, string>>,
  inventory: ReturnType<typeof useInventoryStore.getState>,
): string | null {
  for (const key of SPEND_ORDER) {
    const cost = totalPrice[key];
    if (cost === undefined) continue;
    if (!greaterThanOrEqualTo(inventory.currencies[key] || '0', cost)) {
      return `Not enough ${CURRENCY_LABELS[key]}`;
    }
  }
  return null;
}

export const useShopStore = create<ShopStoreState>()(
  immer((set, get) => ({
    dayKey: getDayKey(),
    purchasedToday: {},
    lastError: null,

    ensureDayKeyCurrent: (nowTs) => {
      const current = getDayKey(nowTs);
      if (current !== get().dayKey) {
        set({ dayKey: current, purchasedToday: {} });
      }
      return current;
    },

    getPurchased: (shopId, stockId) => {
      return get().purchasedToday[shopId]?.[stockId] ?? 0;
    },

    getRemainingToday: (shopId, stockId, dailyLimit) => {
      if (dailyLimit === undefined || dailyLimit === null) return null;
      const purchased = get().getPurchased(shopId, stockId);
      return Math.max(dailyLimit - purchased, 0);
    },

    canBuy: (shopId, stockId, qty = 1) => {
      const qtyInt = sanitizeQty(qty);
      if (qtyInt === null) {
        return { ok: false, error: 'Invalid quantity' };
      }

      const check = get().evaluatePurchase(shopId, stockId, qtyInt);
      if (!check.ok) return check;

      const inventory = useInventoryStore.getState();
      const error = affordabilityError(check.totalPrice, inventory);
      if (error) return { ok: false, error };

      return { ok: true };
    },

    buy: (shopId, stockId, qty = 1) => {
      const qtyInt = sanitizeQty(qty);
      if (qtyInt === null) {
        set({ lastError: 'Invalid quantity' });
        return { ok: false, error: 'Invalid quantity' };
      }

      const evaluation = get().evaluatePurchase(shopId, stockId, qtyInt);
      if (!evaluation.ok) {
        set({ lastError: evaluation.error });
        return { ok: false, error: evaluation.error };
      }

      const inventory = useInventoryStore.getState();
      const error = affordabilityError(evaluation.totalPrice, inventory);
      if (error) {
        set({ lastError: error });
        return { ok: false, error };
      }

      const spent = inventory.spendCurrencies(evaluation.totalPrice);
      if (!spent) {
        const failMsg = 'Failed to spend currency';
        set({ lastError: failMsg });
        return { ok: false, error: failMsg };
      }

      const added = inventory.addItem(evaluation.stock.itemId, evaluation.itemQty);
      if (!added) {
        const failMsg = 'Failed to add item to inventory';
        set({ lastError: failMsg });
        return { ok: false, error: failMsg };
      }

      set((state) => {
        if (!state.purchasedToday[shopId]) {
          state.purchasedToday[shopId] = {};
        }
        state.purchasedToday[shopId][stockId] =
          (state.purchasedToday[shopId][stockId] ?? 0) + qtyInt;
        state.lastError = null;
      });

      return { ok: true, purchasedQty: qtyInt, itemQty: evaluation.itemQty };
    },

    hydrate: (data) => {
      set((state) => {
        state.dayKey = data.dayKey || getDayKey();
        state.purchasedToday = data.purchasedToday || {};
      });
      get().ensureDayKeyCurrent();
    },

    hardReset: () => {
      set({ dayKey: getDayKey(), purchasedToday: {}, lastError: null });
    },

    evaluatePurchase: (shopId: string, stockId: string, qty: number): PurchaseCheck => {
      get().ensureDayKeyCurrent();

      let shop: ApothecaryShopDef | undefined;
      try {
        shop = useContentStore.getState().getApothecaryShop(shopId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown shop error';
        return { ok: false, error: message };
      }

      if (!shop) {
        return { ok: false, error: `Apothecary not found (${shopId})` };
      }

      const stock = shop.stock.find((entry) => entry.id === stockId);
      if (!stock) {
        return { ok: false, error: 'Item not found in this shop' };
      }

      if (stock.dailyLimit === 0) {
        return { ok: false, error: 'Sold out today' };
      }

      const purchased = get().getPurchased(shopId, stockId);
      if (typeof stock.dailyLimit === 'number' && purchased + qty > stock.dailyLimit) {
        return { ok: false, error: 'Daily limit reached' };
      }

      const totalPrice = computeTotalPrice(stock, qty);
      const itemQty = (stock.qty ?? 1) * qty;

      return { ok: true, shop, stock, totalPrice, itemQty };
    },
  }))
);
