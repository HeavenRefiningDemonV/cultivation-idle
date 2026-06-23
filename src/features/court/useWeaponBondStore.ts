import { create } from 'zustand';
import { createDefaultWeaponBondSaveState, type SaveWeaponBondState } from './courtSaveTypes.js';

/**
 * D5 / Martial Weapon-Bond — the bond meter (the Seat's Martial instrument's live source).
 *
 * The canon (DR-06) splits this: D5 owns the bond-as-cultivation fantasy + the BOND METER (this);
 * D8 owns the item model, affixes, and weapon-art rolls (the bigger equipment system, separate).
 * D5: "Martial's bond grows on the active clock (weapon use in combat)… unlocking weapon-arts."
 * So this deepens on a Martial kill and flips the Seat's Martial instrument from "not yet active"
 * to a real read — mirroring C-PATH Premonition (Heaven) + D11 Beast-Lore (Earth).
 *
 * SCOPE / DISCIPLINE (mirrors Beast-Lore):
 *  - PERSISTED (toSaveState/hydrateFromSave) — the bond survives a reload; optional save slice ⇒
 *    legacy saves default to 0 (no migration).
 *  - Engine-gated + Martial-path-only — preserve-first: shipped players still see "not yet active".
 *  - `bondKills` is a COUNT (structure), not a tuned magnitude; the kills→depth%/arts-unlock curve is
 *    a D5/D15-HELD placeholder, derived in the surface (logged in the held-numbers ledger).
 *  - Idle "tempering the bond" regimen (D5 §F) + the real weapon item-model/affixes (D8) are follow-ups.
 */
interface WeaponBondState {
  bondKills: number;
  /** Deepen the bond by one (a weapon kill under the engine flag). */
  deepenBond: () => void;
  /** Reset (e.g. a new life / re-bond). */
  resetWeaponBond: () => void;
  toSaveState: () => SaveWeaponBondState;
  hydrateFromSave: (saved: SaveWeaponBondState | null | undefined) => void;
}

/** A high but finite cap so the meter cannot run away before D15 owns the real curve. */
const BOND_KILLS_CAP = 999;

export const useWeaponBondStore = create<WeaponBondState>((set, get) => ({
  bondKills: 0,
  deepenBond: () => set((s) => ({ bondKills: Math.min(BOND_KILLS_CAP, s.bondKills + 1) })),
  resetWeaponBond: () => set(createDefaultWeaponBondSaveState()),
  toSaveState: () => ({ bondKills: get().bondKills }),
  hydrateFromSave: (saved) => {
    const n = saved && typeof saved.bondKills === 'number' && Number.isFinite(saved.bondKills) ? saved.bondKills : 0;
    set({ bondKills: Math.min(BOND_KILLS_CAP, Math.max(0, Math.floor(n))) });
  },
}));
