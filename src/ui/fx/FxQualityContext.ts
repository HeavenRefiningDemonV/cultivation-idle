import { createContext } from 'react';
import type { FxQualityContract } from './fxQualityContract.js';

export const FxQualityContext = createContext<FxQualityContract | null>(null);
