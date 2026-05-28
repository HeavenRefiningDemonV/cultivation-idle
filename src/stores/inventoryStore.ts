import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { D, add, greaterThanOrEqualTo, subtract } from '../utils/numbers.js';
import { bumpVersion } from './versionCounters.js';

export type CurrencyKey = 'gold' | 'spiritStones' | 'merit';

export type InventoryState = {
  currencies: Record<CurrencyKey, string>;
  items: Record<string, number>;
  gold: string;
  spiritStones: string;
  merit: string;
  inventoryVersion: number;
  currencyVersion: number;

  // currency actions
  addCurrency: (key: CurrencyKey, amount: string) => void;
  spendCurrency: (key: CurrencyKey, amount: string) => boolean;
  canAffordCurrency: (costs: Partial<Record<CurrencyKey, string>>) => boolean;
  spendCurrencies: (costs: Partial<Record<CurrencyKey, string>>) => boolean;

  // item actions
  addItem: (itemId: string, qty: number) => boolean;
  removeItem: (itemId: string, qty: number) => boolean;
  getQty: (itemId: string) => number;

  // item affordability helpers
  canAffordItem: (itemId: string, qty: number) => boolean;
  spendItem: (itemId: string, qty: number) => boolean;

  // compatibility helpers
  addGold: (amount: string) => void;
  addSpiritStones: (amount: string) => void;
  addMerit: (amount: string) => void;
  getItemCount: (itemId: string) => number;

  // reset helpers
  resetInventory: () => void;
  hardResetInventory: () => void;
};

const initialCurrencies: Record<CurrencyKey, string> = {
  gold: '0',
  spiritStones: '0',
  merit: '0',
};

const createInitialState = (): Pick<
  InventoryState,
  'currencies' | 'items' | 'gold' | 'spiritStones' | 'merit' | 'inventoryVersion' | 'currencyVersion'
> => ({
  currencies: { ...initialCurrencies },
  items: {},
  gold: '0',
  spiritStones: '0',
  merit: '0',
  inventoryVersion: 0,
  currencyVersion: 0,
});

function sanitizeAmount(amount: string): string | null {
  if (typeof amount !== 'string') return null;
  const trimmed = amount.trim();
  if (!trimmed) return null;
  try {
    const value = D(trimmed);
    if (!value.isFinite() || value.isNegative()) return null;
    return value.toString();
  } catch (error) {
    console.warn('[Inventory] Invalid currency amount', amount, error);
    return null;
  }
}

function syncCurrencyFields(state: InventoryState) {
  state.gold = state.currencies.gold;
  state.spiritStones = state.currencies.spiritStones;
  state.merit = state.currencies.merit;
}

export const useInventoryStore = create<InventoryState>()(
  immer((set, get) => ({
    ...createInitialState(),

    addCurrency: (key, amount) => {
      const sanitized = sanitizeAmount(amount);
      if (sanitized === null) return;
      if (D(sanitized).isZero()) return;

      set((state) => {
        const next = add(state.currencies[key] || '0', sanitized).toString();
        if (next === state.currencies[key]) return;
        state.currencies[key] = next;
        state.currencyVersion = bumpVersion(state.currencyVersion);
        syncCurrencyFields(state);
      });
    },

    spendCurrency: (key, amount) => {
      const sanitized = sanitizeAmount(amount);
      if (sanitized === null) return false;
      if (D(sanitized).isZero()) return true;

      const current = get().currencies[key] || '0';
      if (!greaterThanOrEqualTo(current, sanitized)) return false;

      set((state) => {
        const next = subtract(state.currencies[key] || '0', sanitized).toString();
        if (next === state.currencies[key]) return;
        state.currencies[key] = next;
        state.currencyVersion = bumpVersion(state.currencyVersion);
        syncCurrencyFields(state);
      });

      return true;
    },

    canAffordCurrency: (costs) => {
      if (!costs) return true;
      return (Object.keys(costs) as CurrencyKey[]).every((key) => {
        const raw = costs[key];
        if (raw === undefined) return true;
        const sanitized = sanitizeAmount(raw);
        if (sanitized === null) return true;
        return greaterThanOrEqualTo(get().currencies[key] || '0', sanitized);
      });
    },

    spendCurrencies: (costs) => {
      if (!costs) return true;
      if (!get().canAffordCurrency(costs)) return false;
      const entries = (Object.keys(costs) as CurrencyKey[])
        .map((key) => {
          const raw = costs[key];
          const sanitized = raw === undefined ? null : sanitizeAmount(raw);
          return sanitized && !D(sanitized).isZero() ? { key, amount: sanitized } : null;
        })
        .filter((entry): entry is { key: CurrencyKey; amount: string } => entry !== null);

      if (entries.length === 0) return true;

      set((state) => {
        let changed = false;
        entries.forEach(({ key, amount }) => {
          const next = subtract(state.currencies[key] || '0', amount).toString();
          if (next === state.currencies[key]) return;
          state.currencies[key] = next;
          changed = true;
        });
        if (changed) {
          state.currencyVersion = bumpVersion(state.currencyVersion);
          syncCurrencyFields(state);
        }
      });

      return true;
    },

    addItem: (itemId, qty) => {
      if (!itemId) return false;
      const amount = Math.floor(qty);
      if (Number.isNaN(amount) || amount <= 0) return false;

      set((state) => {
        const current = state.items[itemId] || 0;
        const next = current + amount;
        state.items[itemId] = next;
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
      });

      return true;
    },

    removeItem: (itemId, qty) => {
      if (!itemId) return false;
      const amount = Math.floor(qty);
      if (Number.isNaN(amount) || amount <= 0) return false;

      const current = get().items[itemId] || 0;
      if (current < amount) return false;

      set((state) => {
        const next = current - amount;
        if (next <= 0) {
          delete state.items[itemId];
        } else {
          state.items[itemId] = next;
        }
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
      });

      return true;
    },

    getQty: (itemId) => {
      return get().items[itemId] || 0;
    },

    canAffordItem: (itemId, qty) => {
      if (!itemId) return false;
      const amount = Math.floor(qty);
      if (Number.isNaN(amount) || amount <= 0) return false;
      return get().getQty(itemId) >= amount;
    },

    spendItem: (itemId, qty) => {
      if (!itemId) return false;
      const amount = Math.floor(qty);
      if (Number.isNaN(amount) || amount <= 0) return false;
      const current = get().getQty(itemId);
      if (current < amount) return false;
      return get().removeItem(itemId, amount);
    },

    // compatibility wrappers
    addGold: (amount) => get().addCurrency('gold', amount),
    addSpiritStones: (amount) => get().addCurrency('spiritStones', amount),
    addMerit: (amount) => get().addCurrency('merit', amount),
    getItemCount: (itemId) => get().getQty(itemId),

    resetInventory: () => {
      set((state) => {
        state.currencies = { ...initialCurrencies };
        state.items = {};
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
        state.currencyVersion = bumpVersion(state.currencyVersion);
        syncCurrencyFields(state);
      });
    },

    hardResetInventory: () => {
      set(() => ({ ...createInitialState() }));
    },
  })),
);

export function getInventoryCurrency(key: CurrencyKey): string {
  return useInventoryStore.getState().currencies[key] || '0';
}
