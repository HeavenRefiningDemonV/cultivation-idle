import type { ReactNode } from 'react';
import './GateTrialWorldLayout.scss';

export function GateTrialWorldLayout(props: {
  topLane: ReactNode;
  identity: ReactNode;
  leftRail: ReactNode;
  centerStage: ReactNode;
  rightRail: ReactNode;
  bottomLane: ReactNode;
  details?: ReactNode;
}) {
  const { topLane, identity, leftRail, centerStage, rightRail, bottomLane, details } = props;

  return (
    <div className="gateTrialWorldLayout">
      <div className="gateTrialWorldLayout__top">{topLane}</div>
      <section className="gateTrialWorldLayout__identity" aria-label="Gate trial role and readiness summary">{identity}</section>
      <div className="gateTrialWorldLayout__triad">
        <aside className="gateTrialWorldLayout__rail gateTrialWorldLayout__rail--minimum" aria-label="Minimum floor checklist">
          {leftRail}
        </aside>
        <section className="gateTrialWorldLayout__center" aria-label="Gate trial stage">
          {centerStage}
        </section>
        <aside className="gateTrialWorldLayout__rail gateTrialWorldLayout__rail--support" aria-label="Recommended floor, safety net, and diagnosis">
          {rightRail}
        </aside>
      </div>
      <section className="gateTrialWorldLayout__action" aria-label="Gate trial attempt lane">{bottomLane}</section>
      {details ? <section className="gateTrialWorldLayout__details" aria-label="Gate trial details">{details}</section> : null}
    </div>
  );
}
