import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents';
import { buildInitialStock, refreshStock as generateRefresh } from '../features/manuals/pavilionStockGenerator';
import type { ManualPavilionSaveState, PavilionStockState } from '../features/manuals/pavilionStockTypes';

interface ManualPavilionStoreState extends ManualPavilionSaveState {
  ensureStock: (pavilionId: string, now?: number) => void;
  refreshStock: (pavilionId: string, now?: number) => { ok: boolean; reason?: string };
  getStock: (pavilionId: string) => PavilionStockState | null;
  hydrate: (data: Partial<ManualPavilionSaveState>) => void;
  hardReset: () => void;
}

function cloneState(source?: ManualPavilionSaveState['stockByPavilionId']): ManualPavilionSaveState['stockByPavilionId'] {
  if (!source || typeof source !== 'object') return {};
  const copy: ManualPavilionSaveState['stockByPavilionId'] = {};
  Object.entries(source).forEach(([pavilionId, stock]) => {
    if (!stock || typeof stock !== 'object') return;
    copy[pavilionId] = {
      ...stock,
      slots: Array.isArray(stock.slots) ? stock.slots.map((slot) => ({ ...slot })) : [],
      pity: { ...(stock.pity ?? { featuredEpic: 0, featuredLegendary: 0 }) },
      history: Array.isArray(stock.history) ? stock.history.map((entry) => ({ ...entry })) : [],
    } as PavilionStockState;
  });
  return copy;
}

export const useManualPavilionStore = create<ManualPavilionStoreState>()(
  immer((set, get) => ({
    stockByPavilionId: {},

    ensureStock: (pavilionId: string, now = Date.now()) => {
      if (get().stockByPavilionId[pavilionId]) return;
      const stock = buildInitialStock(pavilionId, now);
      set((state) => {
        state.stockByPavilionId[pavilionId] = stock;
      });
    },

    refreshStock: (pavilionId: string, now = Date.now()) => {
      const existing = get().stockByPavilionId[pavilionId];
      if (!existing) {
        get().ensureStock(pavilionId, now);
        return { ok: true };
      }
      if (now < existing.nextRefreshAt) {
        return { ok: false, reason: 'not_ready' };
      }
      const refreshed = generateRefresh(existing, now);
      set((state) => {
        state.stockByPavilionId[pavilionId] = refreshed;
      });
      GameEvents.emit({
        type: 'pavilion/stock_refreshed',
        payload: { pavilionId, cityId: refreshed.cityId, cityIndex: refreshed.cityIndex, at: now },
      });
      return { ok: true };
    },

    getStock: (pavilionId: string) => get().stockByPavilionId[pavilionId] ?? null,

    hydrate: (data) => {
      if (!data || typeof data !== 'object') return;
      const cloned = cloneState(data.stockByPavilionId);
      set((state) => {
        state.stockByPavilionId = cloned;
      });
    },

    hardReset: () => {
      set({ stockByPavilionId: {} });
    },
  })),
);
