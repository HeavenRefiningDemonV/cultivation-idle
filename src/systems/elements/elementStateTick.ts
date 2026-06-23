import type { ElementStateInstance } from './elementTypes.js';
import type { EnemyElementStates } from './elementCombatReactions.js';

/**
 * D11 slice 3b-0 — the per-tick LIFECYCLE of enemy element afflictions: decrement each written state's
 * `remainingMs` by the elapsed time and drop the expired ones. This is the universal foundation every
 * later effect family (DoT damage, control/CC, spread, …) builds on — a written affliction must decay
 * and fade, exactly as a combat buff does.
 *
 * SCOPE (this slice) / DISCIPLINE:
 *  - EXPIRY ONLY. No effect is APPLIED yet — no DoT damage, no CC, no events. DoT-damage application
 *    (which needs a proper interval-accumulator model + a D15-HELD per-tick coefficient) is the NEXT
 *    slice; lifting it out keeps this slice minimal and free of the frame-rate-coupling / dot-state-vs-
 *    dot-reaction pitfalls the design review flagged.
 *  - NO NEW MAGNITUDE: decrement uses the elapsed `deltaTime` already driving the tick heartbeat and the
 *    `remainingMs` the state was written with (`stateBaseDurationMs`, set on write). Nothing authored.
 *  - PRESERVE-FIRST: flag-off ⇒ returns the input states unchanged (and flag-off, nothing is ever
 *    written, so the input is the frozen empty set). Same-ref return ⇒ the store performs no `set`.
 *  - PARITY-SAFE: flag-on, expiry changes nothing observable in combat (the states still DO nothing this
 *    slice), so the stat-engine parity baseline is untouched. PURE — fresh arrays/instances, no mutation.
 *
 * Mirrors the live combat-buff sweep (`combatStore.tick`: `combatBuffs.filter(b => b.endsAt > now)`).
 */
export function expireEnemyElementStates(input: {
  states: EnemyElementStates;
  elapsedMs: number;
  engineActive: boolean;
}): EnemyElementStates {
  // preserve-first: with the engine off, the affliction lifecycle is inert (and nothing was written).
  if (!input.engineActive) return input.states;
  const active = input.states.active;
  // fast-path: no afflictions ⇒ nothing to age (same-ref return ⇒ the store does not write).
  if (active.length === 0) return input.states;

  const survivors: ElementStateInstance[] = [];
  for (const s of active) {
    const remainingMs = s.remainingMs - input.elapsedMs;
    if (remainingMs > 0) survivors.push({ ...s, remainingMs });
  }
  return { active: survivors };
}
