import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';
import './CultivationFxScene.scss';

export interface CultivationFxSceneProps extends FxSceneContract {
  isCultivating: boolean;
  isReady: boolean;
}

function glintCountForBudget(props: CultivationFxSceneProps) {
  if (!props.budget.allowGlints || props.isStatic || props.dormant) return 0;
  const glintCount = Math.round(4 * props.budget.particleDensity);
  return Math.max(1, glintCount);
}

function moteCountForBudget(props: CultivationFxSceneProps) {
  if (!props.canAnimateContinuously || props.dormant) return 0;
  const moteCount = Math.round(8 * props.budget.particleDensity);
  return Math.max(2, moteCount);
}

function shouldRenderMist(props: CultivationFxSceneProps) {
  if (props.dormant) return false;
  return props.canAnimateContinuously || props.isStatic || props.effectiveQuality === 'low';
}

function shouldAnimateHeroPulse(props: CultivationFxSceneProps) {
  return props.budget.allowHeroPulse && props.canAnimateContinuously && !props.dormant;
}

function shouldRenderRing(props: CultivationFxSceneProps) {
  return props.budget.allowHeroPulse || !props.isStatic || props.isReady;
}

function resolveAuraOpacity(props: CultivationFxSceneProps) {
  if (props.isReady) return 0.46;
  if (props.isCultivating) return 0.37;
  if (props.isStatic || props.dormant) return 0.28;
  return 0.31;
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
  const auraRadius = Math.max(118, Math.round(shortestSide * 0.17));
  const glintCount = glintCountForBudget(props);
  const moteCount = moteCountForBudget(props);
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
      {showMist ? <div className="cultivationFxScene__mist" /> : null}
      {showRing ? <div className="cultivationFxScene__ring" /> : null}
      {moteCount > 0 ? (
        <div className="cultivationFxScene__motes" aria-hidden="true">
          {Array.from({ length: moteCount }).map((_, index) => (
            <span key={index} className={`cultivationFxScene__mote cultivationFxScene__mote--${(index % 4) + 1}`} />
          ))}
        </div>
      ) : null}
      {Array.from({ length: glintCount }).map((_, index) => (
        <span key={index} className={`cultivationFxScene__glint cultivationFxScene__glint--${index + 1}`} />
      ))}
    </div>
  );
}
