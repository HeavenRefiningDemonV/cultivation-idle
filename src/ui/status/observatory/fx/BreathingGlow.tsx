import type { ReactNode } from 'react';
import { useRitualMotion } from './useRitualMotion.js';
import './observatoryFx.scss';

export interface BreathingGlowProps {
  tone: 'jade' | 'gold' | 'cinnabar';
  /** glow strength; default 'full'. */
  intensity?: 'soft' | 'full';
  /** halo geometry; default 'circle'. */
  shape?: 'circle' | 'pill';
  /** positioned by the consumer. */
  className?: string;
  /** wrapped content; the glow sits behind it. */
  children?: ReactNode;
}

/**
 * The signature "alive" halo (VFX-01). One DOM shape serves both the animated
 * and static forms — the SCSS keys off `data-animate`, so motion is never a
 * second render branch. Glow is box-shadow only (no layout shift).
 */
export function BreathingGlow({
  tone,
  intensity = 'full',
  shape = 'circle',
  className,
  children,
}: BreathingGlowProps) {
  const { animate } = useRitualMotion();
  const classes = [
    'obsFxBreathingGlow',
    `obsFxBreathingGlow--${tone}`,
    `obsFxBreathingGlow--${intensity}`,
    `obsFxBreathingGlow--${shape}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-animate={animate ? 'true' : 'false'}>
      <span className="obsFxBreathingGlow__halo" aria-hidden="true" />
      {children == null ? null : <span className="obsFxBreathingGlow__content">{children}</span>}
    </div>
  );
}
