import { FX_PORTAL_ROOT_ID } from '../fxLayerContract.js';
import type { FxFoundationRuntimeSnapshot } from './types.js';

const EMPTY_SNAPSHOT: FxFoundationRuntimeSnapshot = {
  localStageCount: 0,
  globalStageCount: 0,
  ambientMountCount: 0,
  heroMountCount: 0,
  animatedMountCount: 0,
  staticFallbackCount: 0,
  offMountCount: 0,
  portalRootPresent: false,
};

type QueryableRoot = ParentNode & {
  querySelectorAll: (selectors: string) => { length: number };
  querySelector: (selectors: string) => Element | null;
};

function asQueryableRoot(root: ParentNode | Document | null | undefined): QueryableRoot | null {
  if (!root) return null;
  if (typeof (root as QueryableRoot).querySelectorAll !== 'function') return null;
  if (typeof (root as QueryableRoot).querySelector !== 'function') return null;
  return root as QueryableRoot;
}

function count(root: QueryableRoot, selector: string): number {
  return root.querySelectorAll(selector).length;
}

export function readFxFoundationRuntimeSnapshot(root?: ParentNode | Document): FxFoundationRuntimeSnapshot {
  const fallbackRoot = typeof document !== 'undefined' ? document : null;
  const queryRoot = asQueryableRoot(root ?? fallbackRoot);

  if (!queryRoot) {
    return { ...EMPTY_SNAPSHOT };
  }

  return {
    localStageCount: count(queryRoot, '[data-fx-stage-kind="local"]'),
    globalStageCount: count(queryRoot, '[data-fx-stage-kind="global"]'),
    ambientMountCount: count(queryRoot, '[data-fx-mount-kind="ambient-underlay"]'),
    heroMountCount: count(queryRoot, '[data-fx-mount-kind="hero-slot"]'),
    animatedMountCount: count(queryRoot, '[data-fx-mount-mode="animated"]'),
    staticFallbackCount: count(queryRoot, '[data-fx-mount-mode="static"]'),
    offMountCount: count(queryRoot, '[data-fx-mount-mode="off"]'),
    portalRootPresent: queryRoot.querySelector(`#${FX_PORTAL_ROOT_ID}`) !== null,
  };
}
