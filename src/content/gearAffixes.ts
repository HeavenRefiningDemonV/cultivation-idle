import { DERIVED_STAT_KEYS, type DerivedStatKey } from '../systems/meridians/derivedStats.js';
import type { AffixDef, GearRarity, HeldRange } from '../systems/equipment/gearModel.js';

/**
 * D8 — the affix-table STRUCTURE. Typed-but-HELD: NO authored balance number lives here.
 *
 * Every `rollRange` and every rarity band points at the shared `HELD` sentinel; D15/F-BAL deposits the
 * real min/max per affix and the DR-08 affix-count bands / rarity multipliers later. This file is the
 * column structure the balance pass fills, not the values.
 */

/** The shared HELD sentinel — `rollRange === HELD` is the greppable "no number authored" guard. */
export const HELD: HeldRange = Object.freeze({ min: 0, max: 0 });

/** The affix-able channels = the live derived channels MINUS `suppression` (realm-gap-derived, D8 §K.2). */
export const AFFIX_LEGAL_CHANNELS: readonly DerivedStatKey[] = Object.freeze(
  DERIVED_STAT_KEYS.filter((c) => c !== 'suppression'),
);

/**
 * The affix-table structure — seeded as a 1:1 port of the legacy `BASE_AFFIX_POOL` (temperAffixes.ts)
 * re-expressed in the new shape, via the composeGear channel bridge (atkPct→physAttack, defPct→
 * physDefense, hpPct→maxHp, critPct→critChance, dodgePct→evasion). Proves the bridge without inventing
 * affixes; the richer ~15 remaining affix-able channels are F-BAL's to populate.
 *
 * NOTE (inherited legacy overloading): `status_resist` maps to `evasion` because the legacy model
 * overloads `dodgePct` to mean status resistance. D15/F-BAL may split it to `tribulationResist` /
 * `controlPower` — kept as-is here only to preserve assignability to the live composition currency.
 */
export const AFFIX_TABLE: readonly AffixDef[] = Object.freeze([
  { affixId: 'phys_attack_pct',  label: 'Sharpened edge',    channel: 'physAttack',  rollRange: HELD, rarityFloor: 'common',   affixClass: 'flat' },
  { affixId: 'phys_defense_pct', label: 'Guarded frame',     channel: 'physDefense', rollRange: HELD, rarityFloor: 'common',   affixClass: 'flat' },
  { affixId: 'max_hp_pct',       label: 'Sturdy frame',      channel: 'maxHp',       rollRange: HELD, rarityFloor: 'common',   affixClass: 'flat' },
  { affixId: 'crit_chance_pct',  label: 'Critical edge',     channel: 'critChance',  rollRange: HELD, rarityFloor: 'common',   affixClass: 'flat' },
  { affixId: 'status_resist',    label: 'Status resistance', channel: 'evasion',     rollRange: HELD, rarityFloor: 'uncommon', affixClass: 'flat' },
] satisfies readonly AffixDef[]);

/**
 * Rarity bands — `Partial<Record>` (mythic omitted, reserved). All HELD: the affix-count band points at
 * the sentinel (DR-08 numbers held), and powerMult is the parity-safe identity 1 until D15 deposits the
 * ×1.00…×1.45 ladder.
 */
export const RARITY_BANDS: Partial<Record<GearRarity, { affixCount: HeldRange; powerMult: number }>> = Object.freeze({
  common:    { affixCount: HELD, powerMult: 1 },
  uncommon:  { affixCount: HELD, powerMult: 1 },
  rare:      { affixCount: HELD, powerMult: 1 },
  epic:      { affixCount: HELD, powerMult: 1 },
  legendary: { affixCount: HELD, powerMult: 1 },
});
