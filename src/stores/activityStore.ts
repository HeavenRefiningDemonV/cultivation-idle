import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ActivityType = 'meditate' | 'outskirts' | 'trial' | 'ruins';

export type ActiveActivity = {
  type: ActivityType;
  cityId?: string;
  sourceId?: string;
  startedAt: number;
};

interface ActivityState {
  /**
   * Single foreground activity gate.
   *
   * Only one "foreground" activity can be active at a time (meditation, outskirts, trials, ruins).
   */
  active: ActiveActivity | null;

  /**
   * Start an activity. Always stops any previous activity first.
   */
  startActivity: (activity: Omit<ActiveActivity, 'startedAt'>) => void;

  /**
   * Stop any active activity.
   */
  stopActivity: () => void;

  /**
   * Convenience check.
   * - If no type passed: returns true if any activity is active.
   * - If type passed: returns true only if that type is active.
   */
  isActive: (type?: ActivityType) => boolean;

  /**
   * Reset to a clean state (used by hard resets / deletes).
   */
  hardResetActivity: () => void;
}

const createInitialActivityState = (): Pick<ActivityState, 'active'> => ({
  active: null,
});

export const useActivityStore = create<ActivityState>()(
  immer((set, get) => ({
    ...createInitialActivityState(),

    startActivity: (activity) => {
      set((state) => {
        // Single foreground rule: always stop any previous activity first.
        state.active = null;

        state.active = {
          ...activity,
          startedAt: Date.now(),
        };
      });
    },

    stopActivity: () => {
      set((state) => {
        state.active = null;
      });
    },

    isActive: (type?: ActivityType) => {
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
