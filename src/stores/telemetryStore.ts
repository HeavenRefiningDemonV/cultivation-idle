import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameEvent } from '../services/events/GameEvents.js';

export type TelemetryEventEntry = {
  id: string;
  ts: number;
  type: string;
  summary: string;
  payload?: unknown;
};

interface TelemetryState {
  events: TelemetryEventEntry[];
  maxEvents: number;
  addEvent: (entry: Omit<TelemetryEventEntry, 'id'> & { id?: string }) => void;
  clear: () => void;
  setMaxEvents: (n: number) => void;
}

const DEFAULT_MAX_EVENTS = 200;
const MIN_EVENTS = 50;
const MAX_EVENTS = 1000;

const makeId = () => `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const formatGameEventSummary = (event: GameEvent): string => {
  switch (event.type) {
    case 'rewards/granted': {
      const { reason, summary } = event.payload;
      return `${reason}: ${summary}`;
    }
    case 'combat/resolved': {
      const { outcome, enemyId, source } = event.payload;
      return `${outcome ?? 'unknown'} vs ${enemyId ?? 'unknown'} (${source ?? 'n/a'})`;
    }
    case 'activity/changed': {
      const { reason } = event.payload;
      return `Activity changed${reason ? `: ${reason}` : ''}`;
    }
    case 'manuals/purchased': {
      const { manualId, techniqueId } = event.payload;
      return `Manual purchased: manualId=${manualId} tech=${techniqueId ?? 'n/a'}`;
    }
    case 'manuals/studied': {
      const { manualId, progress } = event.payload;
      return `Manual studied: manualId=${manualId} progress=${progress ?? 'n/a'}`;
    }
    case 'techniques/equipped': {
      const { techniqueId, slot, slotType } = event.payload;
      return `Technique equipped: ${techniqueId} slot=${slot ?? 'n/a'} type=${slotType ?? 'n/a'}`;
    }
    case 'heartlaw/selected': {
      const { heartLawId } = event.payload;
      return `Heart Law selected: ${heartLawId ?? 'unknown'}`;
    }
    case 'pavilion/stock_refreshed': {
      const { pavilionId } = event.payload;
      return `Pavilion stock refreshed: pavilionId=${pavilionId ?? 'unknown'}`;
    }
    default:
      return event.type;
  }
};

export const useTelemetryStore = create<TelemetryState>()(
  immer((set) => ({
    events: [],
    maxEvents: DEFAULT_MAX_EVENTS,

    addEvent: (entry) => {
      set((state) => {
        state.events.unshift({
          id: entry.id ?? makeId(),
          ts: entry.ts ?? Date.now(),
          type: entry.type,
          summary: entry.summary,
          payload: entry.payload,
        });

        if (state.events.length > state.maxEvents) {
          state.events.length = state.maxEvents;
        }
      });
    },

    clear: () => {
      set((state) => {
        state.events = [];
      });
    },

    setMaxEvents: (n: number) => {
      set((state) => {
        const clamped = Math.min(Math.max(n, MIN_EVENTS), MAX_EVENTS);
        state.maxEvents = clamped;
        if (state.events.length > clamped) {
          state.events.length = clamped;
        }
      });
    },
  })),
);
