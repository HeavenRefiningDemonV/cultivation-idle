import { useGameStore } from '../../stores/gameStore.js';
import { useTrainingStore } from '../../stores/trainingStore.js';
import { resolveCourtSharedStats } from '../../features/court/courtSharedStats.js';
import { resolveCourtRealmIndex } from '../../features/court/buildLiveCourtSurface.js';
import { MERIDIAN_REALM_CAPS } from './meridianModel.js';
import { computeDerivedStats } from './derivedStats.js';
import { toDerivedStatInput } from './derivedStatInput.js';
import type { MeridianConstellationInput } from './observatoryMeridianBinding.js';

/**
 * M.I.1 — assemble the Observatory's derived-constellation input from the LIVE stores, at the
 * store/seam boundary (NOT pure — reads stores), mirroring derivedStatInput.ts exactly. It lives
 * here in meridians/ rather than in the Observatory surface builder so that builder can stay the
 * contract-locked PURE adapter (statusObservatorySurface must not import stores or call .getState).
 *
 * The parity guarantee (M.I.1's reason to exist): the Tier-2 derived channels come from the SAME
 * `computeDerivedStats(toDerivedStatInput())` call gameStore.calculatePlayerStats() consumes for its
 * GEO base, and the Tier-0/1 axes/foundation come from the SAME resolveCourtSharedStats(statRatingsById)
 * that toDerivedStatInput itself reads — one engine, one input, no parallel computation. The realm cap
 * uses the same MERIDIAN_REALM_CAPS row the Court surface uses. forceLegacy/flag-off never call this.
 */
export function toObservatoryConstellationInput(): MeridianConstellationInput {
  const realmIndex1to7 = resolveCourtRealmIndex(useGameStore.getState().realm.index);
  const shared = resolveCourtSharedStats(useTrainingStore.getState().statRatingsById);
  return {
    currentPath: useGameStore.getState().selectedPath ?? null,
    axes: shared.axes,
    foundation: shared.foundation,
    derived: computeDerivedStats(toDerivedStatInput(), {}),
    realmCap: MERIDIAN_REALM_CAPS[realmIndex1to7 - 1] ?? 0,
  };
}
