/**
 * M.III.3 EQ-PORT — preserve-first flag for the live Panoply/Vault Equipment surface. LEAF module: no
 * React, no SCSS, no store imports — the screen-swap wrapper reads it without pulling a UI barrel.
 *
 * CUTOVER (owner-requested): the live Panoply/Vault surface is now the PUBLIC DEFAULT for the Equipment tab,
 * reading live data (the legacy fields are bridged in panoplyVaultInput). Preserve-first still holds — the
 * legacy `InventoryScreen` is kept BESIDE it and stays reachable via `?panoply=legacy` / `?panoply=off`. The
 * screenshot harness uses `?panoply=fixture`.
 */

export type PanoplyMode = 'live' | 'fixture';
export type PanoplyInitialSurface = 'panoply' | 'vault';

export const PANOPLY_PUBLIC_DEFAULT_ENABLED = true;

export interface PanoplyFlagResolution {
  enabled: boolean;
  mode: PanoplyMode;
  fixtureId: string | null;
  surface: PanoplyInitialSurface | null;
}

/** Parse the dev/QA override from a `location.search` string. Pure. */
export function resolvePanoplyFlag(search: string): PanoplyFlagResolution {
  const params = new URLSearchParams(search ?? '');
  const override = params.get('panoply');
  const fixtureId = params.get('panoplyFixture');
  const surfaceRaw = params.get('panoplySurface');
  const surface: PanoplyInitialSurface | null =
    surfaceRaw === 'panoply' || surfaceRaw === 'vault' ? surfaceRaw : null;
  if (override === 'fixture') return { enabled: true, mode: 'fixture', fixtureId, surface };
  if (override === 'live') return { enabled: true, mode: 'live', fixtureId: null, surface };
  // preserve-first escape hatch: the legacy InventoryScreen stays the default + is reachable explicitly.
  if (override === 'legacy' || override === 'off') return { enabled: false, mode: 'live', fixtureId: null, surface: null };
  return { enabled: PANOPLY_PUBLIC_DEFAULT_ENABLED, mode: 'live', fixtureId: null, surface };
}
