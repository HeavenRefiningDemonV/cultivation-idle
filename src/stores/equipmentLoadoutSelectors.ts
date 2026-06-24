/**
 * M.III.1 EQ-MECH / S1 — pure selectors over the 5-slot loadout + the per-instance Vault, so the surface
 * builder (S3) reads via Zustand selectors, not whole-store subscriptions (architecture guardrail). Pure and
 * structurally-typed (the store's state interface is not exported) — no store handles, no `.getState()`.
 * The `defId → ItemDef` resolution is injected read-only (the slot/setId live on the def, not the instance).
 */

import type { Loadout } from '../systems/equipment/gearLoadout.js';
import type { GearInstance, ItemDef } from '../systems/equipment/gearModel.js';

export const selectLoadout = (state: { loadout: Loadout }): Loadout => state.loadout;

export const selectGearInstances = (
  state: { gearInstances: Record<string, GearInstance> },
): Record<string, GearInstance> => state.gearInstances;

/** All worn instances, in slot order (weapon, head, chest, legs, then accessories). */
export const selectWornInstances = (loadout: Loadout): GearInstance[] => {
  const worn: GearInstance[] = [];
  if (loadout.weapon) worn.push(loadout.weapon);
  if (loadout.head) worn.push(loadout.head);
  if (loadout.chest) worn.push(loadout.chest);
  if (loadout.legs) worn.push(loadout.legs);
  worn.push(...loadout.accessories);
  return worn;
};

/** Resolve the worn instances' defs via a read-only registry resolver (setId/slot/bond live on the def). */
export const selectWornDefs = (
  loadout: Loadout,
  getDef: (defId: string) => ItemDef | undefined,
): ItemDef[] => {
  const defs: ItemDef[] = [];
  for (const instance of selectWornInstances(loadout)) {
    const def = getDef(instance.defId);
    if (def) defs.push(def);
  }
  return defs;
};
