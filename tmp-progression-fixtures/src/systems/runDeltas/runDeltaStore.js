import { create } from 'zustand';
const DEFAULT_MAX_DELTAS = 8;
function normalizeMax(maxDeltas) {
    if (!Number.isFinite(maxDeltas))
        return DEFAULT_MAX_DELTAS;
    return Math.min(10, Math.max(5, Math.floor(maxDeltas)));
}
export const useRunDeltaStore = create()((set) => ({
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
export const selectRunDeltas = (state) => state.deltas;
export function captureRunDeltaSnapshot(limit = useRunDeltaStore.getState().maxDeltas) {
    return useRunDeltaStore.getState().deltas.slice(0, normalizeMax(limit));
}
export function pushRunDelta(delta) {
    useRunDeltaStore.getState().pushDelta(delta);
}
export function clearRunDeltas() {
    useRunDeltaStore.getState().clearDeltas();
}
