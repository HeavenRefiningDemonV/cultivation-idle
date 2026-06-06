import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { greaterThanOrEqualTo, multiply } from '../utils/numbers.js';
import { getDayKey } from '../utils/dayKey.js';
import { useContentStore } from './contentStore.js';
import { useInventoryStore } from './inventoryStore.js';
import { RewardService } from '../services/rewards/index.js';
import { bumpVersion } from './versionCounters.js';
const currencyLabels = {
    gold: 'Gold',
    spiritStones: 'Spirit Stones',
    merit: 'Merit',
};
function normalizeQty(value) {
    const qty = Math.floor(value ?? 1);
    if (!Number.isFinite(qty) || qty <= 0)
        return 1;
    return qty;
}
function clonePurchasedToday(source) {
    if (!source || typeof source !== 'object')
        return {};
    const copy = {};
    Object.entries(source).forEach(([shopId, entries]) => {
        if (!entries || typeof entries !== 'object')
            return;
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
export const useShopStore = create()(immer((set, get) => ({
    dayKey: getDayKey(),
    purchasedToday: {},
    lastError: null,
    shopVersion: 0,
    ensureDayKeyCurrent: (nowTs = Date.now()) => {
        const current = getDayKey(nowTs);
        if (current !== get().dayKey) {
            set((state) => {
                state.dayKey = current;
                state.purchasedToday = {};
                state.lastError = null;
                state.shopVersion = bumpVersion(state.shopVersion);
            });
        }
        return current;
    },
    getPurchased: (shopId, stockId) => {
        return get().purchasedToday[shopId]?.[stockId] ?? 0;
    },
    getRemainingToday: (shopId, stockId, dailyLimit) => {
        if (dailyLimit === null || dailyLimit === undefined)
            return null;
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
        if (!shop)
            return { ok: false, error: 'Apothecary not found' };
        const stock = shop.stock.find((entry) => entry.id === stockId);
        if (!stock)
            return { ok: false, error: 'Item not found' };
        const limit = stock.dailyLimit;
        if (limit === 0)
            return { ok: false, error: 'Sold out today' };
        if (typeof limit === 'number') {
            const purchased = get().getPurchased(shopId, stockId);
            if (purchased + quantity > limit) {
                return { ok: false, error: 'Daily limit reached' };
            }
        }
        const costs = {};
        ['gold', 'spiritStones', 'merit'].forEach((key) => {
            const unitPrice = stock.price?.[key];
            if (unitPrice === undefined)
                return;
            try {
                costs[key] = multiply(unitPrice, quantity).toString();
            }
            catch (error) {
                console.warn('[ShopStore] Failed to calculate price', error);
            }
        });
        const inventory = useInventoryStore.getState();
        for (const key of Object.keys(costs)) {
            const amount = costs[key];
            if (amount === undefined)
                continue;
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
        const fail = (message) => {
            if (get().lastError !== message) {
                set((state) => {
                    state.lastError = message;
                    state.shopVersion = bumpVersion(state.shopVersion);
                });
            }
            return { ok: false, error: message };
        };
        const shop = useContentStore.getState().maps.apothecariesById?.[shopId];
        if (!shop)
            return fail('Apothecary not found');
        const stock = shop.stock.find((entry) => entry.id === stockId);
        if (!stock)
            return fail('Item not found');
        const limit = stock.dailyLimit;
        if (limit === 0)
            return fail('Sold out today');
        const purchased = get().getPurchased(shopId, stockId);
        if (typeof limit === 'number' && purchased + quantity > limit) {
            return fail('Daily limit reached');
        }
        const costs = {};
        ['gold', 'spiritStones', 'merit'].forEach((key) => {
            const unitPrice = stock.price?.[key];
            if (unitPrice === undefined)
                return;
            try {
                costs[key] = multiply(unitPrice, quantity).toString();
            }
            catch (error) {
                console.warn('[ShopStore] Failed to calculate price', error);
            }
        });
        const inventory = useInventoryStore.getState();
        for (const key of Object.keys(costs)) {
            const amount = costs[key];
            if (amount === undefined)
                continue;
            if (!greaterThanOrEqualTo(inventory.currencies[key] || '0', amount)) {
                return fail(`Not enough ${currencyLabels[key]}`);
            }
        }
        const spent = RewardService.spendCurrency(costs, `shop:${shopId}:${stockId}`);
        if (!spent) {
            return fail('Failed to spend currencies');
        }
        const grantQty = normalizeQty(stock.qty) * quantity;
        const grantResult = RewardService.grantRewards({ items: [{ itemId: stock.itemId, qty: grantQty }] }, `shop:${shopId}:${stockId}`);
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
            state.shopVersion = bumpVersion(state.shopVersion);
        });
        return { ok: true, grantedQty: appliedQty };
    },
    hydrate: (state) => {
        const nextDayKey = state.dayKey || getDayKey();
        const nextPurchased = clonePurchasedToday(state.purchasedToday);
        set((draft) => {
            draft.dayKey = nextDayKey;
            draft.purchasedToday = nextPurchased;
            draft.shopVersion = bumpVersion(draft.shopVersion);
        });
        get().ensureDayKeyCurrent();
    },
    hardResetShop: () => {
        set({ dayKey: getDayKey(), purchasedToday: {}, lastError: null, shopVersion: 0 });
    },
})));
