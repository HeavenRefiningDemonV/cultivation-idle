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
  buildPanoplyExactSurface,
  buildVaultExactSurface,
} from './equipmentExactFixtures.js';
export type { PanoplyExactFixtureSeedId, VaultExactFixtureSeedId } from './equipmentExactFixtures.js';
