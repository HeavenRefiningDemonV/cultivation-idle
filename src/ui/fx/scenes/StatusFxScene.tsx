import type { CSSProperties } from 'react';
import type { FxSceneContract } from '../types.js';
import type { StatusUrgentCardId } from '../../../systems/ui/status/statusTroubleshootingSurface.js';

export interface StatusFxSceneProps extends FxSceneContract {
  urgency: StatusUrgentCardId;
  resonance: string;
}

function glintCountForQuality(quality: StatusFxSceneProps['effectiveQuality']) {
  if (quality === 'high') return 4;
  if (quality === 'medium') return 2;
  if (quality === 'low') return 1;
  return 0;
}

function mistCountForQuality(quality: StatusFxSceneProps['effectiveQuality']) {
  if (quality === 'high') return 3;
  if (quality === 'medium') return 2;
  if (quality === 'low') return 1;
  return 0;
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
  effectiveQuality,
  urgency,
  resonance,
}: StatusFxSceneProps) {
  const auraRadius = Math.max(140, Math.round(shortestSide * 0.16));
  const glints = glintCountForQuality(effectiveQuality);
  const mists = mistCountForQuality(effectiveQuality);
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
      data-quality={effectiveQuality}
      data-urgency={urgencyTone}
      data-resonance={resonanceTone}
      style={style}
      aria-hidden="true"
    >
      <div className="statusFxScene__halo" />
      <div className="statusFxScene__ring statusFxScene__ring--outer" />
      <div className="statusFxScene__ring statusFxScene__ring--inner" />
      {Array.from({ length: mists }).map((_, index) => (
        <span key={index} className={`statusFxScene__mist statusFxScene__mist--${index + 1}`} />
      ))}
      {Array.from({ length: glints }).map((_, index) => (
        <span key={index} className={`statusFxScene__glint statusFxScene__glint--${index + 1}`} />
      ))}
    </div>
  );
}
