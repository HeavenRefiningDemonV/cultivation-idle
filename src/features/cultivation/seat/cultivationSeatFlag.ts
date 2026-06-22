import type { CultivationSeatMode } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';

/**
 * M.II.3 — preserve-first flag. The Seat of Becoming is the PUBLIC DEFAULT as of flip #2 (the
 * §26.4 cutover). The legacy `CultivationExactScreenOwner` is preserved BESIDE it, still reachable
 * via `?cultivationSeat=legacy` (the preserve-first escape hatch) so nothing is orphaned. Dev/QA +
 * the screenshot harness still force a specific path via `?cultivationSeat=live|fixture`.
 */
export const CULTIVATION_SEAT_PUBLIC_DEFAULT_ENABLED = true;

export interface CultivationSeatFlagResolution {
  enabled: boolean;
  mode: CultivationSeatMode;
  fixtureId: string | null;
}

/** Parse the dev/QA override from a location.search string. Pure. */
export function resolveCultivationSeatFlag(search: string): CultivationSeatFlagResolution {
  const params = new URLSearchParams(search ?? '');
  const override = params.get('cultivationSeat');
  const fixtureId = params.get('cultivationSeatFixture');
  if (override === 'fixture') return { enabled: true, mode: 'fixture', fixtureId };
  if (override === 'live') return { enabled: true, mode: 'live', fixtureId: null };
  // preserve-first escape hatch: the legacy screen stays reachable after the cutover.
  if (override === 'legacy' || override === 'off') return { enabled: false, mode: 'live', fixtureId: null };
  return { enabled: CULTIVATION_SEAT_PUBLIC_DEFAULT_ENABLED, mode: 'live', fixtureId: null };
}
