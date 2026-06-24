import { isDerivedStatEngineAuthoritative, isForceLegacy } from '../meridians/statEngineFlag.js';
import { useTrainingStore } from '../../stores/trainingStore.js';
import { elementAffinityDamageMultiplier, resolvePlayerElementAffinity } from '../elements/elementCombatAffinity.js';
import { ELEMENT_ROSTER } from '../elements/elementCatalog.js';
import type { ElementId } from '../elements/elementTypes.js';
import type { TechniqueDef } from '../../content/types.js';
import type { TechniqueDerivedScalingInput } from './techniqueScalingResolver.js';

/**
 * M.IV.1 ARTS-MECH / Step 3 — the flag-gated seam that re-points technique scaling at the LIVE derived layer.
 *
 * NOT pure (reads the training store + the flag), so it lives at the store/seam boundary — exactly mirroring
 * toEquipmentGearInput / toBreakthroughRiskStatInput. When the derived engine is OFF (or forceLegacy), it
 * returns null and the resolver falls back to the legacy path-filtered tri-stat (BYTE-IDENTICAL). When ON, it
 * supplies the full canonical `statRatingsById` (the same source the Court/breakthrough read) + the F3 element
 * affinity edge for elemental arts (D17 step 7: "elemental arts query the F3 resolver"). Magnitudes HELD → D15.
 */

const ELEMENT_IDS = new Set<string>(ELEMENT_ROSTER.map((entry) => entry.id));

function normalizeElement(id: string | null | undefined): ElementId | null {
  return id && ELEMENT_IDS.has(id) ? (id as ElementId) : null;
}

export interface BuildTechniqueDerivedScalingInput {
  technique?: TechniqueDef | null;
  /** the realm cap to scale against — the same value the legacy `trainingSnapshot.realmCap` uses (byte-identical for in-path stats). */
  cap: number;
  /** the player's spirit-root element (for the F3 query); a non-element string ⇒ inert. */
  rootElementId?: string | null;
  realm: number;
  /** the enemy element, if known (a favourable matchup presses affinity) — D11 slice 2. */
  targetElement?: string | null;
}

export function buildTechniqueDerivedScaling(
  input: BuildTechniqueDerivedScalingInput,
): TechniqueDerivedScalingInput | null {
  // Flag-gate: forceLegacy always wins; off ⇒ null ⇒ legacy (byte-identical).
  if (isForceLegacy() || !isDerivedStatEngineAuthoritative()) return null;

  const statRatingsById = { ...(useTrainingStore.getState().statRatingsById ?? {}) };

  // F3 — only ELEMENTAL arts (those with rootAffinityIds) query the resolver; others get no edge (mult 1).
  const isElemental = (input.technique?.rootAffinityIds?.length ?? 0) > 0;
  const elementAffinityMult = isElemental
    ? elementAffinityDamageMultiplier(
        resolvePlayerElementAffinity({
          rootElement: normalizeElement(input.rootElementId),
          realm: input.realm,
          engineActive: true,
          targetElement: normalizeElement(input.targetElement),
        }),
      )
    : 1;

  return { statRatingsById, cap: input.cap, elementAffinityMult };
}
