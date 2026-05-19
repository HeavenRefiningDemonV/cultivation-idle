import type { GateTransitionId, MajorRealmId } from './contractTypes.js';

export const toTransitionId = (fromRealmId: MajorRealmId, toRealmId: MajorRealmId): GateTransitionId =>
  `${fromRealmId}_to_${toRealmId}`;
