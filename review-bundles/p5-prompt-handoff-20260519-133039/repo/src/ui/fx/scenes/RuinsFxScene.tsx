import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';
import './RuinsFxScene.scss';

export interface RuinsFxSceneProps extends FxSceneContract {
  runActive: boolean;
  pityNearGuaranteed: boolean;
  trackedBountyVisible: boolean;
}

function dustCountForBudget(props: RuinsFxSceneProps): number {
  if (props.isStatic || props.dormant || !props.canAnimateContinuously) return 0;
  if (props.effectiveQuality === 'high') return 5;
  if (props.effectiveQuality === 'medium') return 3;
  return 0;
}

function showAnchorGlint(props: RuinsFxSceneProps): boolean {
  if (!props.budget.allowGlints || props.effectiveQuality === 'low' || props.effectiveQuality === 'reducedMotion') return false;
  return props.pityNearGuaranteed || props.trackedBountyVisible;
}

export function RuinsFxScene({
  centerX,
  centerY,
  shortestSide,
  runActive,
  pityNearGuaranteed,
  trackedBountyVisible,
  ...scene
}: RuinsFxSceneProps) {
  const props: RuinsFxSceneProps = { centerX, centerY, shortestSide, runActive, pityNearGuaranteed, trackedBountyVisible, ...scene };
  const dustCount = dustCountForBudget(props);
  const anchorGlint = showAnchorGlint(props);
  const style = {
    '--ruins-fx-center-x': `${centerX}px`,
    '--ruins-fx-center-y': `${Math.round(centerY * 0.62)}px`,
    '--ruins-fx-radius': `${Math.max(160, Math.round(shortestSide * 0.26))}px`,
  } as CSSProperties;

  return (
    <div
      className="ruinsFxScene"
      data-quality={scene.effectiveQuality}
      data-static={scene.isStatic ? '1' : '0'}
      data-dormant={scene.dormant ? '1' : '0'}
      data-can-animate={scene.canAnimateContinuously ? '1' : '0'}
      data-run-active={runActive ? '1' : '0'}
      data-pity-near={pityNearGuaranteed ? '1' : '0'}
      data-tracked-bounty={trackedBountyVisible ? '1' : '0'}
      style={style}
      aria-hidden="true"
    >
      <div className="ruinsFxScene__haze" />
      <div className="ruinsFxScene__torchGlow" />
      {runActive ? <div className="ruinsFxScene__activeVeil" /> : null}
      {dustCount > 0 ? (
        <div className="ruinsFxScene__dustField">
          {Array.from({ length: dustCount }).map((_, index) => (
            <span key={index} className={`ruinsFxScene__dust ruinsFxScene__dust--${index + 1}`} />
          ))}
        </div>
      ) : null}
      {anchorGlint ? <span className="ruinsFxScene__anchorGlint" /> : null}
    </div>
  );
}
