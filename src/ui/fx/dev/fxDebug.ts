import type { FxEffectiveQuality, FxRequestedQuality } from '../types.js';

interface FxDebugApi {
  getState: () => {
    requestedQuality: FxRequestedQuality;
    effectiveQuality: FxEffectiveQuality;
    prefersReducedMotion: boolean;
  };
  setRequestedQuality: (quality: FxRequestedQuality) => void;
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
  clearOverride: FxDebugApi['clearOverride'];
}

export function installFxDebugApi(input: InstallFxDebugApiInput) {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return () => undefined;
  }

  window.__ciFxDebug = {
    getState: input.getState,
    setRequestedQuality: input.setRequestedQuality,
    clearOverride: input.clearOverride,
  };

  return () => {
    if (window.__ciFxDebug) {
      delete window.__ciFxDebug;
    }
  };
}
