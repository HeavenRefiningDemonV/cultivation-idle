import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameEvent } from '../services/events/GameEvents.js';
import type { BalanceTelemetryEvent } from '../services/diagnostics/balanceTelemetrySchema.js';

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
  balanceEvents: BalanceTelemetryEventEntry[];
  maxBalanceEvents: number;
  balanceCaptureEnabled: boolean;
  addEvent: (entry: Omit<TelemetryEventEntry, 'id'> & { id?: string }) => void;
  addBalanceEvent: (entry: Omit<BalanceTelemetryEventEntry, 'id'> & { id?: string }) => void;
  clear: () => void;
  clearBalanceEvents: () => void;
  setMaxEvents: (n: number) => void;
  setMaxBalanceEvents: (n: number) => void;
  setBalanceCaptureEnabled: (enabled: boolean) => void;
}

const DEFAULT_MAX_EVENTS = 200;
const DEFAULT_MAX_BALANCE_EVENTS = 5000;
const MIN_EVENTS = 50;
const MAX_EVENTS = 1000;
const MIN_BALANCE_EVENTS = 100;
const MAX_BALANCE_EVENTS = 20000;

const makeId = () => `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const formatElapsed = (elapsedMs: number | null | undefined): string => {
  const totalSeconds = Math.max(0, Math.floor((elapsedMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

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
    case 'progression/life_started': {
      const { lifeOrdinal, sessionKind } = event.payload;
      return `Life started (#${lifeOrdinal ?? '?'} ${sessionKind ?? 'unknown'})`;
    }
    case 'progression/gate_available': {
      const { gateIndex, elapsedMsSinceLifeStart } = event.payload;
      return `Gate ${gateIndex} available @ ${formatElapsed(elapsedMsSinceLifeStart)}`;
    }
    case 'progression/gate_resolved': {
      const { gateIndex, resolution, elapsedMsSinceLifeStart } = event.payload;
      return `Gate ${gateIndex} ${resolution} @ ${formatElapsed(elapsedMsSinceLifeStart)}`;
    }
    case 'progression/breakthrough': {
      const { toRealmId, major, elapsedMsSinceLifeStart } = event.payload;
      return `${major ? 'Major' : 'Substage'} breakthrough -> ${toRealmId} @ ${formatElapsed(elapsedMsSinceLifeStart)}`;
    }
    case 'progression/city_entered': {
      const { cityId, elapsedMsSinceLifeStart } = event.payload;
      return `City entered: ${cityId} @ ${formatElapsed(elapsedMsSinceLifeStart)}`;
    }
    case 'progression/content_cap_reached': {
      const { realmId, elapsedMsSinceLifeStart } = event.payload;
      return `Content cap reached: ${realmId} @ ${formatElapsed(elapsedMsSinceLifeStart)}`;
    }
    case 'trials/attempt_started': {
      const { gateIndex, lifecycleState } = event.payload;
      return `Trial started: Gate ${gateIndex} / ${lifecycleState}`;
    }
    case 'trials/attempt_resolved': {
      const { gateIndex, outcome, bossHpPctRemaining } = event.payload;
      if (outcome === 'defeated') return `Trial defeat: Gate ${gateIndex} / boss ${Math.round((bossHpPctRemaining ?? 0) * 100)}%`;
      return `Trial ${outcome}: Gate ${gateIndex}`;
    }
    case 'expeditions/claimed': {
      const { expeditionTypeId, durationId, cityId } = event.payload;
      return `Expedition claimed: ${expeditionTypeId} / ${durationId} / ${cityId}`;
    }
    case 'prestige/performed': {
      return `Prestige performed: +${event.payload.apGained} AP`;
    }
    case 'training/started':
      return `Training started: ${event.payload.regimenId} / ${event.payload.intensity}`;
    case 'training/grade_changed':
      return `Training grade: ${event.payload.statId} ${event.payload.oldGrade}->${event.payload.newGrade}`;
    case 'training/cap_hit':
      return `Training cap hit: ${event.payload.statId} ${event.payload.rating}`;
    case 'training/offline_applied':
      return `Offline Training: ${Math.floor(event.payload.appliedMs / 60000)}m`;
    case 'dao_heart/started':
      return `Dao Heart started: ${event.payload.activityId}`;
    case 'dao_heart/level_changed':
      return `Heart Law level: ${event.payload.lawId} ${event.payload.oldLevel}->${event.payload.newLevel}`;
    case 'dao_heart/offline_applied':
      return `Offline Dao Heart: ${Math.floor(event.payload.appliedMs / 60000)}m`;
    case 'breakthrough/attempted':
      return `Breakthrough attempted: ${event.payload.fromRealm} / ${event.payload.result}`;
    case 'gate/attempted':
      return `Gate attempted: ${event.payload.trialId} / ${event.payload.result}`;
    case 'prestige/started':
      return `Prestige started: realm ${event.payload.realm}`;
    case 'prestige/memory_applied':
      return `Prestige memory applied: ${event.payload.effectId}`;
    case 'prestige/reset_bucket_applied':
      return `Prestige reset bucket: ${event.payload.bucketId}`;
    case 'offline/applied': {
      const { rawOfflineSeconds, qiGained, queuedActionsReady, expeditionsReady } = event.payload;
      return `Offline applied: ${Math.floor(rawOfflineSeconds / 3600)}h / Qi + ${qiGained} + ${queuedActionsReady} queues + ${expeditionsReady} expedition`;
    }
    default:
      return event.type;
  }
};

export type BalanceTelemetryEventEntry = {
  id: string;
  ts: number;
  kind: BalanceTelemetryEvent['kind'];
  summary: string;
  payload: BalanceTelemetryEvent;
};

export const useTelemetryStore = create<TelemetryState>()(
  immer((set) => ({
    events: [],
    maxEvents: DEFAULT_MAX_EVENTS,
    balanceEvents: [],
    maxBalanceEvents: DEFAULT_MAX_BALANCE_EVENTS,
    balanceCaptureEnabled: true,

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
    addBalanceEvent: (entry) => {
      set((state) => {
        if (!state.balanceCaptureEnabled) return;
        state.balanceEvents.unshift({
          id: entry.id ?? makeId(),
          ts: entry.ts ?? Date.now(),
          kind: entry.kind,
          summary: entry.summary,
          payload: entry.payload,
        });
        if (state.balanceEvents.length > state.maxBalanceEvents) {
          state.balanceEvents.length = state.maxBalanceEvents;
        }
      });
    },
    clearBalanceEvents: () => {
      set((state) => {
        state.balanceEvents = [];
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
    setMaxBalanceEvents: (n: number) => {
      set((state) => {
        const clamped = Math.min(Math.max(n, MIN_BALANCE_EVENTS), MAX_BALANCE_EVENTS);
        state.maxBalanceEvents = clamped;
        if (state.balanceEvents.length > clamped) {
          state.balanceEvents.length = clamped;
        }
      });
    },
    setBalanceCaptureEnabled: (enabled: boolean) => {
      set((state) => {
        state.balanceCaptureEnabled = Boolean(enabled);
      });
    },
  })),
);
