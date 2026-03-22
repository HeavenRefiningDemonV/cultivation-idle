import type { KnownLiveEconomyBlocker } from './liveEconomyTypes.js';

export const KNOWN_LIVE_ECONOMY_BLOCKERS: readonly KnownLiveEconomyBlocker[] = [] as const;

const BLOCKER_BY_ID = new Map(KNOWN_LIVE_ECONOMY_BLOCKERS.map((entry) => [entry.id, entry]));

export function getKnownLiveEconomyBlocker(id: string): KnownLiveEconomyBlocker | undefined {
  return BLOCKER_BY_ID.get(id);
}

export function isKnownLiveEconomyBlocker(id: string): boolean {
  return BLOCKER_BY_ID.has(id);
}

export function listKnownLiveEconomyBlockers(): KnownLiveEconomyBlocker[] {
  return [...KNOWN_LIVE_ECONOMY_BLOCKERS];
}
