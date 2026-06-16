import type { TemperingCourtSurface } from '../../../systems/meridians/index.js';

/**
 * W10 — the polite live-region message for the Court (artifact a11y, §1.9 / packet W10).
 * Pure: maps the render-only surface to a single spoken sentence that conveys the
 * current Court state (started / ceased / blocked / no-path) plus the top alert
 * (capped, bottleneck, breakthrough-unlocked). Re-rendered into an aria-live region;
 * assistive tech announces it whenever the string changes. No motion-only / colour-only
 * meaning — every state has words here.
 */
export function courtAnnouncement(surface: TemperingCourtSurface): string {
  const meridian = surface.activeMeridian;
  let head: string;
  switch (surface.status) {
    case 'active':
      head = meridian
        ? `Tempering ${meridian.name} at ${surface.intensity.label} intensity.`
        : `Tempering at ${surface.intensity.label} intensity.`;
      break;
    case 'idle':
      head = 'Court idle — ready to temper.';
      break;
    case 'blocked_by_combat':
      head = 'Court closed — in combat.';
      break;
    case 'blocked_by_activity':
      head = 'Court occupied — another activity holds the hall.';
      break;
    case 'no_path':
      head = 'No path chosen — choose a path at Life Start to begin tempering.';
      break;
    default:
      head = '';
  }
  const alert = surface.alerts[0];
  return alert ? `${head} ${alert.text}`.trim() : head;
}
