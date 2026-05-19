import type { CSSProperties } from 'react';
import type { GateTrialAttemptState, GateTrialReadinessLabel } from '../../../systems/readiness/section5Adapters.js';
import type { FxSceneContract } from '../types.js';
import './GateTrialFxScene.scss';

export interface GateTrialFxSceneProps extends FxSceneContract {
  attemptState: GateTrialAttemptState;
  readinessLabel: GateTrialReadinessLabel;
  failSafeAvailable: boolean;
  combatActive: boolean;
}

function moteCountForBudget(props: GateTrialFxSceneProps): number {
  if (props.isStatic || props.dormant || !props.canAnimateContinuously) return 0;
  if (props.effectiveQuality !== 'high') return 0;
  return props.combatActive ? 3 : 2;
}

export function GateTrialFxScene({
  centerX,
  centerY,
  shortestSide,
  attemptState,
  readinessLabel,
  failSafeAvailable,
  combatActive,
  ...scene
}: GateTrialFxSceneProps) {
  const props: GateTrialFxSceneProps = {
    centerX,
    centerY,
    shortestSide,
    attemptState,
    readinessLabel,
    failSafeAvailable,
    combatActive,
    ...scene,
  };

  const moteCount = moteCountForBudget(props);
  const style = {
    '--gate-trial-fx-center-x': `${centerX}px`,
    '--gate-trial-fx-center-y': `${Math.round(centerY * 0.62)}px`,
    '--gate-trial-fx-radius': `${Math.max(140, Math.round(shortestSide * 0.28))}px`,
  } as CSSProperties;

  return (
    <div
      className="gateTrialFxScene"
      data-quality={scene.effectiveQuality}
      data-static={scene.isStatic ? '1' : '0'}
      data-dormant={scene.dormant ? '1' : '0'}
      data-can-animate={scene.canAnimateContinuously ? '1' : '0'}
      data-attempt-state={attemptState}
      data-readiness={readinessLabel.toLowerCase()}
      data-fail-safe={failSafeAvailable ? '1' : '0'}
      data-combat-active={combatActive ? '1' : '0'}
      style={style}
      aria-hidden="true"
    >
      <div className="gateTrialFxScene__mist gateTrialFxScene__mist--far" />
      <div className="gateTrialFxScene__mist gateTrialFxScene__mist--near" />
      <div className="gateTrialFxScene__sealAura" />
      <div className="gateTrialFxScene__sealGlow" />
      {moteCount > 0 ? (
        <div className="gateTrialFxScene__motes">
          {Array.from({ length: moteCount }).map((_, index) => (
            <span key={index} className={`gateTrialFxScene__mote gateTrialFxScene__mote--${index + 1}`} />
          ))}
        </div>
      ) : null}
      <div className="gateTrialFxScene__readinessEdge" />
      {failSafeAvailable ? <div className="gateTrialFxScene__failSafeAccent" /> : null}
    </div>
  );
}
