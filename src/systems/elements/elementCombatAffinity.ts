import { resolveAffinity, resolveResist } from './elementResolver.js';
import { ELEMENT_ROSTER } from './elementCatalog.js';
import { DEFAULT_ELEMENT_TUNING } from './elementTuning.js';
import type { AffinityResult, ElementId, ElementWeights } from './elementTypes.js';

/**
 * B-ELEM (D16 packet #08) — stand up the F3 element resolver as a COMBAT-QUERYABLE seam.
 *
 * The resolver (`elementResolver.ts`) is pure and complete but had zero production callers — "it
 * COMPUTES; D11 APPLIES." This module is the offensive-affinity read seam the combat layer (D-COMBAT)
 * will query: it assembles the player's element-weight vector and returns the soft-capped affinity
 * that combat folds in as `× (1 + effective)`.
 *
 * SCOPE / DISCIPLINE (the canon boundary):
 *  - APPLICATION is D-COMBAT's, NOT B-ELEM's (D16 §F.1: "B-ELEM provides the resolver; D-COMBAT calls
 *    it"). This module RETURNS the affinity; it never multiplies a damage number. The frozen damage
 *    core `ATK×(1−DEF/(DEF+K))` is untouched.
 *  - Engine-gated + preserve-first: callers pass `engineActive` (the derived-engine flag); when off,
 *    `resolvePlayerElementAffinity` returns the INERT result (effective 0 ⇒ `× (1+0)` ⇒ byte-identical).
 *  - Magnitudes HELD: every `DEFAULT_ELEMENT_TUNING` value is a D15/F-BAL-owned balance placeholder
 *    (F3 owns the SHAPE + caps; D15 owns the VALUES). B-ELEM CONSUMES the tuning, never retunes it.
 *  - First slice = root-element weights only; technique / gear / law affinity leans are D7/D8/D10.
 *    Counter matchup + resist need an enemy element (EnemyDefinition has none yet) → deferred.
 *
 * PURE: the flag and the root element are parameters, so the whole seam is deterministic and unit-
 * testable without stores or a browser. D-COMBAT supplies the live root + flag at the call site.
 */

/** The 14-entry zero vector (the resolver reads `weights[el] ?? 0`, but a full record keeps the type honest). */
export const ZERO_ELEMENT_WEIGHTS: ElementWeights = Object.freeze(
  Object.fromEntries(ELEMENT_ROSTER.map((e) => [e.id, 0])) as Record<ElementId, number>,
);

/** What combat reads when the derived engine is off (legacy) — no affinity, byte-identical damage. */
export const INERT_AFFINITY: AffinityResult = Object.freeze({
  element: ELEMENT_ROSTER[0].id,
  effective: 0,
  resonanceBonus: 0,
  counterDelta: 0,
});

/**
 * Assemble the player's element-weight vector. First slice = full weight on the spirit-root element;
 * everything else 0. (Technique/gear/law leans layer in later packets.)
 */
export function buildPlayerElementWeights(rootElement: ElementId | null | undefined): ElementWeights {
  if (!rootElement) return ZERO_ELEMENT_WEIGHTS;
  return Object.freeze({ ...ZERO_ELEMENT_WEIGHTS, [rootElement]: 1 });
}

/**
 * The offensive element affinity for a combat hit. INERT (effective 0) when the derived engine is off
 * or there is no root element — so combat stays byte-identical. Otherwise the F3 resolver's soft-capped
 * affinity (no targetElement in this slice ⇒ no counter delta, no resist). D-COMBAT applies it.
 */
export function resolvePlayerElementAffinity(input: {
  rootElement: ElementId | null | undefined;
  realm: number;
  engineActive: boolean;
  /** D11 slice 2 — the target (enemy) element, so a favourable matchup presses affinity and an
   *  unfavourable one is blunted (never nullified). Omitted ⇒ no counter delta. */
  targetElement?: ElementId | null;
}): AffinityResult {
  if (!input.engineActive || !input.rootElement) return INERT_AFFINITY;
  return resolveAffinity(
    buildPlayerElementWeights(input.rootElement),
    input.rootElement,
    { realm: Math.max(1, input.realm) },
    DEFAULT_ELEMENT_TUNING,
    input.targetElement ?? undefined,
  );
}

/**
 * D11 slice 2 — the player's defensive RESIST fraction vs an incoming (enemy) element, in [0, hardcap)
 * (hardcap < 1 always — no immunity). 0 when the engine is off, or there is no incoming element, or no
 * root element. The element tuning (incl. the 75% cap) is D15/F-BAL-held; consumed, never authored.
 */
export function resolvePlayerElementResist(input: {
  rootElement: ElementId | null | undefined;
  incomingElement: ElementId | null | undefined;
  realm: number;
  engineActive: boolean;
}): number {
  if (!input.engineActive || !input.incomingElement || !input.rootElement) return 0;
  return resolveResist(
    buildPlayerElementWeights(input.rootElement),
    input.incomingElement,
    { realm: Math.max(1, input.realm) },
    DEFAULT_ELEMENT_TUNING,
    input.incomingElement,
  );
}

/**
 * D-COMBAT (D11) APPLICATION — the offensive affinity as an outgoing-damage multiplier `× (1 + effective)`
 * (D3 §6.1: affinity "feeds D2's × (1 + Σ)"). INERT affinity ⇒ ×1 ⇒ byte-identical legacy. Composes
 * alongside the existing damage multipliers (talisman / heart-law / crit / root / momentum), NEVER inside
 * the frozen `ATK×(1−DEF/(DEF+K))` core. Negative effective is floored so it can't reduce below base.
 */
export function elementAffinityDamageMultiplier(affinity: AffinityResult): number {
  return 1 + Math.max(0, affinity.effective);
}

/**
 * D-COMBAT (D11) APPLICATION — the resist fraction as an incoming-damage multiplier `× (1 − fraction)`
 * (D3 §6.2). fraction 0 ⇒ ×1 ⇒ byte-identical. The fraction is already hard-capped < 1 by the resolver,
 * so this is always in (0, 1] — incoming damage is reduced, never erased (the no-immunity floor).
 */
export function elementResistDamageMultiplier(resistFraction: number): number {
  return 1 - Math.min(Math.max(0, resistFraction), 0.99);
}
