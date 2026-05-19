import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFxStageSnapshot } from './FxQualityProvider.js';
import { resolveFxPortalMountPolicy } from './shellContract.js';
import type { FxStagePortalProps } from './types.js';

const IS_DEV = import.meta.env.DEV;

export function FxStagePortal({ stageId, children }: FxStagePortalProps) {
  const snapshot = useFxStageSnapshot(stageId);
  const missingWarnedRef = useRef(false);
  const mountPolicy = resolveFxPortalMountPolicy(snapshot);

  useEffect(() => {
    if (!IS_DEV || mountPolicy.reason !== 'missingSnapshot' || missingWarnedRef.current) return;
    missingWarnedRef.current = true;
    console.warn(`[fx] Missing stage host for stageId "${String(stageId)}".`);
  }, [mountPolicy.reason, stageId]);

  if (!mountPolicy.canMount || !snapshot?.hostElement) return null;

  return createPortal(children, snapshot.hostElement);
}
