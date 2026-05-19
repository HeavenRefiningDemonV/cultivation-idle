import { create } from 'zustand';
import type { RunCausalityDelta } from './types.js';

const DEFAULT_MAX_DELTAS = 8;

interface RunDeltaState {
  deltas: RunCausalityDelta[];
  maxDeltas: number;
  pushDelta: (delta: RunCausalityDelta) => void;
  clearDeltas: () => void;
  setMaxDeltas: (maxDeltas: number) => void;
}

function normalizeMax(maxDeltas: number): number {
  if (!Number.isFinite(maxDeltas)) return DEFAULT_MAX_DELTAS;
  return Math.min(10, Math.max(5, Math.floor(maxDeltas)));
}

export const useRunDeltaStore = create<RunDeltaState>()((set) => ({
  deltas: [],
  maxDeltas: DEFAULT_MAX_DELTAS,
  pushDelta: (delta) => {
    set((state) => {
      const existingIndex = state.deltas.findIndex((entry) => entry.id === delta.id);
      const withoutExisting = existingIndex >= 0
        ? state.deltas.filter((entry) => entry.id !== delta.id)
        : state.deltas;
      return {
        deltas: [delta, ...withoutExisting]
          .sort((left, right) => right.timestamp - left.timestamp)
          .slice(0, state.maxDeltas),
      };
    });
  },
  clearDeltas: () => set({ deltas: [] }),
  setMaxDeltas: (maxDeltas) => {
    const normalized = normalizeMax(maxDeltas);
    set((state) => ({
      maxDeltas: normalized,
      deltas: state.deltas.slice(0, normalized),
    }));
  },
}));

export const selectRunDeltas = (state: RunDeltaState): RunCausalityDelta[] => state.deltas;

export function captureRunDeltaSnapshot(limit = useRunDeltaStore.getState().maxDeltas): RunCausalityDelta[] {
  return useRunDeltaStore.getState().deltas.slice(0, normalizeMax(limit));
}

export function pushRunDelta(delta: RunCausalityDelta): void {
  useRunDeltaStore.getState().pushDelta(delta);
}

export function clearRunDeltas(): void {
  useRunDeltaStore.getState().clearDeltas();
}
