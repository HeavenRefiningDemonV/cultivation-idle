import type { FxDebugReducedMotionOverride, FxRequestedQuality } from '../../ui/fx/fxQualityContract.js';
import type { UiFxSettingsState } from '../../stores/uiStore.js';

export interface UiFxProviderPropsBridge {
  enabled: boolean;
  requestedQuality: FxRequestedQuality;
  allowAtmosphere: boolean;
  allowHeroFx: boolean;
  respectReducedMotion: true;
  debugReducedMotionOverride: FxDebugReducedMotionOverride;
}

export function buildUiFxProviderProps(
  uiFx: UiFxSettingsState,
  debugReducedMotionOverride: FxDebugReducedMotionOverride = 'system',
): UiFxProviderPropsBridge {
  return {
    enabled: uiFx.enabled,
    requestedQuality: uiFx.quality,
    allowAtmosphere: uiFx.allowAtmosphere,
    allowHeroFx: uiFx.allowHeroFx,
    respectReducedMotion: true,
    debugReducedMotionOverride,
  };
}
