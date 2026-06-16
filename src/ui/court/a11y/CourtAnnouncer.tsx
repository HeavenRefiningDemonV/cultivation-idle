import './courtA11y.scss';
import { courtAnnouncement } from './courtAnnouncement';
import type { TemperingCourtSurface } from '../../../systems/meridians/index.js';

/**
 * W10 — the Court's polite state announcer. A visually-hidden role=status / aria-live
 * region (mirrors the observatory's obsVisuallyHidden announcer). Render-only: the
 * message is derived from the surface, so a state change (start/cease/cap/bottleneck/
 * blocked) re-renders the string and assistive tech speaks it. No layout, no colour.
 */
export function CourtAnnouncer({ surface }: { surface: TemperingCourtSurface }) {
  return (
    <div className="courtSrOnly" role="status" aria-live="polite">
      {courtAnnouncement(surface)}
    </div>
  );
}
