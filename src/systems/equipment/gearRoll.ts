import { randFloat, nextSeed } from '../../utils/rng.js';
import type { GearRarity, AffixDef, GearAffix, GearInstance, ItemDef, HeldRange } from './gearModel.js';
import { AFFIX_TABLE, RARITY_BANDS, HELD } from '../../content/gearAffixes.js';

/**
 * D8 — the GearInstance ROLL / generation resolver. STRUCTURE / ALGO ONLY.
 *
 * GUARDRAILS:
 *  - INERT WHILE HELD: the affix count comes from RARITY_BANDS[rarity].affixCount (HELD {min:0,max:0} ⇒ 0),
 *    each value from AffixDef.rollRange (HELD {0,0} ⇒ 0). So `rollGearInstance` over the held tables yields
 *    a {affixes: []} instance — no effect. (Do NOT borrow gearLoadout's floor-at-1: a count of 0 here is the
 *    correct inert state, not a never-zero gate.)
 *  - DETERMINISTIC + PURE: seed-based (mirrors temperAffixes.selectTemperAffix's randFloat index-pick); no
 *    module RNG, no Math.random/Date.now. Same inputs ⇒ same instance.
 *  - TESTABLE: the pure core `rollAffixes` takes the count + the pool (with their roll ranges) as params, so
 *    the algo is provable with INJECTED non-held values, independent of the held module constants.
 *  - BUILD-ON gearModel/gearAffixes + the live rng utils. UNCONSUMED ⇒ byte-identical.
 *  - NO authored balance number — counts/ranges are HELD; `RARITY_RANK` below is a structural enumeration.
 */

/** Structural rarity rank (ordinal only — NOT the UI's `RARITY_ORDER`, which is component-scoped). */
const RARITY_RANK: readonly GearRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const rarityRank = (r: GearRarity): number => RARITY_RANK.indexOf(r);

/** Roll an integer count within a HeldRange [min,max] inclusive. Held {0,0} ⇒ 0. */
function rollIntInRange(range: HeldRange, seed: number): { value: number; seed: number } {
  const roll = randFloat(seed);
  const span = Math.max(0, range.max - range.min) + 1; // +1 ⇒ inclusive (structural, not a magnitude)
  return { value: Math.floor(roll.value * span) + range.min, seed: roll.seed };
}

/** Roll a value within a HeldRange [min,max]. Held {0,0} ⇒ 0. */
function rollValueInRange(range: HeldRange, seed: number): { value: number; seed: number } {
  const roll = randFloat(seed);
  return { value: range.min + roll.value * (range.max - range.min), seed: roll.seed };
}

export interface RollAffixesResult {
  readonly affixes: readonly GearAffix[];
  readonly seed: number;
}

/**
 * PURE roll core — pick `count` affixes from the pool, rolling each value within its `rollRange`. Empty
 * pool OR count ≤ 0 ⇒ `[]` (the empty-pool guard prevents `pool[NaN]`). Same seed ⇒ same affixes.
 */
export function rollAffixes(input: { affixDefs: readonly AffixDef[]; count: number; seed: number }): RollAffixesResult {
  const pool = input.affixDefs;
  if (pool.length === 0 || input.count <= 0) return { affixes: [], seed: input.seed };
  const affixes: GearAffix[] = [];
  let seed = input.seed;
  for (let i = 0; i < input.count; i++) {
    const pick = randFloat(seed);
    seed = pick.seed;
    const def = pool[Math.floor(pick.value * pool.length) % pool.length]!;
    const rolled = rollValueInRange(def.rollRange, seed);
    seed = rolled.seed;
    affixes.push({ affixId: def.affixId, channel: def.channel, valuePct: rolled.value });
  }
  return { affixes, seed };
}

/** The admissible affix pool: AFFIX_TABLE rows whose id is in the item's affixPool AND whose rarityFloor ≤ the rarity. */
export function resolveAffixPool(itemDef: ItemDef, rarity: GearRarity): readonly AffixDef[] {
  const allowed = new Set(itemDef.affixPool ?? []);
  return AFFIX_TABLE.filter((d) => allowed.has(d.affixId) && rarityRank(d.rarityFloor) <= rarityRank(rarity));
}

/**
 * A content-hash instance id from the roll inputs — DETERMINISTIC (same inputs ⇒ same id), collision-by-
 * design for identical rolls. NOT a uniqueness key: the eventual drop-flow packet mints a unique seed per
 * drop (so two real copies get different seeds ⇒ different ids).
 */
function deriveInstanceId(defId: string, seed: number): string {
  return `${defId}#${(nextSeed(seed) >>> 0).toString(36)}`;
}

/**
 * Roll a GearInstance from an ItemDef + rarity + seed. INERT while the tables are HELD (count 0 ⇒ no
 * affixes); when D15 fills RARITY_BANDS.affixCount + AFFIX_TABLE.rollRange the same algo produces real
 * items. Element payload is null (honest placeholder — element variance is D15/F-BAL's). PURE.
 */
export function rollGearInstance(itemDef: ItemDef, rarity: GearRarity, seed: number): GearInstance {
  const band = RARITY_BANDS[rarity]?.affixCount ?? HELD; // held {0,0} ⇒ count 0
  const counted = rollIntInRange(band, seed);
  const pool = resolveAffixPool(itemDef, rarity);
  const rolled = rollAffixes({ affixDefs: pool, count: counted.value, seed: counted.seed });
  return {
    instanceId: deriveInstanceId(itemDef.id, seed),
    defId: itemDef.id,
    rarity,
    affixes: rolled.affixes,
    elementPayload: null,
  };
}
