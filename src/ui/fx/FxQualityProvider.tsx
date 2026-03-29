import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  resolveFxQualityContract,
  type FxDebugReducedMotionOverride,
  type FxRequestedQuality,
} from './fxQualityContract.js';
import { FxQualityContext } from './FxQualityContext.js';

export interface FxQualityProviderProps extends PropsWithChildren {
  enabled?: boolean;
  requestedQuality?: FxRequestedQuality;
  allowAtmosphere?: boolean;
  allowHeroFx?: boolean;
  respectReducedMotion?: boolean;
  debugReducedMotionOverride?: FxDebugReducedMotionOverride;
  devicePixelRatioCap?: number;
}

const FX_REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';


export function FxQualityProvider({
  children,
  enabled = true,
  requestedQuality = 'auto',
  allowAtmosphere = true,
  allowHeroFx = true,
  respectReducedMotion = true,
  debugReducedMotionOverride,
  devicePixelRatioCap,
}: FxQualityProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectReducedMotion || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia(FX_REDUCED_MOTION_MEDIA_QUERY);
    const update = () => setPrefersReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);

    return () => {
      query.removeEventListener('change', update);
    };
  }, [respectReducedMotion]);

  const reducedMotion = useMemo(() => {
    if (!respectReducedMotion) {
      return false;
    }

    return prefersReducedMotion;
  }, [prefersReducedMotion, respectReducedMotion]);

  const value = useMemo(
    () =>
      resolveFxQualityContract({
        enabled,
        requestedQuality,
        reducedMotion,
        allowAtmosphere,
        allowHeroFx,
        debugReducedMotionOverride,
        devicePixelRatioCap,
      }),
    [allowAtmosphere, allowHeroFx, debugReducedMotionOverride, devicePixelRatioCap, enabled, reducedMotion, requestedQuality],
  );

  return <FxQualityContext.Provider value={value}>{children}</FxQualityContext.Provider>;
}
