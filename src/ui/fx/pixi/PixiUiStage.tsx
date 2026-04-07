import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Application } from '@pixi/react';
import { FxStagePortal } from '../FxStagePortal.js';
import { useFxContext, useFxQuality, useFxStageSnapshot } from '../FxQualityProvider.js';
import { buildFxSceneContract } from '../runtime.js';
import { canRenderPixiStage, isSceneKindAllowedForStage, resolveFxPortalMountPolicy } from '../shellContract.js';
import type { FxSceneContract, PixiUiStageProps, PixiUiStageRenderProp } from '../types.js';

const IS_DEV = import.meta.env.DEV;

function resolvePixiChildren(children: PixiUiStageProps['children'], scene: FxSceneContract): ReactNode {
  if (typeof children === 'function') {
    return (children as PixiUiStageRenderProp)(scene);
  }
  return children ?? null;
}

export function PixiUiStage({ stageId, sceneKind = 'generic', children }: PixiUiStageProps) {
  const snapshot = useFxStageSnapshot(stageId);
  const { requestedQuality, effectiveQuality, prefersReducedMotion } = useFxQuality();
  const { documentHidden, claimActiveScene, releaseActiveScene, getActiveSceneOwner } = useFxContext();
  const sceneKey = useId();
  const [isOwner, setIsOwner] = useState(false);
  const blockedWarnedRef = useRef(false);
  const illegalSceneWarnedRef = useRef(false);

  useEffect(() => {
    const claimed = claimActiveScene({ stageId, sceneKey });
    setIsOwner(claimed);
    return () => {
      releaseActiveScene({ stageId, sceneKey });
      setIsOwner(false);
    };
  }, [claimActiveScene, releaseActiveScene, sceneKey, stageId]);

  useEffect(() => {
    if (!IS_DEV || illegalSceneWarnedRef.current) return;
    if (isSceneKindAllowedForStage(stageId, sceneKind)) return;
    illegalSceneWarnedRef.current = true;
    console.warn(`[fx] Scene kind "${sceneKind}" is not allowed for stageId "${String(stageId)}".`);
  }, [sceneKind, stageId]);

  const scene = useMemo(() => {
    if (!snapshot?.hostElement) return null;
    return buildFxSceneContract({
      stageId,
      sceneKind,
      snapshot,
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      documentHidden,
    });
  }, [documentHidden, effectiveQuality, prefersReducedMotion, requestedQuality, sceneKind, snapshot, stageId]);

  const mountPolicy = resolveFxPortalMountPolicy(snapshot);
  if (!mountPolicy.canMount) return null;
  if (!snapshot?.hostElement || !scene || !canRenderPixiStage(scene)) return null;
  if (!isSceneKindAllowedForStage(stageId, sceneKind)) return null;

  if (!isOwner) {
    if (IS_DEV && !blockedWarnedRef.current && getActiveSceneOwner(stageId) !== sceneKey) {
      blockedWarnedRef.current = true;
    }
    return null;
  }

  const resolvedChildren = resolvePixiChildren(children, scene);
  if (scene.isStatic && !resolvedChildren) return null;

  return (
    <FxStagePortal stageId={stageId}>
      <Application
        width={scene.width}
        height={scene.height}
        backgroundAlpha={0}
        autoDensity
        resolution={scene.dpr}
        style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
      >
        {resolvedChildren}
      </Application>
    </FxStagePortal>
  );
}
