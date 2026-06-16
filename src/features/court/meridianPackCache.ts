import type { PathMeridianDef } from '../../systems/meridians/index.js';

/**
 * W13a — module-level cache + loader for the path-meridians content pack (LEAF, no React).
 * The pack lives in public/ and (per W2) is NOT on contentStore.raw, so the live Court
 * fetches it directly. The systems-layer tick (gameLoop) reads the cache synchronously via
 * getMeridianPackCache(); the React hook (useMeridianPack) drives the async load.
 */
let cache: PathMeridianDef[] | null = null;
let inflight: Promise<PathMeridianDef[]> | null = null;

/** The cached defs, or [] if not yet loaded. Synchronous — safe in the tick. */
export function getMeridianPackCache(): PathMeridianDef[] {
  return cache ?? [];
}

/** Fetch + cache the pack once. Resolves to the defs (or [] on failure). */
export function loadMeridianPack(): Promise<PathMeridianDef[]> {
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
