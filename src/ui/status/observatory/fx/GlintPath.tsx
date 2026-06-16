import { useRitualMotion } from './useRitualMotion.js';
import './observatoryFx.scss';

export interface GlintPathProps {
  /** SVG path geometry, supplied by the consumer. */
  d: string;
  tone: 'cinnabar' | 'jade' | 'gold';
  width: number;
  height: number;
  /** base stroke width; default 1.5. */
  thickness?: number;
  className?: string;
  /** decorative by default (true). */
  ariaHidden?: boolean;
}

/**
 * A causal / culprit thread with one travelling glint (VFX-03). The stroke is
 * always visible; the glint only travels on `flourish` (animate && quality is
 * rich). Reused later by the constellation weak-link thread and canopy cords.
 */
export function GlintPath({
  d,
  tone,
  width,
  height,
  thickness = 1.5,
  className,
  ariaHidden = true,
}: GlintPathProps) {
  const { flourish } = useRitualMotion();
  const classes = ['obsFxGlintPath', `obsFxGlintPath--${tone}`, className].filter(Boolean).join(' ');
  return (
    <svg
      className={classes}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      data-flourish={flourish ? 'true' : 'false'}
      aria-hidden={ariaHidden ? 'true' : undefined}
      role={ariaHidden ? undefined : 'img'}
    >
      <path className="obsFxGlintPath__base" d={d} strokeWidth={thickness} />
      <path className="obsFxGlintPath__glint" d={d} strokeWidth={thickness + 0.4} />
    </svg>
  );
}
