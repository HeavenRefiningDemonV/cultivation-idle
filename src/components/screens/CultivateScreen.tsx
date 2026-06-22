import { CultivationExactScreenOwner } from '../../features/cultivation/exact/index.js';
import { CultivationSeatScreenOwner } from '../../features/cultivation/seat/CultivationSeatScreenOwner.js';
import { resolveCultivationSeatFlag } from '../../features/cultivation/seat/cultivationSeatFlag.js';

export function CultivateScreen() {
  // M.II.3 — preserve-first: the Seat of Becoming ships BESIDE the legacy screen behind a flag
  // (default off). `?cultivationSeat=live|fixture` forces it on for dev/QA + the screenshot harness.
  const seat = resolveCultivationSeatFlag(typeof window !== 'undefined' ? window.location.search : '');
  if (seat.enabled) {
    return <CultivationSeatScreenOwner mode={seat.mode} fixtureId={seat.fixtureId} />;
  }
  return <CultivationExactScreenOwner />;
}
