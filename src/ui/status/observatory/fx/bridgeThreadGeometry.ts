/**
 * Pure geometry helpers for the BridgeThread fx primitive.
 *
 * Deliberately free of React, scss, and FX-provider imports so the jag
 * generator stays unit-testable under the Node test runner (which cannot
 * load `.scss` or Vite's `import.meta.env`). BridgeThread.tsx re-exports
 * `buildJaggedPath` from here so the primitive's public surface matches the
 * spec while the testable function stays import-clean.
 */

export interface JaggedPoint {
  x: number;
  y: number;
}

/**
 * Deterministic vertical-jitter points between two endpoints anchored on the
 * vertical centre line. Same (width, height, segments, seed) always yields the
 * same points — no `Math.random` at call time. Interior y is clamped to
 * 0..height; endpoints sit on the centre line.
 */
export function jaggedPoints(width: number, height: number, segments: number, seed: number): JaggedPoint[] {
  const segCount = Math.max(1, Math.floor(segments));
  const midY = height / 2;
  const amplitude = height * 0.18;
  let state = (Math.floor(seed) >>> 0) || 0x9e3779b1;
  const next = (): number => {
    // 32-bit LCG (Numerical Recipes constants); deterministic per seed.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const points: JaggedPoint[] = [];
  for (let index = 0; index <= segCount; index += 1) {
    const x = (width * index) / segCount;
    let y = midY;
    if (index !== 0 && index !== segCount) {
      const jitter = (next() * 2 - 1) * amplitude;
      y = Math.min(height, Math.max(0, midY + jitter));
    }
    points.push({ x, y });
  }
  return points;
}

/**
 * SVG path `d` for the jagged broken-bridge form. Spans exactly x=0..width
 * with `segments + 1` points, each y clamped to 0..height. Pure + deterministic.
 */
export function buildJaggedPath(width: number, height: number, segments: number, seed: number): string {
  return jaggedPoints(width, height, segments, seed)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

/**
 * Smooth shallow-S intact-bridge path between the same endpoints.
 */
export function buildShallowSPath(width: number, height: number): string {
  const midY = height / 2;
  const c1x = width * 0.33;
  const c2x = width * 0.66;
  const lift = height * 0.22;
  return [
    `M0 ${midY.toFixed(2)}`,
    `C${c1x.toFixed(2)} ${(midY - lift).toFixed(2)}`,
    `${c2x.toFixed(2)} ${(midY + lift).toFixed(2)}`,
    `${width.toFixed(2)} ${midY.toFixed(2)}`,
  ].join(' ');
}
