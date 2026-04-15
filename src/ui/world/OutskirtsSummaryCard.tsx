import type { ReactNode } from 'react';
import type { OutskirtsInformationHierarchySurface } from './buildOutskirtsInformationHierarchySurface.js';

export function OutskirtsSummaryCard(props: {
  surface: OutskirtsInformationHierarchySurface;
  trackedBountyLine?: ReactNode;
  secondaryPostureLine?: string | null;
  routeHintLines?: string[];
}) {
  const { surface, trackedBountyLine, secondaryPostureLine, routeHintLines = [] } = props;
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
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--route ${routeHintLines.length > 0 ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {routeHintLines.length > 0 ? (
          <div className="outskirtsSummaryCard__routeHints">
            {routeHintLines.slice(0, 2).map((line) => (
              <span key={line} className="outskirtsSummaryCard__routeHint">{line}</span>
            ))}
          </div>
        ) : <span aria-hidden="true"> </span>}
      </div>
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--ai ${surface.recommendedAiLine ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {surface.recommendedAiLine ? <span>{surface.recommendedAiLine}</span> : <span aria-hidden="true"> </span>}
      </div>
      <div className="outskirtsSummaryCard__boundary">{surface.boundaryLine}</div>
      {secondaryPostureLine ? <div className="outskirtsSummaryCard__hint">{secondaryPostureLine}</div> : null}
    </section>
  );
}
