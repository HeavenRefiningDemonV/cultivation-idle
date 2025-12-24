import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { greaterThanOrEqualTo, multiply } from '../utils/numbers';
import { getDayKey } from '../utils/dayKey';
import { useContentStore } from './contentStore';
import { useInventoryStore, type CurrencyKey } from './inventoryStore';
import { RewardService } from '../services/rewards';

export type PurchasedToday = Record<string, Record<string, number>>;

export interface ShopState {
  dayKey: string;
  purchasedToday: PurchasedToday;
  lastError: string | null;
  ensureDayKeyCurrent: (nowTs?: number) => string;
  getPurchased: (shopId: string, stockId: string) => number;
  getRemainingToday: (shopId: string, stockId: string, dailyLimit?: number | null) => number | null;
  canBuy: (shopId: string, stockId: string, qty?: number) => { ok: boolean; error?: string };
  buy: (
    shopId: string,
    stockId: string,
    qty?: number,
  ) => { ok: boolean; error?: string; grantedQty?: number };
  hydrate: (state: { dayKey?: string; purchasedToday?: PurchasedToday }) => void;
  hardResetShop: () => void;
}

const currencyLabels: Record<CurrencyKey, string> = {
  gold: 'Gold',
  spiritStones: 'Spirit Stones',
  merit: 'Merit',
};

function normalizeQty(value: number | undefined): number {
  const qty = Math.floor(value ?? 1);
  if (!Number.isFinite(qty) || qty <= 0) return 1;
  return qty;
}

function clonePurchasedToday(source?: PurchasedToday): PurchasedToday {
  if (!source || typeof source !== 'object') return {};
  const copy: PurchasedToday = {};
  Object.entries(source).forEach(([shopId, entries]) => {
    if (!entries || typeof entries !== 'object') return;
    copy[shopId] = {};
    Object.entries(entries).forEach(([stockId, qty]) => {
      const parsed = Math.floor(Number(qty));
      if (!Number.isNaN(parsed) && parsed > 0) {
        copy[shopId][stockId] = parsed;
      }
    });
  });
  return copy;
}

export const useShopStore = create<ShopState>()(
  immer((set, get) => ({
    dayKey: getDayKey(),
    purchasedToday: {},
    lastError: null,

    ensureDayKeyCurrent: (nowTs = Date.now()) => {
      const current = getDayKey(nowTs);
      if (current !== get().dayKey) {
        set({ dayKey: current, purchasedToday: {}, lastError: null });
      }
      return current;
    },

    getPurchased: (shopId, stockId) => {
      return get().purchasedToday[shopId]?.[stockId] ?? 0;
    },

    getRemainingToday: (shopId, stockId, dailyLimit) => {
      if (dailyLimit === null || dailyLimit === undefined) return null;
      const purchased = get().getPurchased(shopId, stockId);
      return Math.max(dailyLimit - purchased, 0);
    },

    canBuy: (shopId, stockId, qty = 1) => {
      const quantity = Math.floor(qty);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }

      get().ensureDayKeyCurrent();

      const shop = useContentStore.getState().maps.apothecariesById?.[shopId];
      if (!shop) return { ok: false, error: 'Apothecary not found' };

      const stock = shop.stock.find((entry) => entry.id === stockId);
      if (!stock) return { ok: false, error: 'Item not found' };

      const limit = stock.dailyLimit;
      if (limit === 0) return { ok: false, error: 'Sold out today' };
      if (typeof limit === 'number') {
        const purchased = get().getPurchased(shopId, stockId);
        if (purchased + quantity > limit) {
          return { ok: false, error: 'Daily limit reached' };
        }
      }

      const costs: Partial<Record<CurrencyKey, string>> = {};
      (['gold', 'spiritStones', 'merit'] as CurrencyKey[]).forEach((key) => {
        const unitPrice = stock.price?.[key];
        if (unitPrice === undefined) return;
        try {
          costs[key] = multiply(unitPrice, quantity).toString();
        } catch (error) {
          console.warn('[ShopStore] Failed to calculate price', error);
        }
      });

      const inventory = useInventoryStore.getState();
      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const amount = costs[key];
        if (amount === undefined) continue;
        if (!greaterThanOrEqualTo(inventory.currencies[key] || '0', amount)) {
          return { ok: false, error: `Not enough ${currencyLabels[key]}` };
        }
      }

      return { ok: true };
    },

    buy: (shopId, stockId, qty = 1) => {
      const quantity = Math.floor(qty);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }

      get().ensureDayKeyCurrent();

      const fail = (message: string) => {
        set({ lastError: message });
        return { ok: false, error: message } as const;
      };

      const shop = useContentStore.getState().maps.apothecariesById?.[shopId];
      if (!shop) return fail('Apothecary not found');

      const stock = shop.stock.find((entry) => entry.id === stockId);
      if (!stock) return fail('Item not found');

      const limit = stock.dailyLimit;
      if (limit === 0) return fail('Sold out today');

      const purchased = get().getPurchased(shopId, stockId);
      if (typeof limit === 'number' && purchased + quantity > limit) {
        return fail('Daily limit reached');
      }

      const costs: Partial<Record<CurrencyKey, string>> = {};
      (['gold', 'spiritStones', 'merit'] as CurrencyKey[]).forEach((key) => {
        const unitPrice = stock.price?.[key];
        if (unitPrice === undefined) return;
        try {
          costs[key] = multiply(unitPrice, quantity).toString();
        } catch (error) {
          console.warn('[ShopStore] Failed to calculate price', error);
        }
      });

      const inventory = useInventoryStore.getState();
      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const amount = costs[key];
        if (amount === undefined) continue;
        if (!greaterThanOrEqualTo(inventory.currencies[key] || '0', amount)) {
          return fail(`Not enough ${currencyLabels[key]}`);
        }
      }

      const spent = RewardService.spendCurrency(costs, `shop:${shopId}:${stockId}`);
      if (!spent) {
        return fail('Failed to spend currencies');
      }

      const grantQty = normalizeQty(stock.qty) * quantity;
      const grantResult = RewardService.grantRewards(
        { items: [{ itemId: stock.itemId, qty: grantQty }] },
        `shop:${shopId}:${stockId}`,
      );

      const appliedQty = grantResult.appliedItems.find((entry) => entry.itemId === stock.itemId)?.qty ?? 0;
      if (appliedQty <= 0) {
        return fail('Failed to grant item');
      }

      set((state) => {
        if (!state.purchasedToday[shopId]) {
          state.purchasedToday[shopId] = {};
        }
        state.purchasedToday[shopId][stockId] = (state.purchasedToday[shopId][stockId] || 0) + quantity;
        state.lastError = null;
      });

      return { ok: true, grantedQty: appliedQty };
    },

    hydrate: (state) => {
      const nextDayKey = state.dayKey || getDayKey();
      const nextPurchased = clonePurchasedToday(state.purchasedToday);
      set({ dayKey: nextDayKey, purchasedToday: nextPurchased });
      get().ensureDayKeyCurrent();
    },

    hardResetShop: () => {
      set({ dayKey: getDayKey(), purchasedToday: {}, lastError: null });
    },
  })),
);
