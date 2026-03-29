import { useMemo } from 'react';
import { useFxQuality } from '../pixi/hooks/useFxQuality.js';
import { buildFxFoundationDiagnostics } from './buildFxFoundationDiagnostics.js';
import { readFxFoundationRuntimeSnapshot } from './readFxFoundationRuntimeSnapshot.js';

export function useFxFoundationDiagnostics(root?: ParentNode | null) {
  const quality = useFxQuality();

  return useMemo(() => {
    const runtimeSnapshot = readFxFoundationRuntimeSnapshot(root ?? undefined);
    return buildFxFoundationDiagnostics({ quality, runtimeSnapshot });
  }, [quality, root]);
}
