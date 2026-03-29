import type { CSSProperties, ReactNode } from 'react';
import { ScreenFxStage } from '../ScreenFxStage.js';
import { useFxQuality } from '../pixi/hooks/useFxQuality.js';
import { PixiUiStage } from '../pixi/PixiUiStage.js';
import type { FxPortalTarget, FxQualityFloor } from '../types.js';
import './AmbientUnderlayMount.scss';

export interface AmbientUnderlayMountProps {
  screenKey: string;
  scene: ReactNode | null;
  qualityFloor?: FxQualityFloor;
  portalTarget?: FxPortalTarget;
  containToParent?: boolean;
  disableOnReducedMotion?: boolean;
  staticFallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AmbientUnderlayMount({
  screenKey,
  scene,
  qualityFloor = 'low',
  portalTarget = 'local',
  containToParent = true,
  disableOnReducedMotion = false,
  staticFallback,
  className,
  style,
}: AmbientUnderlayMountProps) {
  const quality = useFxQuality();
  const mountMode: 'animated' | 'static' | 'off' =
    quality.renderMode === 'off' ? 'off' : quality.renderMode === 'static' ? 'static' : 'animated';

  if (quality.renderMode === 'off' || quality.renderMode === 'static') {
    return (
      <span
        style={{ display: 'contents' }}
        data-fx-mount-kind="ambient-underlay"
        data-fx-mount-mode={mountMode}
        data-fx-screen-key={screenKey}
        data-fx-underlay="true"
      >
        {staticFallback ?? null}
      </span>
    );
  }

  return (
    <ScreenFxStage
      scene={
        <PixiUiStage renderMode={quality.renderMode} resolutionCap={quality.devicePixelRatioCap}>
          {scene}
        </PixiUiStage>
      }
      role="underlay"
      screenKey={screenKey}
      qualityFloor={qualityFloor}
      portalTarget={portalTarget}
      containToParent={containToParent}
      disableOnReducedMotion={disableOnReducedMotion}
      diagnosticsMountKind="ambient-underlay"
      diagnosticsMountMode={mountMode}
      className={['ambientUnderlayMount', 'uiScenicBaseFxUnderlay', className].filter(Boolean).join(' ')}
      style={style}
    />
  );
}
