import type { GearInstance } from './gearModel.js';

/**
 * D8 — the gear UPGRADE / refine structure (how a GearInstance levels up). STRUCTURE / ALGO ONLY.
 *
 * GUARDRAILS:
 *  - INERT WHILE HELD: the per-level power gain (`UPGRADE_RATE`) is held at 0 and the multiplier ceiling
 *    (`UPGRADE_CAP`) at the identity 1 ⇒ `upgradeMultiplier` is always 1 (×1 ⇒ no effect, composeGear-
 *    style). The level cap (`UPGRADE_MAX_LEVEL`) is held at -1 ⇒ `upgradeGearInstance` returns null (no
 *    upgrade possible) until D15 sets the cap.
 *  - TESTABLE: the pure formulas take the rate/cap/max as optional params (default = the held consts), so
 *    the algo is provable with INJECTED non-held values, independent of the held defaults.
 *  - PURE / DETERMINISTIC: no RNG, no mutation (returns a fresh instance). BUILD-ON gearModel.GearInstance.
 *  - UNCONSUMED ⇒ byte-identical (the compose-into-gear wire is the parked slice-1b). NO authored number —
 *    the held consts below are sentinels (0 / identity 1 / -1); a leaked value fails the inert contracts.
 */

const UPGRADE_RATE = 0;        // [HELD] per-level power gain (D15)
const UPGRADE_CAP = 1;         // [HELD] multiplier ceiling — 1 ⇒ inert (D15)
const UPGRADE_MAX_LEVEL = -1;  // [HELD] level cap — -1 ⇒ no upgrade, inert (D15)

/** The power multiplier from an item's upgrade level. Held rate/cap ⇒ identity 1 (inert). Pure. */
export function upgradeMultiplier(level: number, rate: number = UPGRADE_RATE, cap: number = UPGRADE_CAP): number {
  return Math.min(cap, 1 + rate * Math.max(0, level));
}

/** Whether the instance can be upgraded further. Held max (-1) ⇒ false (inert). */
export function canUpgrade(instance: GearInstance, maxLevel: number = UPGRADE_MAX_LEVEL): boolean {
  if (maxLevel < 0) return false; // HELD ⇒ inert
  return (instance.upgradeLevel ?? 0) < maxLevel;
}

/** Upgrade the instance by one level (pure; fresh instance), or null if not upgradeable. */
export function upgradeGearInstance(instance: GearInstance, maxLevel: number = UPGRADE_MAX_LEVEL): GearInstance | null {
  if (!canUpgrade(instance, maxLevel)) return null;
  return { ...instance, upgradeLevel: (instance.upgradeLevel ?? 0) + 1 };
}
