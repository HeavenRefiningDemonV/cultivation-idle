import { useMemo } from 'react';
import { createGateTrialExactMockupFixture } from './buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from './GateTrialExactScreen.js';
import './GateTrialExactScreen.scss';

export interface GateTrialScreenOwnerProps {
  cityId: string;
  trialId?: string | null;
  forceFixture?: boolean;
}

export function GateTrialScreenOwner(props: GateTrialScreenOwnerProps) {
  const surface = useMemo(() => createGateTrialExactMockupFixture(), [props.cityId, props.trialId, props.forceFixture]);

  return (
    <div
      className="gateTrialScreenOwner"
      data-testid="gate-trial-screen-owner"
      data-city-id={props.cityId}
      data-trial-id={props.trialId ?? surface.meta.trialId ?? ''}
      data-force-fixture={props.forceFixture === false ? 'false' : 'true'}
      data-activity-mode={surface.meta.activityMode}
    >
      <GateTrialExactScreen surface={surface} />
    </div>
  );
}
