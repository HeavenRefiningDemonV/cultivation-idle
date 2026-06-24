import type { DerivedStatKey } from '../systems/meridians/derivedStats.js';

/**
 * D8 — the armor SET-BONUS effect defs (Earth's three-piece families). STRUCTURE ONLY.
 *
 * A set-bonus grant is a per-channel MULTIPLIER set (the same composition currency `composeGear` uses).
 * Every value is the held identity `HELD_MULT = 1` — a multiplier of 1 is NO effect (like
 * `gear[channel] ?? 1` and `RARITY_BANDS.powerMult: 1`). The grant CHANNELS are structural (what the set
 * affects); D15/F-BAL deposits the real multipliers. UNCONSUMED — nothing reads this; the wire that would
 * compose a set grant into the gear multiplier is the parked slice-1b.
 */

/** The held identity multiplier — a grant of 1 is inert (D15 fills the real value). */
export const HELD_MULT = 1;

export interface SetBonusDef {
  readonly setId: string;
  readonly partial: Readonly<Partial<Record<DerivedStatKey, number>>>; // 2-piece grant — values HELD (1)
  readonly full: Readonly<Partial<Record<DerivedStatKey, number>>>;    // 3-piece grant — values HELD (1)
}

/** Example set-bonus defs. Earth's `stoneforged` set affects defensive channels; every value is HELD_MULT. */
export const SET_BONUS_DEFS: readonly SetBonusDef[] = Object.freeze([
  {
    setId: 'stoneforged',
    partial: { physDefense: HELD_MULT, maxHp: HELD_MULT },
    full: { physDefense: HELD_MULT, maxHp: HELD_MULT, flatDamageReduction: HELD_MULT },
  },
]);
