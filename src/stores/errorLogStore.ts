import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type CapturedErrorEntry = {
  id: string;
  ts: number;
  kind: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
  source?: string;
};

interface ErrorLogState {
  errors: CapturedErrorEntry[];
  maxErrors: number;
  addError: (entry: Omit<CapturedErrorEntry, 'id'> & { id?: string }) => void;
  clear: () => void;
  setMaxErrors: (n: number) => void;
}

const DEFAULT_MAX_ERRORS = 50;
const MIN_ERRORS = 20;
const MAX_ERRORS = 500;

const makeId = () => `err_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const useErrorLogStore = create<ErrorLogState>()(
  immer((set) => ({
    errors: [],
    maxErrors: DEFAULT_MAX_ERRORS,

    addError: (entry) => {
      set((state) => {
        state.errors.unshift({
          id: entry.id ?? makeId(),
          ts: entry.ts ?? Date.now(),
          kind: entry.kind,
          message: entry.message,
          stack: entry.stack,
          source: entry.source,
        });

        if (state.errors.length > state.maxErrors) {
          state.errors.length = state.maxErrors;
        }
      });
    },

    clear: () => {
      set((state) => {
        state.errors = [];
      });
    },

    setMaxErrors: (n: number) => {
      set((state) => {
        const clamped = Math.min(Math.max(n, MIN_ERRORS), MAX_ERRORS);
        state.maxErrors = clamped;
        if (state.errors.length > clamped) {
          state.errors.length = clamped;
        }
      });
    },
  })),
);
