import type { DerivedStatKey } from '../meridians/derivedStats.js';
import { SET_BONUS_DEFS } from '../../content/gearSetBonuses.js';

/**
 * D8 — the set-bonus EFFECT resolver. Given a setId + the active tier (from gearLoadout.resolveSetBonus),
 * returns the channel-multiplier grant. STRUCTURE: while the grants are held at the identity 1, this is a
 * no-op multiplier set (composeGear identity ⇒ inert). Pure. UNCONSUMED (the compose-into-gear wire is the
 * parked slice-1b). RELATES to gearLoadout.SetBonusState.activeTier (the tier this consumes).
 */

const DEFS_BY_ID = new Map(SET_BONUS_DEFS.map((d) => [d.setId, d]));

const EMPTY: Readonly<Partial<Record<DerivedStatKey, number>>> = Object.freeze({});

/** The channel-multiplier grant for a set at the given active tier. `{}` for no def / no active tier. */
export function resolveSetBonusGrant(setId: string, tier: 'partial' | 'full' | null): Readonly<Partial<Record<DerivedStatKey, number>>> {
  if (tier === null) return EMPTY;
  const def = DEFS_BY_ID.get(setId);
  if (!def) return EMPTY;
  return tier === 'full' ? def.full : def.partial;
}
