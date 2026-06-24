import type { PathId } from './types.js';

/**
 * D7 §G — the FOUNDATIONAL legendary-technique catalog (M.IV.1 deliverable). The named APEX arts + their unique
 * "signature" mechanics — the legendary tier of the two-axis technique model (kind × grade), distinct from the
 * rolled common→epic pool. STRUCTURE ONLY:
 *  - Each entry ELEVATES a REAL ultimate from techniques.json (cited, never invented) to legendary + names its
 *    signature edge. The signature `body` describes the art's EXISTING unique mechanic (the dual element, the
 *    guaranteed crit, the guaranteed debuff) — magnitudes are illustrative `[tune]` → D15/F-BAL.
 *  - validate:content / the contract test runs over these ids (catalog-completeness): each id must resolve to a
 *    real `ultimate` `offense` technique in the live content.
 *  - One apex offense ultimate per path (Heaven / Earth / Martial). D7 §G deposits the full per-path roster +
 *    the unique-mechanic VALUES; this module is the structure + the first cited apex per path it extends.
 *
 * Mirrors src/content/gearLegendaries.ts (the M.III.1 gear apex catalog).
 */

export interface LegendaryTechnique {
  /** the REAL techniques.json id this legendary elevates. */
  id: string;
  name: string;
  path: PathId;
  rarity: 'legendary';
  signature: { name: string; body: string };
}

export const TECHNIQUE_LEGENDARIES: readonly LegendaryTechnique[] = Object.freeze([
  {
    id: 'tech_heaven_heavenly_cataclysm',
    name: 'Heavenly Cataclysm',
    path: 'heaven',
    rarity: 'legendary',
    signature: {
      name: 'Twin-Aspected Calamity',
      body: 'The cataclysm falls as BOTH Fire and Lightning at once — no single ward turns it. At mastery a burn smolders in its wake ([tune] → D15). Heaven does not choose one element; it brings them together.',
    },
  },
  {
    id: 'tech_earth_world_pillar_slam',
    name: 'World Pillar Slam',
    path: 'earth',
    rarity: 'legendary',
    signature: {
      name: 'Sunder the Foundation',
      body: 'The pillar-blow guarantees a lasting break in the struck foe’s defense ([tune] → D15) — earth unmakes the ground a guard stands on. What is sundered stays sundered for the duration.',
    },
  },
  {
    id: 'tech_martial_heaven_splitting_slash',
    name: 'Heaven-Splitting Slash',
    path: 'martial',
    rarity: 'legendary',
    signature: {
      name: 'The Certain Cut',
      body: 'The slash always lands true — a guaranteed critical strike, no roll asked. On a killing blow it refunds its own intent ([tune] → D15), so a clean kill flows straight into the next. A named blade does not miss.',
    },
  },
]);

export const LEGENDARY_TECHNIQUE_IDS: readonly string[] = TECHNIQUE_LEGENDARIES.map((t) => t.id);

/** Resolve a technique id → its legendary signature entry, or undefined if it is not an apex art. */
export function findLegendaryTechnique(id: string): LegendaryTechnique | undefined {
  return TECHNIQUE_LEGENDARIES.find((t) => t.id === id);
}
