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

/** The cutover flag + dev gate (leaf module, no React — safe for the systems layer). */
export { TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED, isTemperingCourtEnabled } from './courtFlag.js';
