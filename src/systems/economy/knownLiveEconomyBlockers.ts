import type { KnownLiveEconomyBlocker } from './liveEconomyTypes.js';

export const KNOWN_LIVE_ECONOMY_BLOCKERS: readonly KnownLiveEconomyBlocker[] = [
  {
    id: 'mat_spirit_dew',
    status: 'visible_live_blocked',
    entityKind: 'item',
    reason: 'No live sink remains after deferred formation/talisman outputs are quarantined.',
    ownerPacket: '3.1A',
  },
  {
    id: 'mat_artifact_shard',
    status: 'visible_live_blocked',
    entityKind: 'item',
    reason: 'No live sink remains after tribulation-buffer and Jade Core outputs are quarantined.',
    ownerPacket: '3.1A',
  },
  {
    id: 'reagent_quenching_oil_t2',
    status: 'visible_live_blocked',
    entityKind: 'item',
    reason: 'Visible late-tier refine content still requires Quenching Oil t2, but no live source path exists yet.',
    dependencyIds: ['forge_refine_legendary_t5'],
    ownerPacket: '3.1A',
  },
  {
    id: 'forge_refine_legendary_t5',
    status: 'visible_live_blocked',
    entityKind: 'forge_blueprint',
    reason: 'Legendary refine remains visible but is blocked on the missing live reagent path for Quenching Oil t2.',
    dependencyIds: ['reagent_quenching_oil_t2'],
    ownerPacket: '3.1A',
  },
] as const;

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
