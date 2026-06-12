// Pure SVG geometry for the Spirit Root Astrolabe, ported from the artifact
// PT/arc/donut helpers. No React/scss imports, so the Node contract runner can
// import it. parse* read finalized display labels (display plumbing, never a
// gameplay recompute).

/** Polar -> cartesian; 0deg points up, clockwise (artifact PT). */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** SVG arc path between two angles at radius r (artifact arc). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

/** Filled donut wedge between radii r1 < r2 across angles a0..a1 (artifact donut). */
export function donutPath(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number): string {
  const [ax, ay] = polar(cx, cy, r2, a0);
  const [bx, by] = polar(cx, cy, r2, a1);
  const [c2, d2] = polar(cx, cy, r1, a1);
  const [d3, d4] = polar(cx, cy, r1, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${ax.toFixed(1)},${ay.toFixed(1)} A${r2},${r2} 0 ${large} 1 ${bx.toFixed(1)},${by.toFixed(1)} L${c2.toFixed(1)},${d2.toFixed(1)} A${r1},${r1} 0 ${large} 0 ${d3.toFixed(1)},${d4.toFixed(1)} Z`;
}

/** Leading integer out of a finalized display label ('66%' -> 66). */
export function parseLeadingInt(label: string | null | undefined): number | null {
  if (!label) return null;
  const m = label.match(/-?\d+/);
  return m ? Number.parseInt(m[0], 10) : null;
}

/** Parse an 'X / Y' expression-cap label into { value, max }. */
export function parseExpressionCap(
  label: string | null | undefined,
): { value: number; max: number } | null {
  if (!label) return null;
  const m = label.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  return { value: Number.parseInt(m[1], 10), max: Number.parseInt(m[2], 10) };
}
