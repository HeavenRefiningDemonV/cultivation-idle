/** The Tempering Court UI primitives (W1). Panel material, ink seals, chips,
 *  the shared <defs> sprite, pure helpers, and the public cutover flag. */
export { CourtDefs } from './CourtDefs';
export { CourtPanel } from './CourtPanel';
export type { CourtPanelProps } from './CourtPanel';
/** W7 — the Court stage shell (region content filled in across parity passes). */
export { TemperingCourt } from './TemperingCourt';
export type { TemperingCourtProps } from './TemperingCourt';
export { CourtChip, CourtRootChip } from './courtChips';
export type { CourtChipTone, CourtChipProps, CourtRootGrade, CourtRootChipProps } from './courtChips';
export { CourtWaxSeal, CourtMedallion, CourtFlame, courtCornerUri } from './courtSeals';
export type { CourtWaxSealProps, CourtMedallionProps, CourtFlameProps } from './courtSeals';
export * from './courtHelpers';

/**
 * Public default for the Tempering Court cutover. Mirrors the per-component flag
 * pattern of STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED. OFF through W12 — the Court
 * mounts behind this flag while the legacy Training Hall remains the default;
 * W13 flips it true and removes the legacy path.
 */
export const TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED = false;

/**
 * W13a — runtime gate for mounting the live Court. The shipped default stays the const
 * above (false), but a DEV override lets reviewers flip the Court on locally — open the
 * app with `?temperingCourt=1` or set `localStorage.temperingCourt = '1'` — to inspect
 * the real, live-data Court in-game before the W13b cutover. No effect on the shipped
 * default; purely a review affordance (cf. the packet's debug-flag-gated QA precedent).
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
