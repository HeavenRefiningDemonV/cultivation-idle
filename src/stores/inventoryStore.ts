import { create } from 'zustand';
import { castDraft } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { D, add, greaterThanOrEqualTo, subtract } from '../utils/numbers.js';
import { bumpVersion } from './versionCounters.js';
import type { GearInstance } from '../systems/equipment/gearModel.js';

export type CurrencyKey = 'gold' | 'spiritStones' | 'merit';

/** M.III.1 S4 — one salvage line from a dismantle. The amount/material curve is HELD → D15/F-BAL. */
export interface GearDismantleYield {
  readonly materialId: string;
  readonly amount: number;
}
/** The dismantle outcome — the "yield event" shape. While HELD the yield is the empty list (no number authored). */
export interface GearDismantleResult {
  readonly ok: boolean;
  readonly instanceId: string;
  readonly yield: readonly GearDismantleYield[];
}

export type InventoryState = {
  currencies: Record<CurrencyKey, string>;
  items: Record<string, number>;
  /**
   * M.III.1 S1 — the per-instance Vault, ADDITIVE beside the stackable `items` counts. Each rolled
   * GearInstance (its own affixes/upgrade/bond) lives here keyed by instanceId; `items` keeps the
   * stackable consumable/material path untouched. Body-side state (D13) — cleared on reset/prestige.
   */
  gearInstances: Record<string, GearInstance>;
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

  // gear-instance (Vault) actions — the per-instance holdings
  addGearInstance: (instance: GearInstance) => void;
  removeGearInstance: (instanceId: string) => void;
  getGearInstance: (instanceId: string) => GearInstance | undefined;
  /** D-F dismantle: remove the held instance and return the (HELD-empty) salvage yield. */
  dismantleGearInstance: (instanceId: string) => GearDismantleResult;

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
  'currencies' | 'items' | 'gearInstances' | 'gold' | 'spiritStones' | 'merit' | 'inventoryVersion' | 'currencyVersion'
> => ({
  currencies: { ...initialCurrencies },
  items: {},
  gearInstances: {},
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

    addGearInstance: (instance) => {
      if (!instance?.instanceId) return;
      set((state) => {
        state.gearInstances[instance.instanceId] = castDraft(instance);
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
      });
    },

    removeGearInstance: (instanceId) => {
      if (!instanceId || !get().gearInstances[instanceId]) return;
      set((state) => {
        delete state.gearInstances[instanceId];
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
      });
    },

    getGearInstance: (instanceId) => get().gearInstances[instanceId],

    dismantleGearInstance: (instanceId) => {
      const existing = get().gearInstances[instanceId];
      if (!existing) return { ok: false, instanceId, yield: [] };
      set((state) => {
        delete state.gearInstances[instanceId];
        state.inventoryVersion = bumpVersion(state.inventoryVersion);
      });
      // [dismantle yield → D15] credit salvage materials here once the yield curve leaves HELD; the
      // result IS the yield event — empty list while held, never an authored placeholder number.
      return { ok: true, instanceId, yield: [] };
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
        state.gearInstances = {};
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
