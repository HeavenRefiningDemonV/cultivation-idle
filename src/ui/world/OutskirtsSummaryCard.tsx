import type { ReactNode } from 'react';
import type { OutskirtsInformationHierarchySurface } from './buildOutskirtsInformationHierarchySurface.js';

export function OutskirtsSummaryCard(props: {
  surface: OutskirtsInformationHierarchySurface;
  trackedBountyLine?: ReactNode;
  secondaryPostureLine?: string | null;
}) {
  const { surface, trackedBountyLine, secondaryPostureLine } = props;
  return (
    <section className="outskirtsSummaryCard">
      <div className="outskirtsSummaryCard__header">
        <strong>Outskirts</strong>
        <span>{surface.roleTag}</span>
      </div>
      <div className="outskirtsSummaryCard__purpose">{surface.bestUsedWhen}</div>
      <div className="outskirtsSummaryCard__expectations">
        <div>{surface.goldExpectationLine}</div>
        <div>{surface.commonMaterialsLine}</div>
      </div>
      {surface.bossAvailabilityLine ? (
        <div className="outskirtsSummaryCard__context">{surface.bossAvailabilityLine}</div>
      ) : null}
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--bounty ${trackedBountyLine ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {trackedBountyLine ?? <span aria-hidden="true"> </span>}
      </div>
      <div className={`outskirtsSummaryCard__context outskirtsSummaryCard__context--ai ${surface.recommendedAiLine ? '' : 'outskirtsSummaryCard__context--empty'}`}>
        {surface.recommendedAiLine ? <span>{surface.recommendedAiLine}</span> : <span aria-hidden="true"> </span>}
      </div>
      <div className="outskirtsSummaryCard__boundary">{surface.boundaryLine}</div>
      {secondaryPostureLine ? <div className="outskirtsSummaryCard__hint">{secondaryPostureLine}</div> : null}
    </section>
  );
}
