import { useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
import type { UiFxSettingsState } from '../../stores/uiStore.js';
import type { FxDebugReducedMotionOverride } from '../../ui/fx/fxQualityContract.js';
import { buildUiFxProviderProps } from './buildUiFxProviderProps.js';

export function useUiFxSettings(debugReducedMotionOverride: FxDebugReducedMotionOverride = 'system') {
  const uiFxSettings = useUIStore((state) => state.settings.uiFx);
  const setUiFxSettings = useUIStore((state) => state.setUiFxSettings);
  const resetUiFxSettings = useUIStore((state) => state.resetUiFxSettings);

  const providerProps = useMemo(
    () => buildUiFxProviderProps(uiFxSettings, debugReducedMotionOverride),
    [debugReducedMotionOverride, uiFxSettings],
  );

  return useMemo(
    () => ({
      uiFxSettings,
      setUiFxSettings: (partial: Partial<UiFxSettingsState>) => setUiFxSettings(partial),
      resetUiFxSettings,
      providerProps,
    }),
    [providerProps, resetUiFxSettings, setUiFxSettings, uiFxSettings],
  );
}
