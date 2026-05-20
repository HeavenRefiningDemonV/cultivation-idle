import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents.js';
import type {
  ActiveActivity,
  ActivityHistoryEntry,
  ForegroundActivityPayload,
  ForegroundActivityType,
} from '../types/activity.js';

export type { ActiveActivity, ForegroundActivityPayload, ForegroundActivityType } from '../types/activity.js';

interface ActivityState {
  /**
   * Single foreground activity gate.
   *
   * Only one "foreground" activity can be active at a time (meditation, outskirts, trials, ruins).
   */
  active: ActiveActivity | null;

  /**
   * Timestamp of the most recent activity transition.
   */
  lastChangedAt: number | null;

  /**
   * Ring buffer of recent transitions for debugging/analytics.
   */
  history: ActivityHistoryEntry[];

  /**
   * Start an activity. Always stops any previous activity first.
   */
  startActivity: (type: ForegroundActivityType, payload?: ForegroundActivityPayload, reason?: string) => void;

  /**
   * Stop any active activity.
   */
  stopActivity: (reason?: string) => void;

  /**
   * Convenience setter to directly set the active activity.
   */
  setActivity: (type: ForegroundActivityType | null, payload?: ForegroundActivityPayload, reason?: string) => void;

  /**
   * Convenience check.
   * - If no type passed: returns true if any activity is active.
   * - If type passed: returns true only if that type is active.
   */
  isActive: (type?: ForegroundActivityType) => boolean;

  /**
   * Reset to a clean state (used by hard resets / deletes).
   */
  hardResetActivity: () => void;
}

const HISTORY_LIMIT = 25;

const createInitialActivityState = (): Pick<ActivityState, 'active' | 'lastChangedAt' | 'history'> => ({
  active: null,
  lastChangedAt: null,
  history: [],
});

function toActiveActivity(
  type: ForegroundActivityType,
  payload?: ForegroundActivityPayload,
  startedAt: number = Date.now(),
): ActiveActivity {
  const payloadData = payload && Object.keys(payload).length > 0 ? payload : undefined;
  return {
    ...payload,
    type,
    startedAt,
    payload: payloadData,
  };
}

function pushHistory(state: ActivityState, entry: ActivityHistoryEntry) {
  state.history.unshift(entry);
  if (state.history.length > HISTORY_LIMIT) {
    state.history.pop();
  }
}

export const useActivityStore = create<ActivityState>()(
  immer((set, get) => ({
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

    isActive: (type?: ForegroundActivityType) => {
      const active = get().active;
      if (!active) return false;
      if (!type) return true;
      return active.type === type;
    },

    hardResetActivity: () => {
      set(() => ({
        ...createInitialActivityState(),
      }));
    },
  })),
);
