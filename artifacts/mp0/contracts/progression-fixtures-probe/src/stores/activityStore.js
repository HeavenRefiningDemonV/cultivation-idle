import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents.js';
const HISTORY_LIMIT = 25;
const createInitialActivityState = () => ({
    active: null,
    lastChangedAt: null,
    history: [],
});
function toActiveActivity(type, payload, startedAt = Date.now()) {
    const payloadData = payload && Object.keys(payload).length > 0 ? payload : undefined;
    return {
        ...payload,
        type,
        startedAt,
        payload: payloadData,
    };
}
function pushHistory(state, entry) {
    state.history.unshift(entry);
    if (state.history.length > HISTORY_LIMIT) {
        state.history.pop();
    }
}
export const useActivityStore = create()(immer((set, get) => ({
    ...createInitialActivityState(),
    startActivity: (type, payload, reason = 'start') => {
        const previous = get().active;
        const now = Date.now();
        const next = toActiveActivity(type, payload, now);
        set((state) => {
            state.active = next;
            state.lastChangedAt = now;
            pushHistory(state, { previous, next, changedAt: now, reason });
        });
        GameEvents.emit({
            type: 'activity/changed',
            payload: { previous, next, reason, changedAt: now },
        });
    },
    stopActivity: (reason = 'stop') => {
        const previous = get().active;
        if (!previous) {
            return;
        }
        const now = Date.now();
        set((state) => {
            state.active = null;
            state.lastChangedAt = now;
            pushHistory(state, { previous, next: null, changedAt: now, reason });
        });
        GameEvents.emit({
            type: 'activity/changed',
            payload: { previous, next: null, reason, changedAt: now },
        });
    },
    setActivity: (type, payload, reason) => {
        if (!type) {
            get().stopActivity(reason ?? 'clear');
            return;
        }
        get().startActivity(type, payload, reason);
    },
    isActive: (type) => {
        const active = get().active;
        if (!active)
            return false;
        if (!type)
            return true;
        return active.type === type;
    },
    hardResetActivity: () => {
        set(() => ({
            ...createInitialActivityState(),
        }));
    },
})));
