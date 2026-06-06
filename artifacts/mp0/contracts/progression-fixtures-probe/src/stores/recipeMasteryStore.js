import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents.js';
const THRESHOLDS = [25, 50, 75, 100];
const clampMastery = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Math.min(100, Math.max(0, Math.floor(value)));
};
const sanitizeRecord = (raw) => {
    if (!raw || typeof raw !== 'object')
        return {};
    const record = raw;
    const next = {};
    Object.entries(record).forEach(([recipeId, value]) => {
        if (typeof recipeId !== 'string')
            return;
        if (typeof value !== 'number')
            return;
        next[recipeId] = clampMastery(value);
    });
    return next;
};
export const useRecipeMasteryStore = create()(immer((set, get) => ({
    alchemy: {},
    gainAlchemyMastery: (recipeId, amount, _reason) => {
        if (!recipeId)
            return;
        void _reason;
        const delta = clampMastery(amount);
        if (delta <= 0)
            return;
        const before = clampMastery(get().alchemy[recipeId] ?? 0);
        const next = clampMastery(before + delta);
        set((state) => {
            state.alchemy[recipeId] = next;
        });
        GameEvents.emit({ type: 'alchemy/mastery_gain', payload: { recipeId, gain: delta, next } });
        THRESHOLDS.filter((threshold) => before < threshold && next >= threshold).forEach((threshold) => {
            GameEvents.emit({ type: 'alchemy/mastery_milestone', payload: { recipeId, milestone: threshold } });
        });
    },
    getAlchemyMastery: (recipeId) => {
        if (!recipeId)
            return 0;
        return clampMastery(get().alchemy[recipeId] ?? 0);
    },
    getAlchemyThresholdInfo: (recipeId) => {
        const mastery = clampMastery(get().alchemy[recipeId] ?? 0);
        const unlocked = THRESHOLDS.filter((threshold) => mastery >= threshold);
        const nextThreshold = THRESHOLDS.find((threshold) => threshold > mastery) ?? null;
        return { mastery, nextThreshold, unlocked };
    },
    hydrate: (slice) => {
        const nextAlchemy = sanitizeRecord(slice?.alchemy);
        set(() => ({ alchemy: nextAlchemy }));
    },
    toSaveState: () => ({
        alchemy: { ...get().alchemy },
    }),
    hardReset: () => set(() => ({ alchemy: {} })),
})));
export const createDefaultRecipeMasteryState = () => ({ alchemy: {} });
