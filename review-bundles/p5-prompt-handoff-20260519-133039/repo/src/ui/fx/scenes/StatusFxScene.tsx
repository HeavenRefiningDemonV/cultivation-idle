import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';
import type { StatusUrgentCardId } from '../../../systems/ui/status/statusTroubleshootingSurface.js';

export interface StatusFxSceneProps extends FxSceneContract {
  urgency: StatusUrgentCardId;
  resonance: string;
}

function glintCountForBudget(props: StatusFxSceneProps) {
  if (!props.budget.allowGlints || props.isStatic || props.dormant) return 0;
  const resonanceTone = resolveResonanceTone(props.resonance);
  const urgencyBoost = props.urgency === 'readiness' ? 1 : 0;
  if (props.effectiveQuality === 'high') {
    const glintCount = Math.round(2 + props.budget.particleDensity + urgencyBoost);
    return resonanceTone === 'resonant' ? Math.min(4, glintCount + 1) : Math.min(3, glintCount);
  }
  if (props.effectiveQuality === 'medium') {
    return resonanceTone === 'resonant' ? 2 : 1;
  }
  return 0;
}

function mistCountForBudget(props: StatusFxSceneProps) {
  if (!props.canAnimateContinuously || props.budget.continuousAtmosphere === 'off') return 0;
  if (props.effectiveQuality === 'high') {
    if (props.budget.continuousAtmosphere === 'full') return 2;
    if (props.budget.continuousAtmosphere === 'sparse') return 1;
  }
  if (props.effectiveQuality === 'medium') return 1;
  return 0;
}

function shouldAnimatePulse(props: StatusFxSceneProps) {
  return props.effectiveQuality !== 'low' && props.budget.allowHeroPulse && props.canAnimateContinuously && !props.dormant;
}

function resolveResonanceTone(resonance: string) {
  if (resonance.toLowerCase().includes('resonant')) return 'resonant';
  if (resonance.toLowerCase().includes('mismatch')) return 'mismatch';
  return 'neutral';
}

export function StatusFxScene({
  centerX,
  centerY,
  shortestSide,
  urgency,
  resonance,
  ...scene
}: StatusFxSceneProps) {
  const props: StatusFxSceneProps = { centerX, centerY, shortestSide, urgency, resonance, ...scene };
  const auraRadius = Math.max(140, Math.round(shortestSide * 0.16));
  const glints = glintCountForBudget(props);
  const mists = mistCountForBudget(props);
  const animatePulse = shouldAnimatePulse(props);
  const resonanceTone = resolveResonanceTone(resonance);
  const urgencyTone = urgency ?? 'calm';

  const style = {
    '--status-fx-center-x': `${centerX}px`,
    '--status-fx-center-y': `${Math.round(centerY + shortestSide * 0.08)}px`,
    '--status-fx-radius': `${auraRadius}px`,
  } as CSSProperties;

  return (
    <div
      className="statusFxScene"
      data-quality={scene.effectiveQuality}
      data-urgency={urgencyTone}
      data-resonance={resonanceTone}
      data-static={scene.isStatic ? '1' : '0'}
      data-dormant={scene.dormant ? '1' : '0'}
      data-can-animate={scene.canAnimateContinuously ? '1' : '0'}
      data-hero-pulse={animatePulse ? '1' : '0'}
      data-glints={glints}
      data-mists={mists}
      style={style}
      aria-hidden="true"
    >
      <div className="statusFxScene__halo" />
      <div className="statusFxScene__ring statusFxScene__ring--outer" />
      {(animatePulse || !scene.isStatic) ? <div className="statusFxScene__ring statusFxScene__ring--inner" /> : null}
      {Array.from({ length: mists }).map((_, index) => (
        <span key={index} className={`statusFxScene__mist statusFxScene__mist--${index + 1}`} />
      ))}
      {Array.from({ length: glints }).map((_, index) => (
        <span key={index} className={`statusFxScene__glint statusFxScene__glint--${index + 1}`} />
      ))}
    </div>
  );
}
