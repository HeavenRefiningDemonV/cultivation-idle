import type { FxEffectiveQuality, FxReducedMotionOverride, FxRequestedQuality } from '../types.js';

interface FxDebugApi {
  getState: () => {
    requestedQuality: FxRequestedQuality;
    effectiveQuality: FxEffectiveQuality;
    prefersReducedMotion: boolean;
    reducedMotionOverride: FxReducedMotionOverride;
    systemPrefersReducedMotion: boolean;
  };
  setRequestedQuality: (quality: FxRequestedQuality) => void;
  setReducedMotionOverride: (override: FxReducedMotionOverride) => void;
  clearOverride: () => void;
}

declare global {
  interface Window {
    __ciFxDebug?: FxDebugApi;
  }
}

interface InstallFxDebugApiInput {
  getState: FxDebugApi['getState'];
  setRequestedQuality: FxDebugApi['setRequestedQuality'];
  setReducedMotionOverride: FxDebugApi['setReducedMotionOverride'];
  clearOverride: FxDebugApi['clearOverride'];
}

export function installFxDebugApi(input: InstallFxDebugApiInput) {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return () => undefined;
  }

  window.__ciFxDebug = {
    getState: input.getState,
    setRequestedQuality: input.setRequestedQuality,
    setReducedMotionOverride: input.setReducedMotionOverride,
    clearOverride: input.clearOverride,
  };

  return () => {
    if (window.__ciFxDebug) {
      delete window.__ciFxDebug;
    }
  };
}
