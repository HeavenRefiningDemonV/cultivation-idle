import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFxStageSnapshot } from './FxQualityProvider.js';
import type { FxStagePortalProps } from './types.js';

const IS_DEV = import.meta.env.DEV;

export function FxStagePortal({ stageId, children }: FxStagePortalProps) {
  const snapshot = useFxStageSnapshot(stageId);
  const missingWarnedRef = useRef(false);

  useEffect(() => {
    if (!IS_DEV || snapshot || missingWarnedRef.current) return;
    missingWarnedRef.current = true;
    console.warn(`[fx] Missing stage host for stageId "${stageId}".`);
  }, [snapshot, stageId]);

  if (!snapshot?.hostElement) return null;

  return createPortal(children, snapshot.hostElement);
}
