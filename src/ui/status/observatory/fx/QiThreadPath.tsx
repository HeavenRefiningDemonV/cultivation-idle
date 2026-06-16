import { useId } from 'react';
import { useRitualMotion } from './useRitualMotion.js';
import './observatoryFx.scss';

export interface QiThreadPathProps {
  /** SVG path geometry, supplied by the consumer. */
  d: string;
  tone: 'cinnabar' | 'jade' | 'gold';
  width: number;
  height: number;
  /** crisp top-stroke width; default 2. */
  thickness?: number;
  className?: string;
  /** decorative by default (true). */
  ariaHidden?: boolean;
  /** when true (and flourish), the lit stroke drifts like flowing qi. */
  flow?: boolean;
  /** under-glow strength; default 'full'. */
  glow?: 'soft' | 'full';
}

function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * The body-glow meridian stroke (VFX-04 foundation). One path rendered twice:
 * a wide blurred under-stroke and a crisp jade-gold top stroke. Phase 1 will
 * compose many of these along the cultivator silhouette — this primitive stays
 * dumb: one path in, one glowing stroke out.
 */
export function QiThreadPath({
  d,
  tone,
  width,
  height,
  thickness = 2,
  className,
  ariaHidden = true,
  flow = false,
  glow = 'full',
}: QiThreadPathProps) {
  const { flourish } = useRitualMotion();
  const uid = safeId(useId());
  const gradientId = `obsQiGrad-${uid}`;
  const blurId = `obsQiBlur-${uid}`;
  const classes = [
    'obsFxQiThread',
    `obsFxQiThread--${tone}`,
    `obsFxQiThread--glow-${glow}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <svg
      className={classes}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      data-flow={flow && flourish ? 'true' : 'false'}
      aria-hidden={ariaHidden ? 'true' : undefined}
      role={ariaHidden ? undefined : 'img'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--paper-jade-bright)" />
          <stop offset="100%" stopColor="var(--paper-gold-leaf)" />
        </linearGradient>
        <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={glow === 'full' ? 5 : 3.2} />
        </filter>
      </defs>
      <path className="obsFxQiThread__under" d={d} strokeWidth={thickness + 4} filter={`url(#${blurId})`} />
      <path className="obsFxQiThread__top" d={d} strokeWidth={thickness} stroke={`url(#${gradientId})`} />
    </svg>
  );
}
