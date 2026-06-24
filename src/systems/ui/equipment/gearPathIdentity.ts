/**
 * M.III.1 EQ-MECH / S5 — the per-path identity resolver (D-E12). EMPHASIS ONLY: it reweights how the
 * three paths READ the same panoply (which slot leads, which supports, which is muted) — it NEVER changes
 * slot geometry, and it authors no magnitude. The three identities must read DISTINCTLY: Martial leads on
 * the weapon (bond), Earth on the armor (sets), Heaven on the accessories (insight). PURE, store-free.
 */

import type { PanoplyPathLean } from './equipmentExactTypes.js';

export type SlotEmphasis = 'lead' | 'support' | 'muted';

export interface PathLeanIdentity {
  path: PanoplyPathLean;
  headline: string;
  /** the emphasis lens — leads/supports/mutes per slot family. NEVER a geometry change. */
  emphasis: { weapon: SlotEmphasis; armor: SlotEmphasis; accessory: SlotEmphasis };
}

const IDENTITY: Record<PanoplyPathLean, PathLeanIdentity> = {
  martial: {
    path: 'martial',
    headline: 'Martial — the weapon leads; the bond deepens with the blade.',
    emphasis: { weapon: 'lead', armor: 'support', accessory: 'muted' },
  },
  earth: {
    path: 'earth',
    headline: 'Earth — the armor set leads; endurance is the discipline.',
    emphasis: { weapon: 'muted', armor: 'lead', accessory: 'support' },
  },
  heaven: {
    path: 'heaven',
    headline: 'Heaven — the accessories lead; insight over force.',
    emphasis: { weapon: 'support', armor: 'muted', accessory: 'lead' },
  },
};

/** Resolve the per-path emphasis identity. Total over the three paths; pure; shape-only. */
export function resolvePathIdentity(path: PanoplyPathLean): PathLeanIdentity {
  return IDENTITY[path];
}
