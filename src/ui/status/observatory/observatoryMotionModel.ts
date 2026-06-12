/** Inputs for the telemetry-driven motion vars (already-subscribed surface values). */
export interface ObservatoryMotionInputs {
  /** qi per second (drives flow rate); null when unknown. */
  qiPerSecond: number | null;
  /** root purity 0..100 (drives the purity fill); null when unknown. */
  purityPct: number | null;
  /** fit needle target angle in degrees; null when unknown. */
  fitAngleDeg: number | null;
  /** cultivation rate hint 0..1 (drives tick spin); null when unknown. */
  cultivationRate?: number | null;
}

/** The CSS custom properties consumers apply in SCSS (Waves 2-6). Plain string
 *  record (no React CSSProperties import), so the Node contract runner can import
 *  this model; consumers cast to CSSProperties when spreading onto a style. */
export type ObservatoryMotionVars = {
  '--qi-flow-rate': string;
  '--tick-spin-dur': string;
  '--breath-period': string;
  '--needle-target-deg': string;
  '--purity-fill': string;
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Pure, deterministic mapping from telemetry to declarative CSS vars. When
 * `animate` is false (reduced motion), durations collapse to 0 so motion is
 * static, but the *values* (angle, fill) stay correct — the static truth is
 * intact. No React/scss/Vite imports.
 */
export function deriveObservatoryMotionVars(
  inputs: ObservatoryMotionInputs,
  animate: boolean,
): ObservatoryMotionVars {
  const qi = inputs.qiPerSecond ?? 0;
  const rate = inputs.cultivationRate ?? 0;
  const purity = clamp(inputs.purityPct ?? 0, 0, 100);
  const angle = inputs.fitAngleDeg ?? 0;
  const flowRate = !animate ? 0 : clamp(0.2 + Math.log10(1 + Math.max(0, qi)) * 0.25, 0.2, 2.4);
  const spinSeconds = !animate ? 0 : clamp(90 - rate * 60, 18, 120);
  const breathSeconds = !animate ? 0 : 5.6;
  return {
    '--qi-flow-rate': flowRate.toFixed(2),
    '--tick-spin-dur': `${spinSeconds.toFixed(0)}s`,
    '--breath-period': `${breathSeconds.toFixed(1)}s`,
    '--needle-target-deg': `${angle.toFixed(1)}deg`,
    '--purity-fill': (purity / 100).toFixed(3),
  };
}
