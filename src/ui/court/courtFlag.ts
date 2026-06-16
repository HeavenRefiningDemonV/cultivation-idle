/**
 * The Tempering Court cutover flag — a LEAF module (no React / no SCSS imports) so the
 * systems layer (gameLoop) and modals can read it without pulling the court UI barrel.
 * Mirrors the per-component flag pattern of STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED.
 * OFF through W13a; W13b flips it true and removes the legacy Training Hall path.
 */
export const TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED = false;

/**
 * W13a — runtime gate for mounting + ticking the live Court. The shipped default stays
 * the const above (false), but a DEV override lets reviewers flip the Court on locally —
 * open the app with `?temperingCourt=1` or set `localStorage.temperingCourt = '1'` — to
 * inspect the real, live-data Court in-game before the W13b cutover. No effect on the
 * shipped default; purely a review affordance.
 */
export function isTemperingCourtEnabled(): boolean {
  if (TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED) return true;
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('temperingCourt') === '1') return true;
    return window.localStorage?.getItem('temperingCourt') === '1';
  } catch {
    return false;
  }
}
