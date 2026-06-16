import type { CSSProperties } from 'react';
import type { TemperingCourtSurface } from '../../../systems/meridians/index.js';

/**
 * W9 — the artifact's 4 motion CSS custom props (§1.8), computed from the render-only
 * surface. The artifact's setMotion() sets these on #room; here we set them on the
 * stage so both the Room (qi-flow / dantian breath) and the forge bar read them.
 *
 *   --th-fill-p    active meridian fill ratio (rating / cap)          [latent in artifact too]
 *   --th-qi-dur    qi-flow keyframe duration — faster as tempo rises  (.qiflow consumes it)
 *   --th-breath-dur dantian breath duration — faster as tempo rises   (.breatheA consumes it)
 *   --th-heat      forge heat 0..1 (fatigue / 100)                    [latent in artifact too]
 *
 * Formulas are ported verbatim from the artifact (qiDur / breath-dur / heat / fill-p).
 * Render-only: the values come straight off the surface. The LIVE narrow-vitals
 * subscription that re-sets --th-fill-p every tick without re-rendering the tree is the
 * artifact's setInterval(...,250) — wired on the flag-gated live path at W13.
 */

/** Artifact qiDur(m): 3.0 − clamp(m, 0.5, 2.25) × 0.8 seconds (higher tempo → faster). */
export function courtQiDurSeconds(mult: number): number {
  return Number((3.0 - Math.min(2.25, Math.max(0.5, mult)) * 0.8).toFixed(2));
}

/** Artifact breath-dur: 6.8 − min(1, m/2.25) × 2.4 seconds (higher tempo → faster). */
export function courtBreathDurSeconds(mult: number): number {
  return Number((6.8 - Math.min(1, mult / 2.25) * 2.4).toFixed(2));
}

/** Active meridian fill ratio (rating / cap), clamped to [0, 1]; 0 when no active meridian. */
export function courtFillProgress(surface: TemperingCourtSurface): number {
  const active = surface.activeMeridian;
  if (!active || active.cap <= 0) return 0;
  return Math.min(1, Math.max(0, active.rating / active.cap));
}

/** Forge heat as 0..1 (fatigue / 100), clamped. */
export function courtHeatLevel(surface: TemperingCourtSurface): number {
  return Math.min(100, Math.max(0, surface.heat.value)) / 100;
}

/** The 4 motion custom props as an inline style object for the stage element. */
export function courtMotionVars(surface: TemperingCourtSurface): CSSProperties {
  const mult = surface.rate.mult;
  return {
    '--th-fill-p': courtFillProgress(surface).toFixed(3),
    '--th-qi-dur': `${courtQiDurSeconds(mult).toFixed(2)}s`,
    '--th-breath-dur': `${courtBreathDurSeconds(mult).toFixed(2)}s`,
    '--th-heat': courtHeatLevel(surface).toFixed(3),
  } as CSSProperties;
}
