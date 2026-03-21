import type { LiveEconomyRuntimeStatus } from './liveEconomyTypes.js';

export type KnownLiveEconomyBlocker = {
  id: string;
  entityKind: 'item' | 'forge_blueprint';
  runtimeStatus: Extract<LiveEconomyRuntimeStatus, 'visible_live_blocked'>;
  reason: string;
};

export const KNOWN_LIVE_ECONOMY_BLOCKERS = [
  {
    id: 'mat_spirit_dew',
    entityKind: 'item',
    runtimeStatus: 'visible_live_blocked',
    reason: 'No live sink remains after formation/talisman outputs are quarantined.',
  },
  {
    id: 'mat_artifact_shard',
    entityKind: 'item',
    runtimeStatus: 'visible_live_blocked',
    reason: 'No live sink remains after spirit-solvent and Jade Core outputs are quarantined.',
  },
  {
    id: 'reagent_quenching_oil_t2',
    entityKind: 'item',
    runtimeStatus: 'visible_live_blocked',
    reason: 'Required by forge_refine_legendary_t5, but no live source path exists this packet.',
  },
  {
    id: 'forge_refine_legendary_t5',
    entityKind: 'forge_blueprint',
    runtimeStatus: 'visible_live_blocked',
    reason: 'Late-tier live refine path is blocked until reagent_quenching_oil_t2 gains a live source.',
  },
] as const satisfies readonly KnownLiveEconomyBlocker[];

const BLOCKER_BY_ID = new Map<string, KnownLiveEconomyBlocker>(KNOWN_LIVE_ECONOMY_BLOCKERS.map((entry) => [entry.id, entry]));

export function getKnownLiveEconomyBlocker(id: string): KnownLiveEconomyBlocker | null {
  return BLOCKER_BY_ID.get(id) ?? null;
}

export function isKnownLiveEconomyBlocker(id: string): boolean {
  return BLOCKER_BY_ID.has(id);
}
