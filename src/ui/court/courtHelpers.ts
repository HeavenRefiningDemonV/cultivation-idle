/**
 * Pure presentational helpers for The Tempering Court (W1, artifact Part 1.4 +
 * the v2 constant helpers). These are imported by the surface selector and the
 * Court regions; per the render-purity rule (Appendix K.4) components format with
 * these but never re-derive gameplay. No RNG, no Date.now.
 */

export type CourtCapState = 'open' | 'near_cap' | 'capped';
export type CourtHeatTier = 'fresh' | 'tiring' | 'strained' | 'overworked';

/** Polar point: artifact PT(cx,cy,r,a) — angle in degrees, 0deg = up. */
export function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG arc path between two angles (artifact arc()). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

/** qi-flow animation duration from the rate multiplier (artifact qiDur). */
export function qiDur(mult: number): string {
  return `${(3.0 - Math.min(2.25, Math.max(0.5, mult)) * 0.8).toFixed(2)}s`;
}

/** dantian breathing duration from the rate multiplier (artifact --th-breath-dur). */
export function breathDur(mult: number): string {
  return `${(6.8 - Math.min(1, mult / 2.25) * 2.4).toFixed(2)}s`;
}

/** cap-state from fill fraction (artifact capStateOf; thresholds open<0.92 / near_cap / capped>=1). */
export function capStateOf(capPct: number): CourtCapState {
  return capPct >= 1 ? 'capped' : capPct >= 0.92 ? 'near_cap' : 'open';
}

/** forge-heat tier from fatigue 0-100 (artifact tierOf; 35/60/80). */
export function tierOf(fatigue: number): CourtHeatTier {
  return fatigue >= 80 ? 'overworked' : fatigue >= 60 ? 'strained' : fatigue >= 35 ? 'tiring' : 'fresh';
}

/** fatigue dampening multiplier (artifact dampOf; PRESERVED engine curve). */
export function dampOf(fatigue: number): number {
  return Math.max(0.4, Math.min(1, 1 - Math.max(0, fatigue - 40) * 0.009));
}

/** cap-falloff multiplier (artifact capFalloffOf; rate throttle approaching cap). */
export function capFalloffOf(capPct: number): number {
  return Math.max(0.35, 1 - (Math.max(0, capPct - 0.85) / 0.15) * 0.62);
}

/** discrete pip count from a fill fraction (artifact pipN). */
export function pipN(fraction: number): number {
  return fraction <= 0.88 ? 2 : fraction <= 0.95 ? 3 : fraction <= 1.0 ? 4 : 5;
}

/** round to 2 decimals, finite-guarded (artifact fmt). */
export function fmt(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
