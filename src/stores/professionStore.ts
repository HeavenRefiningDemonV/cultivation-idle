import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { grantRewards } from '../systems/rewards';
import { multiply } from '../utils/numbers';
import { useContentStore } from './contentStore';
import { useInventoryStore, type CurrencyKey } from './inventoryStore';

export type AlchemyJob = {
  id: string;
  recipeId: string;
  qty: number;
  startedAt: number;
  endsAt: number;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

interface ProfessionState {
  alchemyQueue: AlchemyJob[];
  lastTickAt: number;
  startAlchemy: (recipeId: string, qty: number) => ActionResult;
  tick: (now: number) => void;
  claimAlchemy: (jobId: string) => ActionResult;
}

const makeJobId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const MAX_ALCHEMY_QTY = 999;

const currencyLabels: Record<CurrencyKey, string> = {
  gold: 'Gold',
  spiritStones: 'Spirit Stones',
  merit: 'Merit',
};

export const useProfessionStore = create<ProfessionState>()(
  immer((set, get) => ({
    alchemyQueue: [],
    lastTickAt: 0,

    startAlchemy: (recipeId, qty) => {
      const parsedQty = Math.floor(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }
      const amount = Math.min(parsedQty, MAX_ALCHEMY_QTY);

      const contentStore = useContentStore.getState();
      const recipe = contentStore.raw?.alchemy_recipes?.find((entry) => entry.id === recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const durationSec = recipe.timeSec ?? (recipe as { craftTimeSec?: number }).craftTimeSec;
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        return { ok: false, error: 'Invalid recipe time' };
      }

      const inventory = useInventoryStore.getState();
      const inputs = recipe.inputs ?? {};
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const currentQty = inventory.getQty(itemId);
        if (currentQty < requiredQty) {
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Not enough ${itemName}` };
        }
      }

      const costsRaw = (recipe as { costs?: Partial<Record<CurrencyKey, number>> }).costs ?? {};
      const costs: Partial<Record<CurrencyKey, string>> = {};
      (Object.keys(costsRaw) as CurrencyKey[]).forEach((key) => {
        const raw = costsRaw[key];
        if (raw === undefined || raw === null) return;
        try {
          costs[key] = multiply(raw, amount).toString();
        } catch (error) {
          console.warn('[ProfessionStore] Failed to calculate cost', error);
        }
      });

      for (const key of Object.keys(costs) as CurrencyKey[]) {
        const required = costs[key];
        if (!required) continue;
        if (!inventory.canAffordCurrency({ [key]: required })) {
          return { ok: false, error: `Not enough ${currencyLabels[key]}` };
        }
      }

      const removedItems: Array<{ itemId: string; qty: number }> = [];
      for (const [itemId, baseQty] of Object.entries(inputs)) {
        const perJob = Math.floor(baseQty);
        if (!Number.isFinite(perJob) || perJob <= 0) continue;
        const requiredQty = perJob * amount;
        const removed = inventory.removeItem(itemId, requiredQty);
        if (!removed) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          const itemName = contentStore.maps.itemsById[itemId]?.name ?? itemId;
          return { ok: false, error: `Missing ${itemName}` };
        }
        removedItems.push({ itemId, qty: requiredQty });
      }

      if (Object.keys(costs).length > 0) {
        const spent = inventory.spendCurrencies(costs);
        if (!spent) {
          removedItems.forEach((entry) => {
            inventory.addItem(entry.itemId, entry.qty);
          });
          return { ok: false, error: 'Missing currency' };
        }
      }

      const durationMs = durationSec * amount * 1000;
      const now = Date.now();
      const lastJob = get().alchemyQueue.at(-1);
      const startedAt = lastJob ? Math.max(now, lastJob.endsAt) : now;
      const endsAt = startedAt + durationMs;

      set((state) => {
        state.alchemyQueue.push({
          id: makeJobId(),
          recipeId,
          qty: amount,
          startedAt,
          endsAt,
        });
      });

      return { ok: true };
    },

    tick: (now) => {
      const lastTickAt = get().lastTickAt;
      if (now === lastTickAt) return;
      if (now < lastTickAt) {
        set({ lastTickAt: now });
        return;
      }
      set({ lastTickAt: now });
    },

    claimAlchemy: (jobId) => {
      const job = get().alchemyQueue.find((entry) => entry.id === jobId);
      if (!job) {
        return { ok: false, error: 'Job not found' };
      }

      const now = Date.now();
      if (now < job.endsAt) {
        return { ok: false, error: 'Job not ready' };
      }

      const recipe = useContentStore.getState().raw?.alchemy_recipes?.find((entry) => entry.id === job.recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const outputs = recipe.outputs ?? {};
      const items = Object.entries(outputs)
        .map(([itemId, baseQty]) => {
          const perJob = Math.floor(baseQty);
          if (!Number.isFinite(perJob) || perJob <= 0) return null;
          return { itemId, qty: perJob * job.qty };
        })
        .filter((entry): entry is { itemId: string; qty: number } => Boolean(entry));

      if (items.length > 0) {
        grantRewards({ items }, `Alchemy: ${job.recipeId}`);
      }

      set((state) => {
        state.alchemyQueue = state.alchemyQueue.filter((entry) => entry.id !== jobId);
      });

      return { ok: true };
    },
  })),
);
