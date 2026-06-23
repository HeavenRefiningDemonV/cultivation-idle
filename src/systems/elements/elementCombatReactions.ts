import { resolveState, resolveReaction } from './elementResolver.js';
import { ZERO_ELEMENT_WEIGHTS } from './elementCombatAffinity.js';
import { DEFAULT_ELEMENT_TUNING } from './elementTuning.js';
import type { ElementId, ElementStateInstance, StateDelta, TargetElementState } from './elementTypes.js';

/**
 * D11 slice 3 — the element REACTION & STATE combo system, made live in combat.
 *
 * The F3 resolver computes the affliction a hit writes (`resolveState`) and the highest-priority combo
 * it triggers (`resolveReaction`); it never applies them. This is the combat-layer application: each
 * player hit applies its element's signature state to the enemy and fires any eligible reaction.
 *
 * SCOPE (slice 3a) / DISCIPLINE:
 *  - INSTANT reaction effects only — `burst`/`sever` add flat bonus damage now. dot / control / spread /
 *    drain / tempo / cleanse / catalyst need a tick / CC / status pipeline → slice 3b (explicit TODO).
 *  - No ICD gating and no time-expiry yet (states persist the fight, refresh-not-stack) → slice 3b.
 *  - Engine-gated + preserve-first: INERT when off (no state change, 0 bonus) ⇒ combat byte-identical.
 *  - Magnitudes HELD: reactionBase / sever & burst caps / state duration / intensity / escalation are
 *    all `DEFAULT_ELEMENT_TUNING` (D15/F-BAL-owned) — consumed, never authored.
 *  - PAYOFF NOTE: a mono-element player mostly triggers same-element reactions; the rich cross-element
 *    combos need multi-element application (techniques, D7). The STRUCTURE is complete regardless.
 *
 * PURE: the flag + the applied element + the prior states are inputs ⇒ deterministic, unit-testable.
 */

/**
 * The transient element states on an enemy this encounter (never saved; reset each combat). The array
 * is mutable-TYPED (so it can live in an immer combat-state draft), but the resolver/helper never
 * mutates it — every step returns a fresh array (purity is by construction, asserted in the contract).
 */
export interface EnemyElementStates {
  active: ElementStateInstance[];
}
export const EMPTY_ENEMY_ELEMENT_STATES: EnemyElementStates = Object.freeze({ active: [] });

export interface ElementHitOutcome {
  readonly states: EnemyElementStates; // the updated enemy states after this hit
  readonly bonusDamage: number;        // instant burst/sever reaction damage (0 otherwise)
  readonly reactionLabel: string | null; // the fired reaction's label, for the combat log / UI
}

const INERT = (states: EnemyElementStates): ElementHitOutcome => ({ states, bonusDamage: 0, reactionLabel: null });

/** Apply a StateDelta under refresh-not-stack (R2) + bounded intensity (R3); escalation swaps the state id. */
function applyStateDelta(active: readonly ElementStateInstance[], delta: StateDelta | null): ElementStateInstance[] {
  if (!delta) return [...active];
  const resultId = delta.escalatedTo ?? delta.stateId;
  const others = active.filter((s) => s.state !== delta.stateId && s.state !== resultId);
  return [...others, { state: resultId, category: delta.category, remainingMs: delta.refreshMs, intensity: delta.intensity }];
}

/**
 * Resolve one player hit's element step: fire any eligible reaction on the enemy's CURRENT states, then
 * apply/refresh the applied element's signature state. Returns the updated states + instant bonus damage.
 */
export function stepEnemyElementOnHit(input: {
  appliedElement: ElementId | null | undefined;
  states: EnemyElementStates;
  realm: number;
  engineActive: boolean;
}): ElementHitOutcome {
  if (!input.engineActive || !input.appliedElement) return INERT(input.states);

  const target: TargetElementState = {
    resistByElement: ZERO_ELEMENT_WEIGHTS,
    soulDefense: 0,
    activeStates: input.states.active,
    icdByPathway: {}, // slice 3a: no ICD gating yet (slice 3b)
  };
  const ctx = { realm: Math.max(1, input.realm) };

  // 1. the reaction fires on the states present BEFORE this hit's state is written.
  const reaction = resolveReaction(input.appliedElement, target, ctx, DEFAULT_ELEMENT_TUNING);
  const bonusDamage =
    reaction && (reaction.effect.kind === 'burst' || reaction.effect.kind === 'sever')
      ? Math.max(0, reaction.effect.amount)
      : 0;

  // 2. apply/refresh this element's signature affliction.
  const delta = resolveState(input.appliedElement, target, ctx, DEFAULT_ELEMENT_TUNING);
  return { states: { active: applyStateDelta(input.states.active, delta) }, bonusDamage, reactionLabel: reaction?.label ?? null };
}
