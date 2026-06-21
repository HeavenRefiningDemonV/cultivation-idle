/**
 * F1 — the stat-engine cutover flag (the linchpin, SA-A1). LEAF module: no React, no SCSS,
 * no store imports — so the store layer (gameStore.calculatePlayerStats) and the game loop
 * can read it without pulling a UI barrel. Mirrors src/ui/court/courtFlag.ts exactly.
 *
 * Trajectory (DR-16a — the two flips are DISTINCT):
 *   - SA-A1 declares it DEV-OFF: the shipped const stays `false`, so there is no observable
 *     change; the derived read exists but is not the default.
 *   - SA-A4 performs FLIP #1 (dev-on) via the RUNTIME OVERRIDE (?statEngine=1 / localStorage),
 *     NOT by changing the shipped const — reviewers get the derived engine; players still get
 *     legacy. F1 NEVER flips the shipped const.
 *   - FLIP #2 (default-on for players) is a separate, later, separately-gated change owned by
 *     F-BAL (Closer C1), after the global balance pass. It flips the shipped const.
 *
 * `forceLegacy` always wins: it routes back to the legacy engine for the entire feature-layer
 * build (INV-2), so the old path is one query param away no matter what the engine flag says.
 */

export const STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT = false;

/** The always-wins escape hatch (?forceLegacy=1 / localStorage.forceLegacy=1). §3.5. */
export function isForceLegacy(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('forceLegacy') === '1') return true;
    return window.localStorage?.getItem('forceLegacy') === '1';
  } catch {
    return false;
  }
}

/** True when combat should source its base stats from the derived engine. §3.4. */
export function isDerivedStatEngineAuthoritative(): boolean {
  if (isForceLegacy()) return false; // forceLegacy always wins
  if (STAT_ENGINE_DERIVED_AUTHORITATIVE_DEFAULT) return true;
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('statEngine') === '1') return true;
    return window.localStorage?.getItem('statEngine') === '1';
  } catch {
    return false;
  }
}
