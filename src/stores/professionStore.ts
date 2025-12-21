import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useContentStore } from './contentStore';

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

export const useProfessionStore = create<ProfessionState>()(
  immer((set, get) => ({
    alchemyQueue: [],
    lastTickAt: 0,

    startAlchemy: (recipeId, qty) => {
      const amount = Math.floor(qty);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'Invalid quantity' };
      }

      const content = useContentStore.getState().raw;
      const recipe = content?.alchemy_recipes?.find((entry) => entry.id === recipeId);
      if (!recipe) {
        return { ok: false, error: 'Recipe not found' };
      }

      const durationSec = recipe.timeSec ?? (recipe as { craftTimeSec?: number }).craftTimeSec;
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        return { ok: false, error: 'Invalid recipe time' };
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

      set((state) => {
        state.alchemyQueue = state.alchemyQueue.filter((entry) => entry.id !== jobId);
      });

      return { ok: true };
    },
  })),
);
