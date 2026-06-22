import type { CultivationSeatMode } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';

/**
 * M.II.3 — preserve-first flag. The Seat ships BESIDE the legacy `CultivationExactScreenOwner`
 * and is OFF by default in this packet; flip #2 (a separately-approved cutover) sets it true.
 * A `?cultivationSeat=live|fixture` query override forces it on for dev/QA + the screenshot harness.
 */
export const CULTIVATION_SEAT_PUBLIC_DEFAULT_ENABLED = false;

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
  return {
    enabled: CULTIVATION_SEAT_PUBLIC_DEFAULT_ENABLED,
    mode: CULTIVATION_SEAT_PUBLIC_DEFAULT_ENABLED ? 'live' : 'live',
    fixtureId: null,
  };
}
