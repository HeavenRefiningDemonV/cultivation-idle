import type { GearSlot, GearInstance, ItemDef } from './gearModel.js';
import type { CultivationPath } from '../../types/index.js';

/**
 * D8 — the EQUIP / LOADOUT model (the 5-slot equipped set + a pure equip-validation resolver + the
 * set-bonus shape). STRUCTURE ONLY.
 *
 * GUARDRAILS (same as the item-model schema):
 *  - UNCONSUMED: nothing in the store/UI calls these — the wire into the live equipmentStore + composeGear
 *    (slice 1b) is a separate gated packet. Pure resolver ⇒ byte-identical.
 *  - BUILD-ON: reuses gearModel's GearSlot/GearInstance/ItemDef; never redeclares or touches the live
 *    equipmentStore equip flow.
 *  - GATES HELD: accessory mounting count + armor set-bonus thresholds are the `HELD_COUNT` sentinel; D15
 *    fills them. While held they take the PRESERVE-FIRST default (accessory floors at 1 — never a
 *    zero-gate; set bonus stays inactive). NO authored gate number.
 *  - PER-PATH = PLACEHOLDER: `bondEligible` is a structural query (the bond LOGIC is D5/D11's).
 */

/** The 5-slot equipped set. Accessories are a compact (non-null) list, length-bounded by the realm count. */
export interface Loadout {
  readonly weapon: GearInstance | null;
  readonly head: GearInstance | null;
  readonly chest: GearInstance | null;
  readonly legs: GearInstance | null;
  readonly accessories: readonly GearInstance[];
}

export const EMPTY_LOADOUT: Loadout = Object.freeze({
  weapon: null, head: null, chest: null, legs: null, accessories: Object.freeze([]),
});

/** Held-integer sentinel for counts/thresholds — distinct from the HeldRange magnitude sentinel. D15 fills. */
export const HELD_COUNT = -1;
const ACCESSORY_BASE_SLOTS = HELD_COUNT;   // realm-grown accessory mounting count — HELD
const SET_THRESHOLD_PARTIAL = HELD_COUNT;  // armor 2-piece set-bonus threshold — HELD
const SET_THRESHOLD_FULL = HELD_COUNT;     // armor 3-piece set-bonus threshold — HELD

/**
 * The realm-grown accessory mounting count. While the count is HELD it FLOORS AT 1 — the never-zero-gate
 * rule: a held count must never reject the universal first accessory. D15 fills the per-realm growth.
 */
export function accessorySlotCount(_realm: number): number {
  if (ACCESSORY_BASE_SLOTS === HELD_COUNT) return 1;
  return ACCESSORY_BASE_SLOTS; // + realm growth (HELD)
}

export type EquipRejectReason = 'slot-mismatch' | 'accessory-limit';
export interface EquipValidation {
  readonly ok: boolean;
  readonly reason: EquipRejectReason | null;
}
const OK: EquipValidation = Object.freeze({ ok: true, reason: null });
const reject = (reason: EquipRejectReason): EquipValidation => ({ ok: false, reason });

/**
 * Pure equip validation. STRUCTURE: the item's DEF slot must match the target (the slot lives on `ItemDef`,
 * not the instance), and accessories are bounded by the held, floored-at-1 realm count. Per DR-8a any item
 * is equippable at any realm — the realm soft-gate CAPS effectiveness (via the held wire), it does NOT
 * block equip — so realm is not an equip rejection here.
 */
export function validateEquip(input: {
  loadout: Loadout;
  itemDef: ItemDef;
  targetSlot: GearSlot;
  realm: number;
}): EquipValidation {
  if (input.itemDef.gearSlot !== input.targetSlot) return reject('slot-mismatch');
  if (input.targetSlot === 'accessory' && input.loadout.accessories.length >= accessorySlotCount(input.realm)) {
    return reject('accessory-limit');
  }
  return OK;
}

/** Martial weapon-bond eligibility — a STRUCTURAL query (the bond accrual/logic is D5/D11-owned). Bond is
 *  Martial-only, but a non-Martial can still EQUIP the weapon (bond ≠ equip). */
export function bondEligible(itemDef: ItemDef, path: CultivationPath): boolean {
  return itemDef.weaponBondable === true && path === 'martial';
}

export interface SetBonusState {
  readonly setId: string;
  readonly count: number;
  readonly activeTier: 'partial' | 'full' | null;
}

/**
 * Earth armor set-bonus: group the worn defs by `setId`, count, map to a HELD threshold tier. While the
 * thresholds are HELD (`HELD_COUNT`) the tier is always `null` (inactive) — preserve-first. D15 fills the
 * 2/3-piece thresholds. (Takes the worn ItemDefs because `setId` lives on the def, not the instance.)
 */
export function resolveSetBonus(wornDefs: readonly ItemDef[]): readonly SetBonusState[] {
  const counts = new Map<string, number>();
  for (const d of wornDefs) {
    if (d.setId) counts.set(d.setId, (counts.get(d.setId) ?? 0) + 1);
  }
  const out: SetBonusState[] = [];
  for (const [setId, count] of counts) {
    let activeTier: 'partial' | 'full' | null = null;
    if (SET_THRESHOLD_FULL !== HELD_COUNT && count >= SET_THRESHOLD_FULL) activeTier = 'full';
    else if (SET_THRESHOLD_PARTIAL !== HELD_COUNT && count >= SET_THRESHOLD_PARTIAL) activeTier = 'partial';
    out.push({ setId, count, activeTier });
  }
  return out;
}
