import type { ReactNode } from 'react';
import { FxQualityProvider } from '../../ui/fx/FxQualityProvider.js';
import { useUiFxSettings } from './useUiFxSettings.js';

export interface AppFxProviderBridgeProps {
  children?: ReactNode;
}

export function AppFxProviderBridge({ children }: AppFxProviderBridgeProps) {
  const { providerProps } = useUiFxSettings();

  return <FxQualityProvider {...providerProps}>{children}</FxQualityProvider>;
}
