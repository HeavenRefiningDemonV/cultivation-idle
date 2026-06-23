import type { DerivedStatInput, DerivedSourceKey } from './derivedStats.js';

/**
 * B-STATS — the 7-axis Focus EMPHASIS engine (D2 §2.3). The Seat's focus pick
 * (`uiStore.cultivationFocusAxis`) biases which Tier-1 cultivation axes (and, for Body, the Tier-0
 * Mortal Foundation) grow faster, so the dial stops collapsing to the 3 legacy FOCUS_MODE_MODIFIERS
 * modes and becomes a real build lever feeding the derived stat engine.
 *
 * Option A — pre-resolver SOURCE bias, PRESERVE-FIRST: scale the emphasized derived source(s) by
 * (1 + FOCUS_EMPHASIS_PRIMARY) BEFORE `computeDerivedStats`. The 3-mode `FOCUS_MODE_MODIFIERS` path is
 * NOT touched — it stays the flag-off legacy path (and its locked `focusBreathSemantics` contract
 * holds). This layer only rides the derived (`?statEngine=1`) path, via `toDerivedStatInput`.
 *
 * COEFFICIENT OWNERSHIP (HELD, exactly like B-MERID + the Seat truthful-now pass): the focus
 * multiplier is D15/F-BAL-owned — `[tune] → D15 focusMultiplier_primary` (LEAN; no value in any doc).
 * We ship `FOCUS_EMPHASIS_PRIMARY = 0`, so `applyFocusEmphasis` is the IDENTITY: the structure + the
 * per-axis MAPPING land with ZERO balance impact and the derived-path parity stays EXACT. F-BAL flips
 * the number (a one-line change here); the dial becomes mechanically real then. The mapping — which
 * spoke biases which source — is the real, fixed contract; only the magnitude is deferred.
 */

/** [tune → D15 focusMultiplier_primary] — HELD inert so the wiring is parity-safe until the balance pass. */
export const FOCUS_EMPHASIS_PRIMARY = 0;

/**
 * The 7 Seat focus spokes → the derived source(s) each emphasizes (D2 §2.3 vocabulary reconciliation).
 * Six map cleanly to the six Tier-1 AxisKeys; `body` is Tier-0 Mortal Foundation (physique + vitality),
 * not a Tier-1 axis — so it biases the foundation sources, keeping the dial's 7th spoke meaningful.
 */
export const FOCUS_AXIS_SOURCE_MAP: Record<string, readonly DerivedSourceKey[]> = {
  qiPool: ['qiPool'],
  qiPurity: ['qiPurity'],
  spiritualSense: ['spiritualSense'],
  soulStrength: ['soulStrength'],
  meridian: ['meridianOpenness'],
  dao: ['daoComprehension'],
  body: ['physique', 'vitality'],
};

/** The emphasized source keys for a focus pick (empty for null / unknown / Balanced — no bias). */
export function focusEmphasisSources(focusAxisId: string | null | undefined): readonly DerivedSourceKey[] {
  if (!focusAxisId) return [];
  return FOCUS_AXIS_SOURCE_MAP[focusAxisId] ?? [];
}

/**
 * PURE — scale the given derived sources by `scale`, returning a COPY (identity when scale===1 or no
 * sources). This is the mechanism the emphasis engine applies; tested directly so the structure is
 * verified even while the live coefficient is held at 0.
 */
export function scaleEmphasisSources(
  input: DerivedStatInput,
  sources: readonly DerivedSourceKey[],
  scale: number,
): DerivedStatInput {
  if (sources.length === 0 || scale === 1) return input;
  const foundation = { ...input.foundation };
  const axes = { ...input.axes };
  for (const key of sources) {
    if (key in axes) (axes as Record<string, number>)[key] *= scale;
    else if (key in foundation) (foundation as Record<string, number>)[key] *= scale;
  }
  return { ...input, foundation, axes };
}

/**
 * Return the derived input with the focus-emphasised source(s) scaled by (1 + FOCUS_EMPHASIS_PRIMARY).
 * IDENTITY today (coefficient 0) and for null/unknown picks — so it is exact-parity-safe.
 */
export function applyFocusEmphasis(input: DerivedStatInput, focusAxisId: string | null | undefined): DerivedStatInput {
  return scaleEmphasisSources(input, focusEmphasisSources(focusAxisId), 1 + FOCUS_EMPHASIS_PRIMARY);
}
