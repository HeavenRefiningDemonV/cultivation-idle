import { randFloat } from '../../utils/rng.js';
import type { GearRarity, ItemDef, GearInstance } from './gearModel.js';
import { rollGearInstance } from './gearRoll.js';
import type { LootDrop } from '../../types/index.js';

/**
 * D8 — the GEAR-DROP resolver + table structure. STRUCTURE ONLY.
 *
 * RELATES-TO (does NOT fork) the live loot system: a `GearDropEntry` reuses `LootDrop`'s `itemId` namespace
 * (an ITEMS_DATABASE / ItemDef key) and its 0-100 `dropChance` scale, and is meant to plug into the
 * existing `generateLoot` for-loop (`loot.ts`) via presence-narrowing (`'type' in entry`) — NOT a parallel
 * drop/pity engine. That wire (and the seed source) is PARKED for the drop-flow / slice-1b packet.
 *
 * GUARDRAILS:
 *  - RATES/WEIGHTS HELD (`HELD_RATE = 0`): held `dropChance` ⇒ no drop; held `rarityPool` weights ⇒ default.
 *  - INERT WHILE HELD: `rollGearDrop` gates on `dropChance` BEFORE any pick ⇒ held ⇒ `null` (no drop). And
 *    the rolled instance comes from `rollGearInstance` (itself inert ⇒ 0 affixes while held).
 *  - DETERMINISTIC/PURE seeded (mirrors gearRoll). NOTE the live loot path is `Math.random`-based +
 *    SEEDLESS — the eventual wire must manufacture a seed (slice-1b's call); determinism here is
 *    provable-in-isolation until then.
 *  - UNCONSUMED ⇒ byte-identical (nothing calls this; the live loot flow is untouched).
 */

/** Held drop-rate / weight sentinel — D15 fills. 0 ⇒ no drop / no weight ⇒ inert. */
export const HELD_RATE = 0;

export interface RarityWeight {
  readonly rarity: GearRarity;
  readonly weight: number; // HELD
}

/** A gear drop entry. `itemId` ≡ `LootDrop.itemId` (same namespace); `type:'gear'` is presence-narrowed. */
export interface GearDropEntry {
  readonly type: 'gear';
  readonly itemId: string;
  readonly dropChance: number;                    // 0-100 (LootDrop scale) — HELD
  readonly rarityPool: readonly RarityWeight[];   // HELD weights
  readonly baseRarity?: GearRarity;               // fallback while the pool is held
}

/** The eventual drop-table member type — LOCAL this slice (live `lootTable` stays `LootDrop[]` until the wire). */
export type DropTableEntry = LootDrop | GearDropEntry;

export interface GearDropResult {
  readonly rarity: GearRarity;
  readonly instance: GearInstance;
  readonly seed: number;
}

/** Pure weighted pick: the item whose cumulative weight contains `roll × total`. Empty/all-zero-weight ⇒ null. */
export function pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number, roll: number): T | null {
  let total = 0;
  for (const x of items) total += Math.max(0, weightOf(x));
  if (total <= 0) return null;
  const target = roll * total;
  let acc = 0;
  for (const x of items) {
    acc += Math.max(0, weightOf(x));
    if (target < acc) return x;
  }
  return items[items.length - 1] ?? null;
}

/**
 * Roll a gear drop. INERT while held — the held `dropChance` (0) gate returns `null` BEFORE any pick. When
 * D15 fills `dropChance` + `rarityPool`, picks a rarity (weighted) and rolls a GearInstance. PURE/seeded.
 */
export function rollGearDrop(entry: GearDropEntry, itemDef: ItemDef, seed: number): GearDropResult | null {
  const chance = randFloat(seed);
  if (chance.value * 100 >= entry.dropChance) return null; // 0-100 scale; held 0 ⇒ always no drop
  const rarityRoll = randFloat(chance.seed);
  const rarity = pickWeighted(entry.rarityPool, (w) => w.weight, rarityRoll.value)?.rarity ?? entry.baseRarity ?? 'common';
  const instance = rollGearInstance(itemDef, rarity, rarityRoll.seed);
  return { rarity, instance, seed: rarityRoll.seed };
}
