/**
 * Deep-equality comparator for React.memo on the observatory instruments.
 *
 * Why this exists: the live game ticks `qi`/`qiPerSecond` every frame, which
 * rebuilds the whole `StatusObservatorySurfaceV1` on every tick. Every instrument
 * therefore receives a *new* slice object reference each tick even when its own
 * data (stats, root, organs, bottlenecks…) has not changed. A shallow memo can't
 * see through that — the reference always differs — so the entire SVG tree
 * reconciles 60×/s and the menu janks.
 *
 * A *content* comparison fixes it safely: this returns `true` (skip re-render)
 * only when every prop is byte-for-byte equal, so any real change (a stat ticking
 * up, a bottleneck resolving, qi flowing into the vitals ribbon) still re-renders.
 * Worst case for a wrong guess about what's stable is "no perf win for that
 * instrument" — never stale data. Functions are compared by reference, so callers
 * must pass stable handlers (useCallback / store actions / state setters).
 */
export function deepEqualProps(prev: Readonly<unknown>, next: Readonly<unknown>): boolean {
  return deepEqual(prev, next);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  // Past this point a !== b. Only structurally-comparable objects can still match;
  // primitives, functions, and null fall through to `false`.
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const aArray = Array.isArray(a);
  const bArray = Array.isArray(b);
  if (aArray !== bArray) {
    return false;
  }

  if (aArray && bArray) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) {
      return false;
    }
    if (!deepEqual(aObj[key], bObj[key])) {
      return false;
    }
  }
  return true;
}
