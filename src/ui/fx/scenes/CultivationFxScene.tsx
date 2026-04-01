import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';

export interface CultivationFxSceneProps extends FxSceneContract {
  isCultivating: boolean;
  isReady: boolean;
}

function glintCountForQuality(quality: CultivationFxSceneProps['effectiveQuality']) {
  if (quality === 'high') return 5;
  if (quality === 'medium') return 3;
  if (quality === 'low') return 1;
  return 0;
}

export function CultivationFxScene({
  centerX,
  centerY,
  shortestSide,
  effectiveQuality,
  isCultivating,
  isReady,
}: CultivationFxSceneProps) {
  const activityTone = isReady ? 'ready' : isCultivating ? 'active' : 'idle';
  const auraRadius = Math.max(120, Math.round(shortestSide * 0.18));
  const style = {
    '--cultivation-fx-center-x': `${centerX}px`,
    '--cultivation-fx-center-y': `${Math.round(centerY + shortestSide * 0.12)}px`,
    '--cultivation-fx-radius': `${auraRadius}px`,
  } as CSSProperties;

  const glintCount = glintCountForQuality(effectiveQuality);

  return (
    <div
      className="cultivationFxScene"
      data-quality={effectiveQuality}
      data-activity={activityTone}
      style={style}
      aria-hidden="true"
    >
      <div className="cultivationFxScene__halo" />
      <div className="cultivationFxScene__mist cultivationFxScene__mist--inner" />
      <div className="cultivationFxScene__mist cultivationFxScene__mist--outer" />
      <div className="cultivationFxScene__ring" />
      {Array.from({ length: glintCount }).map((_, index) => (
        <span key={index} className={`cultivationFxScene__glint cultivationFxScene__glint--${index + 1}`} />
      ))}
    </div>
  );
}
