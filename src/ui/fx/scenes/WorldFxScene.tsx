import type { FxEffectiveQuality } from '../types.js';

export interface WorldFxSceneProps {
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  hasSelectedBuilding: boolean;
  hasRecommendedBuilding: boolean;
}

function resolveMoteCount(effectiveQuality: FxEffectiveQuality, prefersReducedMotion: boolean): number {
  if (prefersReducedMotion || effectiveQuality === 'reducedMotion') return 0;
  if (effectiveQuality === 'high') return 4;
  if (effectiveQuality === 'medium') return 2;
  return 1;
}

export function WorldFxScene({
  effectiveQuality,
  prefersReducedMotion,
  hasSelectedBuilding,
  hasRecommendedBuilding,
}: WorldFxSceneProps) {
  const moteCount = resolveMoteCount(effectiveQuality, prefersReducedMotion);

  return (
    <div
      className="worldFxScene"
      data-quality={effectiveQuality}
      data-reduced-motion={prefersReducedMotion ? '1' : '0'}
      data-has-selected={hasSelectedBuilding ? '1' : '0'}
      data-has-recommended={hasRecommendedBuilding ? '1' : '0'}
      aria-hidden="true"
    >
      <span className="worldFxScene__fog" />
      {Array.from({ length: moteCount }).map((_, index) => (
        <span key={index} className={`worldFxScene__mote worldFxScene__mote--${index + 1}`} />
      ))}
    </div>
  );
}
