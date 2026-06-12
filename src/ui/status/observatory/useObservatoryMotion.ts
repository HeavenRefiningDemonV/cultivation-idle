import { useMemo } from 'react';
import { useRitualMotion } from './fx/useRitualMotion.js';
import {
  deriveObservatoryMotionVars,
  type ObservatoryMotionInputs,
  type ObservatoryMotionVars,
} from './observatoryMotionModel.js';

/**
 * Returns declarative CSS custom properties derived from already-subscribed
 * telemetry, with reduced-motion governance centralized here (via
 * useRitualMotion -> FxQualityProvider). EXPOSED but not yet applied to any
 * instrument — Waves 2-6 spread these onto element styles. Display-only:
 * never feeds gameplay.
 */
export function useObservatoryMotion(inputs: ObservatoryMotionInputs): ObservatoryMotionVars {
  const { animate } = useRitualMotion();
  return useMemo(() => deriveObservatoryMotionVars(inputs, animate), [inputs, animate]);
}
