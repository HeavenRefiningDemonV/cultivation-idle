import type { DerivedStatKey } from '../meridians/derivedStats.js';

/**
 * D8 (D-EQ) §B.3 — `composeGear`: the pure composition LAW that turns the worn panoply into the
 * per-channel multiplier dict the derived engine's gear hook consumes
 * (`computeDerivedStats(input, gear)` → `result[channel] = sum × scalar × (gear[channel] ?? 1)`).
 *
 * SCOPE (slice 1a) / DISCIPLINE:
 *  - The LAW only, NOT yet wired into gameStore (that is slice 1b, which must ALSO make the legacy
 *    refine/temper multiply flag-aware so equipped bonuses count exactly once — a careful refactor).
 *  - PARITY-SAFE BY CONSTRUCTION: nothing equipped ⇒ `composeGear` returns `{}` ⇒ the gear hook
 *    multiplies by 1 ⇒ the stat-engine parity baseline (the ref cultivator equips nothing) is untouched.
 *  - NO NEW MAGNITUDE: slice 1 re-expresses the LIVE forge values — refine `1 + 0.02×level` (cap 1.25,
 *    gameStore:1235) and the temper affix bands (`temperAffixes.ts`, 2–5%) — through the derived
 *    channels. Rarity tuples, affix bands, bond/set/foresight curves, the real item-instance model
 *    (armor slots, drops, upgrades) are all D8 content + D15/F-BAL-HELD (later slices).
 *
 * The channel mapping (the LIVE affix vocabulary → Tier-3 channels): atkPct→physAttack; defPct→
 * physDefense + flatDamageReduction; hpPct→maxHp + hpRegen(½); critPct→critChance; dodgePct→evasion.
 * Multiplicative composition; every unlisted channel defaults to 1 via the hook's `?? 1`.
 */

/**
 * The minimal temper-affix shape `composeGear` reads — structurally a subset of the live
 * `equipmentStore` `TemperAffix` (which also carries id/label). Declared inline so this resolver stays
 * a pure leaf with zero store coupling; the live `TemperAffix[]` is assignable to this.
 */
export interface GearTemperAffix {
  stat: 'atkPct' | 'defPct' | 'hpPct' | 'critPct' | 'dodgePct';
  valuePct: number;
}

/** The minimal equip state `composeGear` reads (a subset of the live equipmentStore shape). */
export interface EquipmentGearInput {
  equippedWeaponId: string | null;
  equippedAccessoryId: string | null;
  refineLevelBySlot: { weapon: number; accessory: number };
  temperBonusesBySlot: { weapon: GearTemperAffix[]; accessory: GearTemperAffix[] };
}

const REFINE_PER_LEVEL = 0.02; // LIVE (gameStore:1235) — mirrored, never retuned (slice 1)
const REFINE_CAP = 1.25;
const HP_REGEN_FRACTION = 0.5; // legacy splits hp/regen — the regen share of an hpPct affix

const refineMult = (level: number): number => Math.min(REFINE_CAP, 1 + REFINE_PER_LEVEL * Math.max(0, level));

function mult(gear: Partial<Record<DerivedStatKey, number>>, channel: DerivedStatKey, factor: number): void {
  gear[channel] = (gear[channel] ?? 1) * factor;
}

function applyTemperAffix(gear: Partial<Record<DerivedStatKey, number>>, affix: GearTemperAffix): void {
  const v = 1 + affix.valuePct;
  switch (affix.stat) {
    case 'atkPct': mult(gear, 'physAttack', v); break;
    case 'defPct': mult(gear, 'physDefense', v); mult(gear, 'flatDamageReduction', v); break;
    case 'hpPct': mult(gear, 'maxHp', v); mult(gear, 'hpRegen', 1 + affix.valuePct * HP_REGEN_FRACTION); break;
    case 'critPct': mult(gear, 'critChance', v); break;
    case 'dodgePct': mult(gear, 'evasion', v); break;
  }
}

/**
 * Compose the worn panoply into a Tier-3 gear-multiplier dict. Returns `{}` when nothing is equipped
 * (the parity-safe identity). Only equipped slots contribute (an unequipped slot's stale refine/temper
 * is ignored). PURE.
 */
export function composeGear(input: EquipmentGearInput): Partial<Record<DerivedStatKey, number>> {
  const gear: Partial<Record<DerivedStatKey, number>> = {};
  if (input.equippedWeaponId) {
    mult(gear, 'physAttack', refineMult(input.refineLevelBySlot.weapon));
    for (const affix of input.temperBonusesBySlot.weapon ?? []) applyTemperAffix(gear, affix);
  }
  if (input.equippedAccessoryId) {
    const m = refineMult(input.refineLevelBySlot.accessory);
    mult(gear, 'physDefense', m);
    mult(gear, 'maxHp', m);
    for (const affix of input.temperBonusesBySlot.accessory ?? []) applyTemperAffix(gear, affix);
  }
  return gear;
}
