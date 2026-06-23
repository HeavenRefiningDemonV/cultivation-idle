import type { ElementStateId, ElementTuning } from './elementTypes.js';
import type { EnemyElementStates } from './elementCombatReactions.js';

/**
 * D11 slice 3b-iii (control / CC) — the hard-CC SKIP-TURN gate. A player hit can write a control
 * affliction onto the enemy (`category:'control'`); the two HARD locks — `frozen` (ice escalation) and
 * `petrified` (earth escalation) — should cost the enemy its turn (player freezes enemy → enemy can't
 * act). This resolves whether the enemy's pending attack is skipped.
 *
 * SCOPE / DISCIPLINE:
 *  - INERT BY DESIGN. The held `controlSkipChance` ships at 0 ⇒ this NEVER skips a turn ⇒ flag-on combat
 *    is byte-identical until D15 deposits a value. (Not live-provisional, unlike 3b-ii ICD — see the
 *    tuning comment: no honest enemy Stagger/CC-Resist denominator exists, and refresh-not-stack would
 *    perma-lock the enemy under sustained attack. Both are D15's to resolve before a non-zero value.)
 *  - HARD-CC ONLY (`frozen`/`petrified`). Soft-CC (`slowed`/`gravityBound` action-rate reduction) is a
 *    later slice; gating only the hard subset keeps this forward-correct (no soft state is mismodeled).
 *  - LAZY RNG (preserve-first): the injected `rng` is called ONLY when a skip could actually fire
 *    (engine on AND chance > 0 AND a hard-control present). With the held 0, or no control, or flag-off,
 *    `rng` is never called — so the combat RNG draw stream is unperturbed and flag-on stays byte-identical.
 *  - PURE: no mutation, no module-level RNG (the caller injects `Math.random`; contracts inject a stub).
 *  - FROZEN CORE untouched: the caller uses this to GATE the attack (skip), never to change the formula.
 */

const HARD_CONTROL: ReadonlySet<ElementStateId> = new Set<ElementStateId>(['frozen', 'petrified']);

export interface EnemyControlSkip {
  readonly skip: boolean;
  readonly reason: ElementStateId | null; // the hard-control state that locked the enemy (for the log)
}

const NO_SKIP: EnemyControlSkip = { skip: false, reason: null };

export function resolveEnemyControlSkip(input: {
  states: EnemyElementStates;
  engineActive: boolean;
  tuning: ElementTuning;
  rng: () => number; // [0,1); called lazily, only when a skip could fire
}): EnemyControlSkip {
  if (!input.engineActive) return NO_SKIP; // preserve-first
  const chance = input.tuning.controlSkipChance;
  if (chance <= 0) return NO_SKIP; // HELD 0 ⇒ never skips, never draws ⇒ RNG stream preserved
  const lock = input.states.active.find((s) => s.remainingMs > 0 && HARD_CONTROL.has(s.state));
  if (!lock) return NO_SKIP; // no hard-control present ⇒ never draws
  // a skip could fire — only NOW do we consume a roll.
  return input.rng() < chance ? { skip: true, reason: lock.state } : NO_SKIP;
}
