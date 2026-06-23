import type { DerivedStatKey } from '../meridians/derivedStats.js';
import type { ItemRarity, ItemDefinition } from '../../types/index.js';

/**
 * D8 — the equipment ITEM-MODEL schema (the ItemDef / GearInstance split). STRUCTURE ONLY.
 *
 * GUARDRAILS (the whole point of this slice):
 *  - UNCONSUMED: nothing reads these types yet — the wire (composeGear → derived, slice 1b) + the legacy
 *    refine/temper de-dup are PARKED as a separate gated packet. So the build is byte-identical.
 *  - BUILD-ON, NOT PARALLEL: `GearSlot` is a literal superset of the live `EquipmentSlot`; `GearRarity`
 *    aliases the live `ItemRarity`; `AffixChannel` aliases the live `DerivedStatKey`; `ItemDef` extends
 *    `ItemDefinition` (additive optionals); a rolled `GearAffix`'s `valuePct` is the same composition
 *    currency `composeGear` consumes. No live name is redeclared.
 *  - MAGNITUDES HELD: every roll band / multiplier / base value is D15/F-BAL's. D8 owns the MODEL + the
 *    composeGear LAW; D15 owns the numbers. See gearAffixes.ts for the HELD sentinel.
 *  - PER-PATH = PLACEHOLDER: `WeaponBondState` is a typed shell, no live logic (D5/D11 own it).
 */

/** The 5-slot taxonomy: weapon (Martial bond), head/chest/legs armor (Earth sets), accessory (Heaven). */
export type GearSlot = 'weapon' | 'head' | 'chest' | 'legs' | 'accessory'; // ⊇ EquipmentSlot ('weapon'|'accessory')

/** Reuse the live rarity union (5 active common→legendary; `mythic` stays reserved). */
export type GearRarity = ItemRarity;

/** The affix-able pool draws exclusively from the live derived channels (suppression excluded — gearAffixes). */
export type AffixChannel = DerivedStatKey;

export type AffixClass = 'flat' | 'element' | 'behavioral';

/** A typed-but-HELD magnitude band — D15/F-BAL deposits the real min/max (the shared `HELD` sentinel). */
export interface HeldRange {
  readonly min: number;
  readonly max: number;
}

/** A static affix-table row (the column structure F-BAL fills). */
export interface AffixDef {
  readonly affixId: string;
  readonly label: string;
  readonly channel: AffixChannel;
  readonly rollRange: HeldRange;   // HELD — D15/F-BAL
  readonly rarityFloor: GearRarity;
  readonly affixClass: AffixClass;
}

/** A rolled affix on an instance. `valuePct` is the live composition currency composeGear consumes. */
export interface GearAffix {
  readonly affixId: string;
  readonly channel: AffixChannel;
  readonly valuePct: number;       // rolled within AffixDef.rollRange — HELD
  readonly latent?: boolean;       // weapon bond-gated — PLACEHOLDER (D5/D11)
  readonly bondGate?: number | null;
}

/** The static item definition: `ItemDefinition` + the D8 gear fields (all additive optional). */
export interface ItemDef extends ItemDefinition {
  readonly gearSlot?: GearSlot;
  readonly rarityTier?: GearRarity;
  readonly affixPool?: readonly string[];           // AffixDef ids drawn at roll time
  readonly setId?: string | null;                   // Earth armor set family
  readonly weaponBondable?: boolean;                // PLACEHOLDER (Martial)
  readonly baseChannels?: Partial<Record<DerivedStatKey, number>>; // HELD base power
}

/** A rolled per-copy item — the heart of D8. */
export interface GearInstance {
  readonly instanceId: string;
  readonly defId: string;
  readonly itemTier?: number;       // 1..7 ceiling axis — HELD curve
  readonly rarity: GearRarity;
  readonly affixes: readonly GearAffix[];
  readonly elementPayload?: string | null;
  readonly upgradeLevel?: number;
  readonly equippedSlot?: GearSlot;
  readonly refineLevelBySlot?: Partial<Record<GearSlot, number>>; // armor refines are per-slot
}

/** D5/D11-owned Martial weapon-bond — PLACEHOLDER shell only (no accrual / no logic in D8). */
export interface WeaponBondState {
  readonly depth: number;
  readonly bondXp: number;
  readonly unlockedLatents: number;
  readonly unlockedArts: readonly string[];
}
