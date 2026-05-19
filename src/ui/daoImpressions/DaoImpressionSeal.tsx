import type { DaoImpressionSurfaceV1 } from '../../systems/daoImpressions/types.js';
import './DaoImpressionSeal.scss';

export function DaoImpressionSeal({ surface }: { surface: DaoImpressionSurfaceV1 }) {
  return (
    <article
      className={`daoImpressionSeal daoImpressionSeal--${surface.sealTone}`}
      data-rarity={surface.rarityBand}
      aria-label={`${surface.title}: ${surface.comprehensionLine}`}
    >
      <span className="daoImpressionSeal__stamp" aria-hidden="true" />
      <div className="daoImpressionSeal__copy">
        <strong>{surface.title}</strong>
        <span>{surface.comprehensionLine}</span>
        <small>{surface.targetLine}</small>
      </div>
    </article>
  );
}

