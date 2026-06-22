import { CultivationExactScreenOwner } from '../../features/cultivation/exact/index.js';
import { CultivationSeatScreenOwner } from '../../features/cultivation/seat/CultivationSeatScreenOwner.js';
import { resolveCultivationSeatFlag } from '../../features/cultivation/seat/cultivationSeatFlag.js';

export function CultivateScreen() {
  // M.II.3 — the Seat of Becoming is the public default (flip #2 / §26.4 cutover). Preserve-first:
  // the legacy screen is kept BESIDE it and stays reachable via `?cultivationSeat=legacy`, OR via the
  // legacy screen's own `?cultivationExactMode=` dev/QA query (whose presence requests the legacy).
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const wantsLegacyExact = new URLSearchParams(search).has('cultivationExactMode');
  const seat = resolveCultivationSeatFlag(search);
  if (seat.enabled && !wantsLegacyExact) {
    return <CultivationSeatScreenOwner mode={seat.mode} fixtureId={seat.fixtureId} />;
  }
  return <CultivationExactScreenOwner />;
}
