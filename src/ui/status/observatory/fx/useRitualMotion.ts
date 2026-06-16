import { useFxQuality } from '../../../fx/FxQualityProvider.js';
import type { FxEffectiveQuality } from '../../../fx/types.js';

/**
 * Real effective-quality union, re-exported from the FX provider so the
 * observatory fx layer never invents its own tier names.
 * ('high' | 'medium' | 'low' | 'reducedMotion')
 */
export type RitualMotionQuality = FxEffectiveQuality;

export interface RitualMotion {
  /** true => render animated forms; false => render the static equivalents. */
  animate: boolean;
  /** effective quality tier from FxQualityProvider. */
  quality: RitualMotionQuality;
  /** animate && quality is rich enough for motes / glints / sweeps. */
  flourish: boolean;
}

/**
 * The single motion-governance hook for the observatory fx layer.
 *
 * FxQualityProvider already owns the `(prefers-reduced-motion: reduce)`
 * matchMedia listener and exposes a resolved `prefersReducedMotion` plus an
 * `effectiveQuality` that collapses to `'reducedMotion'` when motion is
 * reduced. We consume those directly instead of duplicating the media query,
 * so no primitive touches matchMedia or the provider on its own.
 */
export function useRitualMotion(): RitualMotion {
  const { prefersReducedMotion, effectiveQuality } = useFxQuality();
  // Ambient motion runs ONLY on the explicit 'high' tier. The default tier
  // resolves to 'medium', whose scene budget already declares a quiet board
  // (allowFilters:false, continuousAtmosphere:'sparse') — yet ~10 instruments
  // emit ~12 infinite keyframe loops across 70+ SVG elements, which composite
  // and repaint EVERY frame while the menu sits idle. That always-on paint is
  // the dominant cause of the menu feeling laggy on normal hardware. Gating to
  // 'high' freezes the board to its static painterly forms on the default tier
  // (doctrine-safe — no meaning is motion-only); capable users can opt back into
  // motion via the high quality tier. 'low'/'reducedMotion' stay static too.
  const animate = !prefersReducedMotion && effectiveQuality === 'high';
  const flourish = animate && effectiveQuality !== 'low';
  return { animate, quality: effectiveQuality, flourish };
}
