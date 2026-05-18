import { create } from 'zustand';
import {
  GameEvents,
  type CombatResolvedEvent,
  type GameEvent,
  type RewardsGrantedEvent,
  type TrialsAttemptResolvedEvent,
} from '../../services/events/GameEvents.js';
import type { BuildLiveCombatAftermathContextHint } from './types.js';

const MAX_EVENT_MEMORY = 30;

interface CombatAftermathEventMemoryState {
  rewards: RewardsGrantedEvent['payload'][];
  combats: CombatResolvedEvent['payload'][];
  trials: TrialsAttemptResolvedEvent['payload'][];
  pushReward: (payload: RewardsGrantedEvent['payload']) => void;
  pushCombat: (payload: CombatResolvedEvent['payload']) => void;
  pushTrial: (payload: TrialsAttemptResolvedEvent['payload']) => void;
  clear: () => void;
}

function latestFirst<T extends { timestamp?: number }>(items: T[]): T[] {
  return [...items]
    .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))
    .slice(0, MAX_EVENT_MEMORY);
}

export const useCombatAftermathEventMemoryStore = create<CombatAftermathEventMemoryState>()((set) => ({
  rewards: [],
  combats: [],
  trials: [],
  pushReward: (payload) => set((state) => ({ rewards: latestFirst([payload, ...state.rewards]) })),
  pushCombat: (payload) => set((state) => ({ combats: latestFirst([payload, ...state.combats]) })),
  pushTrial: (payload) => set((state) => ({ trials: latestFirst([payload, ...state.trials]) })),
  clear: () => set({ rewards: [], combats: [], trials: [] }),
}));

function reasonMatchesContext(reason: string, hint: BuildLiveCombatAftermathContextHint): boolean {
  if (hint.kind === 'gate_trial') return /gate|trial|safety net/i.test(reason);
  if (hint.kind === 'ruins') return /ruins?/i.test(reason);
  return /outskirts/i.test(reason);
}

function combatMatchesContext(payload: CombatResolvedEvent['payload'], hint: BuildLiveCombatAftermathContextHint): boolean {
  if (hint.kind === 'gate_trial') {
    return payload.source === 'trial' && (!hint.trialId || payload.trialId === hint.trialId);
  }
  if (hint.kind === 'ruins') return payload.source === 'ruins';
  return payload.source === 'outskirts';
}

function trialMatchesContext(payload: TrialsAttemptResolvedEvent['payload'], hint: BuildLiveCombatAftermathContextHint): boolean {
  return hint.kind === 'gate_trial' && (!hint.trialId || payload.trialId === hint.trialId);
}

export function findLatestCombatAftermathEvents(hint: BuildLiveCombatAftermathContextHint): {
  rewardPayload: RewardsGrantedEvent['payload'] | null;
  combatPayload: CombatResolvedEvent['payload'] | null;
  trialPayload: TrialsAttemptResolvedEvent['payload'] | null;
  sourceEventIds: string[];
  debugNotes: string[];
} {
  const state = useCombatAftermathEventMemoryStore.getState();
  const rewardPayload = state.rewards.find((payload) => reasonMatchesContext(payload.reason, hint)) ?? null;
  const combatPayload = state.combats.find((payload) => combatMatchesContext(payload, hint)) ?? null;
  const trialPayload = state.trials.find((payload) => trialMatchesContext(payload, hint)) ?? null;
  const sourceEventIds = [
    rewardPayload ? `rewards:${rewardPayload.timestamp}:${rewardPayload.reason}` : null,
    combatPayload ? `combat:${combatPayload.timestamp ?? 'unknown'}:${combatPayload.source ?? 'unknown'}` : null,
    trialPayload ? `trial:${trialPayload.timestamp}:${trialPayload.attemptId}` : null,
  ].filter((id): id is string => Boolean(id));

  return {
    rewardPayload,
    combatPayload,
    trialPayload,
    sourceEventIds,
    debugNotes: rewardPayload
      ? []
      : ['No structured reward result matched this aftermath context; spoils are conservative.'],
  };
}

function handleGameEvent(event: GameEvent): void {
  if (event.type === 'prestige/performed' || event.type === 'progression/life_started') {
    useCombatAftermathEventMemoryStore.getState().clear();
    return;
  }
  if (event.type === 'rewards/granted') {
    useCombatAftermathEventMemoryStore.getState().pushReward(event.payload);
    return;
  }
  if (event.type === 'combat/resolved') {
    useCombatAftermathEventMemoryStore.getState().pushCombat(event.payload);
    return;
  }
  if (event.type === 'trials/attempt_resolved') {
    useCombatAftermathEventMemoryStore.getState().pushTrial(event.payload);
  }
}

let initialized = false;

export function initCombatAftermathEventBridge(): void {
  if (initialized) return;
  initialized = true;
  GameEvents.onAny(handleGameEvent);
}

export function resetCombatAftermathEventBridgeForTests(): void {
  if (!initialized) return;
  GameEvents.offAny(handleGameEvent);
  initialized = false;
}

export function clearCombatAftermathEventMemoryForTests(): void {
  useCombatAftermathEventMemoryStore.getState().clear();
}
