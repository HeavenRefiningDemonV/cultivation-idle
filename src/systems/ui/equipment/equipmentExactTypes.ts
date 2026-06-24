/**
 * M.III.1 EQ-MECH / S0 — the two render-only Equipment & Inventory surface contracts.
 *
 * Cross-doc aliases (one tab, two sibling surfaces — DR-17): D17 names these `panoplyExactSurface`
 * / `vaultExactSurface`; Codex §III.E.1 / §III.F name them `EquipmentSurfaceV1` / `InventorySurfaceV1`.
 * This file adopts the repo `*ExactSurfaceV1` + `*_SCHEMA_VERSION` convention (cf.
 * StatusObservatorySurfaceV1, ItemDetailSurfaceV1).
 *
 * Render-only law: NO field is a method; NO field references a Zustand store. Every value is data the
 * builder (M.III.1 S3) computes upstream and the painted port (M.III.3) binds. `selectedDetail` is the
 * EXACT F2 `ItemDetailSurfaceV1` — imported, never re-declared. Rarity is never hue-alone: every
 * `rarityFrameGrade` is paired with a `rarityLabel`. Element edges carry a NAMED scene-color token,
 * never a raw hex (A.9 truth-surfacing). Every magnitude shown is HELD → D15 / F-BAL.
 */

import { type ItemDetailRarity, type ItemDetailSurfaceV1 } from '../modals/itemDetailTypes.js';

export const PANOPLY_EXACT_SCHEMA_VERSION = 'panoply-exact-v1' as const;
export const VAULT_EXACT_SCHEMA_VERSION = 'vault-exact-v1' as const;

/** The M.III.2 / M.III.3 state matrix — shared by both surfaces. */
export type EquipmentExactVisualState =
  | 'healthy'
  | 'empty'
  | 'blocked'
  | 'detail-affix'
  | 'detail-legendary'
  | 'contentCap'
  | 'unknown';
export const EQUIPMENT_EXACT_VISUAL_STATE_OPTIONS = [
  'healthy',
  'empty',
  'blocked',
  'detail-affix',
  'detail-legendary',
  'contentCap',
  'unknown',
] as const satisfies readonly EquipmentExactVisualState[];

/** D-E12 per-path re-weighting — emphasis only; NEVER changes slot geometry. */
export type PanoplyPathLean = 'martial' | 'earth' | 'heaven';
export const PANOPLY_PATH_LEAN_OPTIONS = ['martial', 'earth', 'heaven'] as const satisfies readonly PanoplyPathLean[];

/** The F0 rarity frame grade (`--rarity-mortal`…`--rarity-immortal`); always paired with a rarityLabel. */
export type RarityFrameGrade = 'mortal' | 'spirit' | 'earth' | 'heaven' | 'immortal';
export const RARITY_FRAME_GRADE_OPTIONS = [
  'mortal',
  'spirit',
  'earth',
  'heaven',
  'immortal',
] as const satisfies readonly RarityFrameGrade[];

/** weapon ×1, head/chest/legs ×3, accessory ×N (D8 §D.2 / D-E1). */
export type PanoplySlotKind = 'weapon' | 'head' | 'chest' | 'legs' | 'accessory';

/** The element edge-glyph (D3): id + label + the NAMED element scene-color token. Mirrors the F2 shape. */
export interface GearElementEdge {
  id: string;
  label: string;
  sceneColorToken: string;
}

/** D-E9 — the FACT of a tier-gap cap (item tier < content tier). Magnitude (the penalty curve) is HELD → D6/D15. */
export interface TierGapNote {
  capped: true;
  note: string;
}

/** A realm-gated locked slot (the F0 locked state). The requirement is named; the gate is HELD/structural. */
export interface SlotGateNote {
  requirement: string;
}

/** D-E1/D-E2 — a worn piece, compact item language. */
export interface PanoplyItemSummary {
  instanceId: string;
  name: string;
  nameCjk?: string | null;
  /** tier 1–7 mark, e.g. "T3". */
  tierMark: string;
  rarity: ItemDetailRarity;
  /** 凡/良/珍/极/仙 + English — so the frame grade is never hue-alone. */
  rarityLabel: string;
  rarityFrameGrade: RarityFrameGrade;
  element?: GearElementEdge | null;
  affixCount: number;
  capped?: TierGapNote | null;
}

export interface PanoplySlotSurface {
  slot: PanoplySlotKind;
  filled: boolean;
  item?: PanoplyItemSummary | null;
  /** the empty seal-mount label shown when unfilled. */
  mountLabel: string;
  locked?: SlotGateNote | null;
}

/** D-E7 — a set-bond band. While thresholds are HELD the tier is `null` ("inactive / 2 of 3 — held"). */
export interface SetBonusBandSurface {
  setId: string;
  name: string;
  /** worn pieces of the set. */
  held: number;
  /** pieces for the full bond. */
  total: number;
  /** null while thresholds HELD — the band renders honestly inactive, never a fake-active state. */
  activeTier: string | null;
  effectText: string;
}

/** D-E6 — Martial-only. The panoply/inspector show this ONLY for a Martial weapon; `bond` is null otherwise. */
export interface WeaponBondSurface {
  level: number;
  max?: number | null;
  xpSources: string[];
  latentAffixes: string[];
  weaponArts: string[];
}

export type GearTotalsTone = 'gain' | 'neutral' | 'loss';

/** D-E11 — one row of "what the gear adds": composeGear's output, formatted UPSTREAM; the view never recomputes. */
export interface GearTotalsRow {
  /** the derived channel id, e.g. 'physAttack'. */
  channel: string;
  label: string;
  /** the formatted contribution, e.g. "×1.16" / "+12%". */
  addText: string;
  tone: GearTotalsTone;
}

/** D-E11 / Codex E.7.5 — the totals panel, grouped. Read directly from composeGear; nothing re-derived. */
export interface GearTotalsSurface {
  offense: GearTotalsRow[];
  defense: GearTotalsRow[];
  utility: GearTotalsRow[];
}

/** D-E4 — the aggregate gearAffinity lean (shape only; HELD while element payloads are null). */
export interface GearElementLeanEntry {
  element: string;
  label: string;
  weight: number;
  sceneColorToken: string;
}
export interface GearElementLeanSurface {
  entries: GearElementLeanEntry[];
}

/** The worn figure (Codex §III.E; D17 `panoplyExactSurface`). */
export interface PanoplyExactSurfaceV1 {
  schemaVersion: typeof PANOPLY_EXACT_SCHEMA_VERSION;
  visualState: EquipmentExactVisualState;
  pathLean: PanoplyPathLean;
  /** exactly: weapon, head, chest, legs, accessory[]. */
  slots: PanoplySlotSurface[];
  setBonuses: SetBonusBandSurface[];
  /** Martial-only; null otherwise (NEVER a stub row). */
  bond: WeaponBondSurface | null;
  /** "what the gear adds" — composeGear's output, labeled. */
  totals: GearTotalsSurface;
  elementLean?: GearElementLeanSurface | null;
  /** the F2 inspector payload for the focused slot. */
  selectedDetail: ItemDetailSurfaceV1 | null;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The Vault (Codex §III.F; D17 `vaultExactSurface`).
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type VaultSlotFilter = 'all' | 'weapon' | 'armor' | 'accessory';
export const VAULT_SLOT_FILTER_OPTIONS = ['all', 'weapon', 'armor', 'accessory'] as const satisfies readonly VaultSlotFilter[];

export type VaultGradeFilter = 'all' | ItemDetailRarity;

export type VaultSortBy = 'rarity' | 'slot' | 'recent';
export const VAULT_SORT_BY_OPTIONS = ['rarity', 'slot', 'recent'] as const satisfies readonly VaultSortBy[];

export type VaultSortDir = 'asc' | 'desc';

/** Each held GearInstance as a rarity-framed slip. */
export interface VaultSlipSurface {
  instanceId: string;
  name: string;
  glyphId: string;
  slot: PanoplySlotKind;
  tierMark: string;
  rarity: ItemDetailRarity;
  rarityLabel: string;
  rarityFrameGrade: RarityFrameGrade;
  element?: GearElementEdge | null;
  affixCount: number;
  isEquipped: boolean;
  isNew?: boolean;
}

export interface VaultExactSurfaceV1 {
  schemaVersion: typeof VAULT_EXACT_SCHEMA_VERSION;
  visualState: EquipmentExactVisualState;
  slips: VaultSlipSurface[];
  filter: { slot: VaultSlotFilter; grade: VaultGradeFilter };
  sort: { by: VaultSortBy; dir: VaultSortDir };
  counts: { total: number; byRarity: Record<ItemDetailRarity, number> };
  selection: { instanceId: string | null };
  /** selecting a slip fills the F2 inspector. */
  selectedDetail: ItemDetailSurfaceV1 | null;
  /** D-F — the dismantle action, confirm-gated (intent only; the store mutation is the endpoint). */
  dismantle?: { enabled: boolean; confirmPrompt: string } | null;
}
