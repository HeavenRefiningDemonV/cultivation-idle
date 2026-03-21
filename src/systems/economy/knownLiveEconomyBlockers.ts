import type { LiveEconomyRuntimeStatus } from './liveEconomyTypes.js';

export type KnownLiveEconomyBlocker = {
  id: string;
  entityKind: 'item' | 'forge_blueprint';
  runtimeStatus: Extract<LiveEconomyRuntimeStatus, 'visible_live_blocked'>;
  reason: string;
};

export const KNOWN_LIVE_ECONOMY_BLOCKERS = [] as const satisfies readonly KnownLiveEconomyBlocker[];

export function getKnownLiveEconomyBlocker(_id: string): KnownLiveEconomyBlocker | null {
  return null;
}

export function isKnownLiveEconomyBlocker(_id: string): boolean {
  return false;
}
