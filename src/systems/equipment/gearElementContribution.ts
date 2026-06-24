/**
 * M.III.1 EQ-MECH / S5 — the gearAffinity element-vector SEAM (D-E4 · D3). PURE, store-free, and INERT
 * by construction: a worn piece contributes to the affinity vector only through its `elementPayload`, and
 * every demo/live instance's payload is null until D3 deposits it — so today this returns `{}` for any
 * real loadout. STRUCTURE ONLY: the per-element value is a structural tally of carrying pieces; the
 * affinity WEIGHT curve (how a tally becomes a × (1 + Σ) affinity) is D4/D15-HELD.
 */

import type { ElementId } from '../elements/elementTypes.js';
import type { GearInstance } from './gearModel.js';
import type { Loadout } from './gearLoadout.js';

/** A sparse element-affinity vector — only elements carried by worn gear appear. Partial of ElementWeights. */
export type GearAffinityVector = Partial<Record<ElementId, number>>;

function wornInstances(loadout: Loadout): GearInstance[] {
  return [loadout.weapon, loadout.head, loadout.chest, loadout.legs, ...loadout.accessories].filter(
    (entry): entry is GearInstance => entry !== null,
  );
}

/**
 * Tally the worn panoply's element payloads into a sparse affinity vector. Returns `{}` while no piece
 * carries an `elementPayload` (the inert default). PURE.
 */
export function toGearAffinity(loadout: Loadout): GearAffinityVector {
  const vector: GearAffinityVector = {};
  for (const instance of wornInstances(loadout)) {
    const payload = instance.elementPayload;
    if (!payload) continue; // inert — D3 deposits element payloads later
    const key = payload as ElementId; // payload, when present, is a live element id (D3 validates upstream)
    vector[key] = (vector[key] ?? 0) + 1; // structural tally; the affinity-weight curve is HELD → D4/D15
  }
  return vector;
}

/** True when no worn piece carries an element payload (the seam is dormant). */
export function isGearAffinityInert(vector: GearAffinityVector): boolean {
  return Object.keys(vector).length === 0;
}
