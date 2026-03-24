import type { GateTrialReadinessSurface } from '../../systems/readiness/section5Adapters.js';

export function GateTrialReadinessCard({ surface }: { surface: GateTrialReadinessSurface }) {
  return (
    <section className="gateTrialReadinessCard">
      <div className="gateTrialReadinessCard__header">
        <h3 className="gateTrialReadinessCard__title">Gate Readiness</h3>
        <span className="gateTrialReadinessCard__label">{surface.readinessLabel}</span>
      </div>
      <div className="gateTrialReadinessCard__detail">{surface.readinessDetail}</div>
      <div className="gateTrialReadinessCard__counts">
        <span>Minimum: {surface.minimumMetCount} / {surface.minimumTotalCount} met</span>
        <span>Recommended: {surface.recommendedMetCount} / {surface.recommendedTotalCount} met</span>
      </div>
      <div className="gateTrialReadinessCard__facts">
        <div>Gate state: {surface.gateStateLabel}</div>
        <div>Gate reward: {surface.gateRewardLabel ?? 'Unknown'}</div>
        {surface.requiredItemLabel ? <div>Required item: {surface.requiredItemLabel}</div> : null}
      </div>
    </section>
  );
}
