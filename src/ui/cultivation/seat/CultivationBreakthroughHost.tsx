import { RitualCeremonyShell } from '../../shell/RitualCeremonyShell.js';
import { buildBreakthroughCeremonySurface } from '../../../systems/ui/cultivation/cultivationBreakthroughCeremony.js';
import type { CultivationSeatSurfaceV1 } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';
import type { CultivationSeatActions } from '../../../features/cultivation/seat/useCultivationSeatActionController.js';

/**
 * M.II.3 Wave 6 — the Seat-scoped breakthrough host. The legacy BreakthroughRitualOverlay is
 * owner-scoped to CultivationExactScreenOwner, so the Seat needs its own host. It does NOT build a
 * ceremony (R-4): it assembles a RitualModalSurfaceV1 from the (already-resolved) crossing result
 * + the Seat surface, and drives the shared F2 RitualCeremonyShell. Render-only — the engine
 * resolved the crossing in the controller; this only presents the held outcome.
 */
export function CultivationBreakthroughHost({ surface, actions }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions }) {
  const { open, result } = actions.ceremony;
  if (!open || !result) return null;
  const ceremonySurface = buildBreakthroughCeremonySurface(surface, result);
  return (
    <RitualCeremonyShell
      open
      surface={ceremonySurface}
      onIntent={actions.onCeremonyIntent}
      onClose={actions.onCeremonyClose}
    />
  );
}
