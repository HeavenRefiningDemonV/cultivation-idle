import { useMemo } from 'react';
import { buildOutskirtsMockupSurfaceFromStores } from './buildOutskirtsMockupSurface.js';

export function useOutskirtsMockupSurface(cityId?: string) {
  return useMemo(() => buildOutskirtsMockupSurfaceFromStores(cityId), [cityId]);
}
