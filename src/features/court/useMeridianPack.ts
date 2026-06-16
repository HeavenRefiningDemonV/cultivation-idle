import { useEffect, useState } from 'react';

import type { PathMeridianDef } from '../../systems/meridians/index.js';

/**
 * W13a — load the path-meridians content pack at runtime. The pack lives in public/ and
 * (per W2) is NOT exposed on contentStore.raw (ValidatedContent), so the live Court fetches
 * it directly and caches it module-wide. Returns [] until loaded.
 */
let cache: PathMeridianDef[] | null = null;
let inflight: Promise<PathMeridianDef[]> | null = null;

function loadMeridianPack(): Promise<PathMeridianDef[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/cultivation_idle_content_bible_v1_config/path_meridians.json')
      .then((res) => res.json())
      .then((json: { meridians?: PathMeridianDef[] }) => {
        cache = json.meridians ?? [];
        return cache;
      })
      .catch(() => {
        inflight = null;
        return [];
      });
  }
  return inflight;
}

export function useMeridianPack(): PathMeridianDef[] {
  const [defs, setDefs] = useState<PathMeridianDef[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    let active = true;
    void loadMeridianPack().then((loaded) => {
      if (active) setDefs(loaded);
    });
    return () => {
      active = false;
    };
  }, []);
  return defs;
}
