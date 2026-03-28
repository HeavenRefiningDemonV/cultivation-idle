import type { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { MotionEmphasis } from '../types.js';
import { useMotionSafety } from './useMotionSafety.js';

export interface MotionSafePresenceProps {
  children?: ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
  initial?: boolean;
  emphasis?: MotionEmphasis;
}

export function MotionSafePresence({
  children,
  mode = 'sync',
  initial = true,
  emphasis = 'subtle',
}: MotionSafePresenceProps) {
  const safety = useMotionSafety({ emphasis, disableScale: true });

  return (
    <AnimatePresence mode={mode} initial={safety.reducedMotion ? false : initial}>
      {children}
    </AnimatePresence>
  );
}
