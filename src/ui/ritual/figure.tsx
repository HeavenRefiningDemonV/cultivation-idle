import type { ReactElement } from 'react';

/**
 * F2.UI — the shared ink-brush cultivator silhouette (modal-stage.html `figure()`, L976). Decorative;
 * a `<g>` to drop into a scene `<svg>`. Token-only fills; `color` is a token var passed by the scene.
 */
export function figure(cx: number, baseY: number, scale: number, color: string): ReactElement {
  return (
    <g transform={`translate(${cx} ${baseY}) scale(${scale})`} fill={color} opacity={0.9} filter="url(#rsRough)">
      <ellipse cx={0} cy={2} rx={22} ry={5} fill="color-mix(in oklab, var(--obs-void-deep) 55%, transparent)" />
      <path d="M0,-78 q-7,0 -9,9 l-7,52 q-2,12 6,14 l20,0 q8,-2 6,-14 l-7,-52 q-2,-9 -9,-9 z" />
      <circle cx={0} cy={-86} r={9} />
      <path d="M-9,-58 q-16,8 -16,30 M9,-58 q16,8 16,30" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
}
