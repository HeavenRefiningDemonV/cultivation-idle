import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { MotionEmphasis } from '../types.js';
import { resolveMotionSafetyContract } from './motionSafetyContract.js';

export interface UseMotionSafetyOptions {
  emphasis?: MotionEmphasis;
  disableScale?: boolean;
}

// Keep resolved values aligned with src/styles/uiMotionTokens.scss.
export function useMotionSafety(options: UseMotionSafetyOptions = {}) {
  const reducedMotionSignal = useReducedMotion();

  return useMemo(
    () =>
      resolveMotionSafetyContract({
        reducedMotion: !!reducedMotionSignal,
        emphasis: options.emphasis,
        disableScale: options.disableScale,
      }),
    [options.disableScale, options.emphasis, reducedMotionSignal],
  );
}
