import type { ReactNode } from 'react';
import type { OutskirtsInformationHierarchySurface } from './buildOutskirtsInformationHierarchySurface.js';
import type { OutskirtsSupportRouteHint } from './buildOutskirtsSupportContextSurface.js';

export function OutskirtsSummaryCard(props: {
  surface: OutskirtsInformationHierarchySurface;
  trackedBountyLine?: ReactNode;
  farmerRecommendationLine?: string | null;
  routeHints?: OutskirtsSupportRouteHint[];
  onRouteSelect?: (destination: OutskirtsSupportRouteHint['destination']) => void;
}) {
  const { surface, trackedBountyLine, farmerRecommendationLine, routeHints = [], onRouteSelect } = props;
  return (
    <section className="outskirtsSummaryCard">
      <div className="outskirtsSummaryCard__header">
        <strong>Reward Rail</strong>
        <span>{surface.roleTag}</span>
      </div>
      <div className="outskirtsSummaryCard__purpose">{surface.bestUsedWhen}</div>
      <div className="outskirtsSummaryCard__expectations">
        <div>{surface.goldExpectationLine}</div>
        <div>{surface.commonMaterialsLine}</div>
      </div>
      {surface.bossAvailabilityLine ? (
        <div className="outskirtsSummaryCard__context outskirtsSummaryCard__context--milestone">{surface.bossAvailabilityLine}</div>
      ) : null}
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--bounty ${trackedBountyLine ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {trackedBountyLine ?? <span aria-hidden="true"> </span>}
      </div>
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--route ${routeHints.length > 0 ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {routeHints.length > 0 ? (
          <div className="outskirtsSummaryCard__routeHints">
            {routeHints.slice(0, 2).map((hint) => (
              <button
                key={hint.label}
                type="button"
                className="outskirtsSummaryCard__routeHint"
                onClick={() => onRouteSelect?.(hint.destination)}
                title={hint.reason}
              >
                <span>{hint.label}</span>
                <small>{hint.reason}</small>
              </button>
            ))}
          </div>
        ) : <span aria-hidden="true"> </span>}
      </div>
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--ai ${farmerRecommendationLine ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {farmerRecommendationLine ? <span>{farmerRecommendationLine}</span> : <span aria-hidden="true"> </span>}
      </div>
      <div className="outskirtsSummaryCard__boundary">{surface.boundaryLine}</div>
    </section>
  );
}
