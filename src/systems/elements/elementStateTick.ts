import type { ElementStateInstance, ElementStateId, ElementTuning } from './elementTypes.js';
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
  const icd = input.states.icdByPathway;
  const hasIcd = icd !== undefined && Object.keys(icd).length > 0;
  // fast-path: nothing to age (no afflictions AND no live ICD) ⇒ same-ref ⇒ the store does not write.
  if (active.length === 0 && !hasIcd) return input.states;

  const survivors: ElementStateInstance[] = [];
  for (const s of active) {
    const remainingMs = s.remainingMs - input.elapsedMs;
    if (remainingMs > 0) survivors.push({ ...s, remainingMs });
  }
  // 3b-ii — decay each reaction's ICD by the elapsed time; drop the elapsed (the reaction can re-fire).
  let nextIcd: Record<string, number> | undefined;
  if (hasIcd) {
    const decayed: Record<string, number> = {};
    for (const key of Object.keys(icd)) {
      const remaining = (icd[key] ?? 0) - input.elapsedMs;
      if (remaining > 0) decayed[key] = remaining;
    }
    if (Object.keys(decayed).length > 0) nextIcd = decayed;
  }
  const result: EnemyElementStates = { active: survivors };
  if (nextIcd) result.icdByPathway = nextIcd;
  if (input.states.shredResistDelta) result.shredResistDelta = input.states.shredResistDelta; // persists (no decay)
  return result;
}

export interface ElementStateTickResult {
  /** the afflictions after aging + DoT-accumulator advance (drop the expired) */
  readonly survivingStates: EnemyElementStates;
  /** total HP to subtract this frame from DoT-category afflictions (0 if flag-off / no dot / coeff 0) */
  readonly dotDamage: number;
  /** per-affliction DoT breakdown (for the log / contracts); empty unless a tick fired */
  readonly dotEvents: ReadonlyArray<{ readonly state: ElementStateId; readonly amount: number }>;
}

const EMPTY_TICK = (states: EnemyElementStates): ElementStateTickResult => ({ survivingStates: states, dotDamage: 0, dotEvents: [] });

/**
 * D11 slice 3b-i — the full per-tick step: age + expire every affliction (3b-0), then apply the only
 * effect family this slice consumes — DAMAGE-OVER-TIME on `category:'dot'` afflictions — as a number the
 * STORE subtracts as its own event (never folded into the frozen-core attack formula).
 *
 * The DoT model (per the design review's fixes):
 *  - Driven by the written `category:'dot'` STATE (e.g. `burning`), NOT the `dot` reaction effect.
 *  - TRUE interval-accumulator cadence: each affliction carries `accMs`; every `dotTickIntervalMs` of
 *    elapsed time emits one discrete tick of `dotTickCoeff × intensity × realmScalar`. NOT frame-rate-
 *    coupled — a large `elapsedMs` (tab-throttle) emits the right number of whole ticks, no double-count.
 *  - `dotTickCoeff` is HELD at 0 ⇒ this layer is INERT today (returns the pure 3b-0 expiry result with
 *    zero damage). When D15 deposits a coefficient, DoT activates end-to-end with no logic change.
 *  - PRESERVE-FIRST / PARITY-SAFE: flag-off or no afflictions ⇒ same-ref expiry result, zero damage.
 *    PURE — fresh arrays/instances, no mutation, no RNG.
 *
 * `realm` is the 1-based realm (already `realm.index + 1`); `realmScalar = max(1, realm)` and nothing else.
 */
export function tickEnemyElementStates(input: {
  states: EnemyElementStates;
  elapsedMs: number;
  realm: number;
  engineActive: boolean;
  tuning: ElementTuning;
}): ElementStateTickResult {
  const survivingStates = expireEnemyElementStates({
    states: input.states,
    elapsedMs: input.elapsedMs,
    engineActive: input.engineActive,
  });
  // flag-off / no afflictions ⇒ expiry returned the same ref ⇒ no DoT possible.
  if (survivingStates === input.states) return EMPTY_TICK(survivingStates);

  const coeff = input.tuning.dotTickCoeff;
  const intervalMs = input.tuning.dotTickIntervalMs;
  // held-inert (coeff 0) ⇒ expiry only, exactly the 3b-0 result. No accumulator churn.
  if (coeff <= 0 || intervalMs <= 0) return EMPTY_TICK(survivingStates);

  const realmScalar = Math.max(1, input.realm);
  let dotDamage = 0;
  const dotEvents: Array<{ state: ElementStateId; amount: number }> = [];
  const active = survivingStates.active.map((s) => {
    if (s.category !== 'dot') return s;
    const acc = (s.accMs ?? 0) + input.elapsedMs;
    const ticks = Math.floor(acc / intervalMs);
    if (ticks > 0) {
      const amount = coeff * s.intensity * realmScalar * ticks;
      dotDamage += amount;
      dotEvents.push({ state: s.state, amount });
    }
    return { ...s, accMs: acc - ticks * intervalMs };
  });
  // preserve the (already-decayed) ICD map + the persistent shred delta alongside the DoT-advanced states.
  const survivingStatesOut: EnemyElementStates = { active };
  if (survivingStates.icdByPathway) survivingStatesOut.icdByPathway = survivingStates.icdByPathway;
  if (survivingStates.shredResistDelta) survivingStatesOut.shredResistDelta = survivingStates.shredResistDelta;
  return { survivingStates: survivingStatesOut, dotDamage, dotEvents };
}
