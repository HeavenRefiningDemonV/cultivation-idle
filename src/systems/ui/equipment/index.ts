/**
 * M.III.1 EQ-MECH / S0 — barrel for the two render-only Equipment & Inventory surfaces (Panoply +
 * Vault): the frozen `*ExactSurfaceV1` contracts, the option registries, and the deterministic
 * fixtures. Render-only; no store handles. The painted port (M.III.3) consumes these typed surfaces;
 * the real builders (S3) land beside the fixtures and the owner swaps to them (the contracts stay
 * stable). Cross-doc aliases: D17 `panoplyExactSurface`/`vaultExactSurface` =
 * Codex `EquipmentSurfaceV1`/`InventorySurfaceV1`.
 */

export {
  PANOPLY_EXACT_SCHEMA_VERSION,
  VAULT_EXACT_SCHEMA_VERSION,
  EQUIPMENT_EXACT_VISUAL_STATE_OPTIONS,
  PANOPLY_PATH_LEAN_OPTIONS,
  RARITY_FRAME_GRADE_OPTIONS,
  VAULT_SLOT_FILTER_OPTIONS,
  VAULT_SORT_BY_OPTIONS,
} from './equipmentExactTypes.js';
export type {
  EquipmentExactVisualState,
  PanoplyPathLean,
  RarityFrameGrade,
  PanoplySlotKind,
  GearElementEdge,
  TierGapNote,
  SlotGateNote,
  PanoplyItemSummary,
  PanoplySlotSurface,
  SetBonusBandSurface,
  WeaponBondSurface,
  GearTotalsTone,
  GearTotalsRow,
  GearTotalsSurface,
  GearElementLeanEntry,
  GearElementLeanSurface,
  PanoplyExactSurfaceV1,
  VaultSlotFilter,
  VaultGradeFilter,
  VaultSortBy,
  VaultSortDir,
  VaultSlipSurface,
  VaultExactSurfaceV1,
} from './equipmentExactTypes.js';

export {
  PANOPLY_EXACT_FIXTURE_SEEDS,
  VAULT_EXACT_FIXTURE_SEEDS,
  buildPanoplyExactFixture,
  buildVaultExactFixture,
} from './equipmentExactFixtures.js';
export type { PanoplyExactFixtureSeedId, VaultExactFixtureSeedId } from './equipmentExactFixtures.js';

// M.III.1 S3 — the LIVE builders (canonical names). Pure over their input; the owning hook reads S1 state
// + composeGear output via selectors and passes it in. The contracts (above) stay stable; the owner swaps
// the painted port from the fixtures to these.
export {
  buildPanoplyExactSurface,
  buildVaultExactSurface,
  toItemDetailSurface,
} from './equipmentExactBuilders.js';
export type {
  PanoplyBuildInput,
  VaultBuildInput,
  ItemDetailMapInput,
} from './equipmentExactBuilders.js';
export {
  arrangeVaultInstances,
  filterVaultInstances,
  sortVaultInstances,
} from './vaultSortFilter.js';
export type { GetDef } from './vaultSortFilter.js';

// M.III.1 S5 — the per-path emphasis identity (D-E12; shape-only, no geometry change, no magnitude).
export { resolvePathIdentity } from './gearPathIdentity.js';
export type { PathLeanIdentity, SlotEmphasis } from './gearPathIdentity.js';
