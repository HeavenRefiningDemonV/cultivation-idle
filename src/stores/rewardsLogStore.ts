import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameEvents } from '../services/events/GameEvents';

export type RewardsLogEntry = {
  id: string;
  timestamp: number;
  reason: string;
  summary: string;
};

interface RewardsLogState {
  entries: RewardsLogEntry[];
  addEntry: (entry: Omit<RewardsLogEntry, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  clear: () => void;
}

const MAX_ENTRIES = 50;

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const useRewardsLogStore = create<RewardsLogState>()(
  immer((set) => ({
    entries: [],

    addEntry: (entry) => {
      set((state) => {
        state.entries.unshift({
          id: makeId(),
          timestamp: entry.timestamp ?? Date.now(),
          reason: entry.reason,
          summary: entry.summary,
        });

        if (state.entries.length > MAX_ENTRIES) {
          state.entries.length = MAX_ENTRIES;
        }
      });
    },

    clear: () => {
      set((state) => {
        state.entries = [];
      });
    },
  })),
);

GameEvents.on('rewards/granted', (event) => {
  const { reason, summary, timestamp } = event.payload;
  useRewardsLogStore.getState().addEntry({
    reason,
    summary,
    timestamp,
  });
});
