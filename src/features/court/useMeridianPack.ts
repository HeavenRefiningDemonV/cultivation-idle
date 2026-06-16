import { useEffect, useState } from 'react';

import type { PathMeridianDef } from '../../systems/meridians/index.js';
import { getMeridianPackCache, loadMeridianPack } from './meridianPackCache.js';

/**
 * W13a — React hook driving the async load of the path-meridians pack (cache lives in the
 * leaf meridianPackCache.ts so the systems-layer tick can read it without React). Returns
 * the cached defs, or [] until loaded.
 */
export function useMeridianPack(): PathMeridianDef[] {
  const [defs, setDefs] = useState<PathMeridianDef[]>(getMeridianPackCache());
  useEffect(() => {
    if (defs.length > 0) return;
    let active = true;
    void loadMeridianPack().then((loaded) => {
      if (active) setDefs(loaded);
    });
    return () => {
      active = false;
    };
  }, [defs.length]);
  return defs;
}
