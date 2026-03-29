import type { ReactNode } from 'react';
import { Application } from '@pixi/react';
import { FX_MIN_STAGE_SIZE } from '../constants.js';
import { FxStagePortal } from '../FxStagePortal.js';
import { useFxQuality, useFxStageSnapshot } from '../FxQualityProvider.js';
import type { FxSceneContract, PixiUiStageProps, PixiUiStageRenderProp } from '../types.js';

function resolvePixiChildren(children: PixiUiStageProps['children'], scene: FxSceneContract): ReactNode {
  if (typeof children === 'function') {
    return (children as PixiUiStageRenderProp)(scene);
  }
  return children ?? null;
}

export function PixiUiStage({ stageId, children }: PixiUiStageProps) {
  const snapshot = useFxStageSnapshot(stageId);
  const { effectiveQuality, prefersReducedMotion } = useFxQuality();

  if (!snapshot?.hostElement) return null;
  if (snapshot.bounds.width < FX_MIN_STAGE_SIZE || snapshot.bounds.height < FX_MIN_STAGE_SIZE) return null;

  const scene: FxSceneContract = {
    stageId,
    width: snapshot.bounds.width,
    height: snapshot.bounds.height,
    dpr: snapshot.dpr,
    quality: effectiveQuality,
    reducedMotion: prefersReducedMotion,
    staticMode: prefersReducedMotion || effectiveQuality === 'low',
  };

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
        {resolvePixiChildren(children, scene)}
      </Application>
    </FxStagePortal>
  );
}
