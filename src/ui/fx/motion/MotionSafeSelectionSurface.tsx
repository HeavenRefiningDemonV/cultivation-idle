import type { CSSProperties, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { MotionEmphasis } from '../types.js';
import { useMotionSafety } from './useMotionSafety.js';

export interface MotionSafeSelectionSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  hoverable?: boolean;
  emphasis?: MotionEmphasis;
  layoutId?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  role?: string;
  tabIndex?: number;
}

export function MotionSafeSelectionSurface({
  selected = false,
  disabled = false,
  hoverable = true,
  emphasis = 'subtle',
  layoutId,
  className,
  style,
  children,
  onClick,
  role,
  tabIndex,
}: MotionSafeSelectionSurfaceProps) {
  const safety = useMotionSafety({ emphasis });

  return (
    <motion.div
      className={className}
      style={style}
      layoutId={safety.allowSharedLayout ? layoutId : undefined}
      data-motion-safe-selection="true"
      data-selected={selected ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-reduced-motion={safety.reducedMotion ? 'true' : 'false'}
      onClick={disabled ? undefined : onClick}
      role={role}
      tabIndex={tabIndex}
      initial={false}
      animate={{
        opacity: safety.allowSelectionOpacityEmphasis ? (selected ? 1 : 0.98) : 1,
        y: safety.allowMotion && selected ? -safety.hoverLiftPx * 0.5 : 0,
        scale: safety.allowScale && selected ? safety.selectionScale : 1,
      }}
      whileHover={
        hoverable && !disabled && safety.allowMotion && safety.allowHoverLift
          ? {
              y: -safety.hoverLiftPx,
              scale: safety.allowScale ? safety.selectionScale : 1,
            }
          : undefined
      }
      whileTap={
        !disabled && safety.allowMotion
          ? {
              y: safety.pressShiftPx,
              scale: 1,
            }
          : undefined
      }
      transition={{
        duration: safety.enterDurationMs / 1000,
        ease: [0.2, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
