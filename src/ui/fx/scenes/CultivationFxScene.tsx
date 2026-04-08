import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';

export interface CultivationFxSceneProps extends FxSceneContract {
  isCultivating: boolean;
  isReady: boolean;
}

function glintCountForBudget(props: CultivationFxSceneProps) {
  if (!props.budget.allowGlints || props.isStatic || props.dormant) return 0;
  const glintCount = Math.round(5 * props.budget.particleDensity);
  return Math.max(1, glintCount);
}

function shouldRenderMist(props: CultivationFxSceneProps) {
  return props.canAnimateContinuously && props.budget.continuousAtmosphere !== 'off';
}

function shouldAnimateHeroPulse(props: CultivationFxSceneProps) {
  return props.budget.allowHeroPulse && props.canAnimateContinuously && !props.dormant;
}

function shouldRenderRing(props: CultivationFxSceneProps) {
  return props.budget.allowHeroPulse || !props.isStatic || props.isReady;
}

function resolveAuraOpacity(props: CultivationFxSceneProps) {
  if (props.isReady) return 0.48;
  if (props.isCultivating) return 0.38;
  if (props.isStatic || props.dormant) return 0.26;
  return 0.3;
}

export function CultivationFxScene({
  centerX,
  centerY,
  shortestSide,
  isCultivating,
  isReady,
  ...scene
}: CultivationFxSceneProps) {
  const props: CultivationFxSceneProps = { centerX, centerY, shortestSide, isCultivating, isReady, ...scene };
  const activityTone = isReady ? 'ready' : isCultivating ? 'active' : 'idle';
  const auraRadius = Math.max(120, Math.round(shortestSide * 0.18));
  const glintCount = glintCountForBudget(props);
  const showMist = shouldRenderMist(props);
  const animateHeroPulse = shouldAnimateHeroPulse(props);
  const showRing = shouldRenderRing(props);
  const haloOpacity = resolveAuraOpacity(props);
  const style = {
    '--cultivation-fx-center-x': `${centerX}px`,
    '--cultivation-fx-center-y': `${Math.round(centerY + shortestSide * 0.12)}px`,
    '--cultivation-fx-radius': `${auraRadius}px`,
    '--cultivation-fx-halo-opacity': `${haloOpacity}`,
  } as CSSProperties;

  return (
    <div
      className="cultivationFxScene"
      data-quality={scene.effectiveQuality}
      data-activity={activityTone}
      data-static={scene.isStatic ? '1' : '0'}
      data-dormant={scene.dormant ? '1' : '0'}
      data-can-animate={scene.canAnimateContinuously ? '1' : '0'}
      data-hero-pulse={animateHeroPulse ? '1' : '0'}
      style={style}
      aria-hidden="true"
    >
      <div className="cultivationFxScene__halo" />
      {showMist ? <div className="cultivationFxScene__mist cultivationFxScene__mist--inner" /> : null}
      {showMist ? <div className="cultivationFxScene__mist cultivationFxScene__mist--outer" /> : null}
      {showRing ? <div className="cultivationFxScene__ring" /> : null}
      {Array.from({ length: glintCount }).map((_, index) => (
        <span key={index} className={`cultivationFxScene__glint cultivationFxScene__glint--${index + 1}`} />
      ))}
    </div>
  );
}
