import { useContext } from 'react';
import { FxQualityContext } from './FxQualityContext.js';
import type { FxQualityContract } from './fxQualityContract.js';

export function useFxQualityContext(): FxQualityContract {
  const context = useContext(FxQualityContext);
  if (!context) {
    throw new Error('useFxQualityContext must be used within an FxQualityProvider.');
  }

  return context;
}
