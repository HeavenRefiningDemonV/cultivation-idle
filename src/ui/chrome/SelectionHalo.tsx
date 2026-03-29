import type { CSSProperties } from 'react';
import classNames from 'classnames';
import { useMotionSafety } from '../fx/motion/useMotionSafety.js';
import './SelectionHalo.scss';

export type SelectionHaloTone = 'default' | 'recommendation' | 'warning' | 'success';
export type SelectionHaloVariant = 'ring' | 'panel' | 'label';
export type SelectionHaloInset = 'tight' | 'normal' | 'wide';

export interface SelectionHaloProps {
  active?: boolean;
  tone?: SelectionHaloTone;
  variant?: SelectionHaloVariant;
  inset?: SelectionHaloInset;
  className?: string;
}

export function SelectionHalo({
  active = false,
  tone = 'default',
  variant = 'ring',
  inset = 'normal',
  className,
}: SelectionHaloProps) {
  const safety = useMotionSafety({ emphasis: 'subtle', disableScale: true });

  return (
    <span
      aria-hidden="true"
      className={classNames(
        'selectionHalo',
        `selectionHalo--tone-${tone}`,
        `selectionHalo--variant-${variant}`,
        `selectionHalo--inset-${inset}`,
        {
          'selectionHalo--active': active,
          'selectionHalo--reducedMotion': safety.reducedMotion,
        },
        className,
      )}
      style={{
        '--selection-halo-enter-ms': `${safety.enterDurationMs}ms`,
        '--selection-halo-lift': `${safety.hoverLiftPx}px`,
      } as CSSProperties}
      data-motion-safe={safety.allowMotion ? 'true' : 'false'}
      data-ui-no-shift="true"
    />
  );
}
