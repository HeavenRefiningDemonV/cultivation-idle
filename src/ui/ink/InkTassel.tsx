import './InkTassel.scss';

export interface InkTasselProps {
  x: number;
  y: number;
  /** Cord/knot color; accepts a token, e.g. "var(--paper-stamp)". */
  color: string;
  length?: number;
  className?: string;
}

/**
 * Hanging cord + tassel with a gentle sway (artifact tassel()). Renders an SVG
 * <g>, so place it inside an <svg>. The sway is gated by prefers-reduced-motion
 * in InkTassel.scss; the per-position delay is deterministic.
 */
export function InkTassel({ x, y, color, length = 14, className }: InkTasselProps) {
  const len = length;
  const delay = ((((x * 7 + y) | 0) % 26) / 10).toFixed(1);
  return (
    <g className={['inkTassel', className].filter(Boolean).join(' ')} transform={`translate(${x},${y})`}>
      <g className="inkTassel__sway" style={{ animationDelay: `${delay}s` }}>
        <circle r="3" style={{ fill: color }} />
        <path
          d={`M-2.5,1 q-2,${len * 0.6} -3.5,${len} M0,1 q0,${len * 0.7} 0,${len} M2.5,1 q2,${len * 0.6} 3.5,${len}`}
          style={{ stroke: color, fill: 'none' }}
          strokeWidth="1.2"
          opacity=".9"
        />
        <circle cy={len} r="1.4" style={{ fill: color }} />
      </g>
    </g>
  );
}
