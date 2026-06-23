import type { ElementId, ElementWeights, ElementTuning } from './elementTypes.js';
import type { EnemyDefinition } from '../../types/index.js';
import { ZERO_ELEMENT_WEIGHTS } from './elementCombatAffinity.js';
import { resolveResist } from './elementResolver.js';
import { derivedRealmScalar } from '../meridians/derivedStats.js';

/**
 * D11 / Enemy-Derived-Layer — the RESOLVER SEAM (packet: docs/cultivation/enemy-derived-layer-packet.md).
 *
 * Exposes an enemy's defensive profile (Stagger/CC-Resist + per-element resist) through ONE pure resolver,
 * backed TODAY by a flat / realm-scaled stub (every base HELD 0). The SIGNATURE is the stable contract:
 * a future symmetric enemy derived snapshot backs the SAME function — swap only the body — with ZERO combat
 * re-port. "Stub the value, not the contract." Pure / leaf; the caller injects realm / flag / tuning.
 *
 * SLICE A (this): the seam + shape + flat stub, UNCONSUMED. Nothing in combat reads it yet (the control
 * roll is Slice B, shred is Slice C). With every base HELD 0 the profile is neutral ⇒ flag-on
 * byte-identical; flag-off returns INERT. PURE — frozen results, no mutation, no store reads, no RNG.
 */
export interface EnemyDefensiveProfile {
  readonly staggerResist: number;            // flat scalar: hard-CC control-roll denominator (vs player controlPower)
  readonly ccResist: number;                 // flat scalar: soft-CC / future control denominator
  readonly resistByElement: ElementWeights;  // the per-element resist vector (same shape as player weights)
}

export const INERT_ENEMY_DEFENSE: EnemyDefensiveProfile = Object.freeze({
  staggerResist: 0,
  ccResist: 0,
  resistByElement: ZERO_ELEMENT_WEIGHTS,
});

/** The enemy twin of `buildPlayerElementWeights`: the enemy's element carries the held per-element resist base. */
export function buildEnemyElementWeights(element: ElementId | null | undefined, tuning: ElementTuning): ElementWeights {
  if (!element) return ZERO_ELEMENT_WEIGHTS;
  return Object.freeze({ ...ZERO_ELEMENT_WEIGHTS, [element]: tuning.enemyElementResistBase });
}

/**
 * Resolve an enemy's defensive profile. Flag-off ⇒ INERT (byte-identical). Flag-on ⇒ a flat base × the
 * SAME realm ladder the player derived layer uses; with the bases HELD 0 the profile is neutral. The
 * whole `enemy` is taken (not destructured) so a future symmetric snapshot can read richer fields without
 * a signature change.
 */
export function resolveEnemyDefensiveProfile(input: {
  enemy: EnemyDefinition;
  realm: number;        // 1..7 (= realm.index + 1)
  engineActive: boolean;
  tuning: ElementTuning;
}): EnemyDefensiveProfile {
  if (!input.engineActive) return INERT_ENEMY_DEFENSE; // preserve-first
  const scalar = derivedRealmScalar(input.realm);      // ρ=5 ladder, shared with the player derived layer
  return Object.freeze({
    staggerResist: input.tuning.enemyStaggerBase * scalar,
    ccResist: input.tuning.enemyCcResistBase * scalar,
    resistByElement: buildEnemyElementWeights(input.enemy.element, input.tuning),
  });
}

/**
 * D11 Slice C — the enemy's resist fraction to the player's incoming element, AFTER shred lowers it.
 * Mirrors `resolvePlayerElementResist` (the same generic `resolveResist` saturating curve, no-immunity
 * floor enforced in code). Flag-off / no element ⇒ 0. With `enemyElementResistBase` + shred held 0 the
 * resist is 0 ⇒ the caller's `1 − fraction` multiplier is 1 ⇒ byte-identical. Pure.
 */
export function resolveEnemyElementResist(input: {
  enemy: EnemyDefinition;
  incomingElement: ElementId | null | undefined; // the player's applied element
  realm: number;
  engineActive: boolean;
  shredResistDelta: number;                       // accumulated shred (reduces resist, pre-curve)
  tuning: ElementTuning;
}): number {
  if (!input.engineActive || !input.incomingElement) return 0;
  const profile = resolveEnemyDefensiveProfile({ enemy: input.enemy, realm: input.realm, engineActive: input.engineActive, tuning: input.tuning });
  const shredded: ElementWeights = Object.freeze({
    ...profile.resistByElement,
    [input.incomingElement]: Math.max(0, (profile.resistByElement[input.incomingElement] ?? 0) - Math.max(0, input.shredResistDelta)),
  });
  return resolveResist(shredded, input.incomingElement, { realm: Math.max(1, input.realm) }, input.tuning, input.incomingElement);
}
