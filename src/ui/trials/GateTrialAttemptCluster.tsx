import type { GateTrialAttemptPresentation } from '../../systems/readiness/section5Adapters.js';

export function GateTrialAttemptCluster(props: {
  presentation: GateTrialAttemptPresentation;
  onPrimary: () => void;
  onStop: () => void;
  onBuySafetyNet: () => void;
}) {
  const { presentation, onPrimary, onStop, onBuySafetyNet } = props;
  return (
    <section className="gateTrialAttemptCluster">
      <button className={`button-standard gateTrialAttemptCluster__primary gateTrialAttemptCluster__primary--${presentation.tone}`} type="button" onClick={onPrimary} disabled={presentation.primaryDisabled}>
        {presentation.primaryLabel}
      </button>
      <div className="gateTrialAttemptCluster__detail">{presentation.detail}</div>
      <div className="gateTrialAttemptCluster__actions">
        <button className="button-standard button-standard--ghost" type="button" onClick={onStop}>Stop</button>
        {presentation.showBuySafetyNet ? (
          <button className="button-standard" type="button" onClick={onBuySafetyNet} disabled={!presentation.buySafetyNetEnabled}>Buy Safety Net</button>
        ) : null}
      </div>
    </section>
  );
}
