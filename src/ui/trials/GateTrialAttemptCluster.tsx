import type { CSSProperties } from 'react';
import type { GateTrialAttemptPresentation } from '../../systems/readiness/section5Adapters.js';

export function GateTrialAttemptCluster(props: {
  presentation: GateTrialAttemptPresentation;
  onPrimary: () => void;
  onStop: () => void;
  onBuySafetyNet: () => void;
  showStop: boolean;
  primaryPlateArtUrl?: string | null;
  secondaryPlateArtUrl?: string | null;
}) {
  const {
    presentation,
    onPrimary,
    onStop,
    onBuySafetyNet,
    showStop,
    primaryPlateArtUrl = null,
    secondaryPlateArtUrl = null,
  } = props;
  const style = (primaryPlateArtUrl || secondaryPlateArtUrl)
    ? ({
      '--gate-trial-attempt-primary-art': primaryPlateArtUrl ? `url(${primaryPlateArtUrl})` : 'none',
      '--gate-trial-attempt-secondary-art': secondaryPlateArtUrl ? `url(${secondaryPlateArtUrl})` : 'none',
    } as CSSProperties)
    : undefined;

  return (
    <section
      className={`gateTrialAttemptCluster${primaryPlateArtUrl || secondaryPlateArtUrl ? ' gateTrialAttemptCluster--supported' : ''}`}
      style={style}
      aria-label="Gate Trial attempt controls"
    >
      <button
        className={`button-standard gateTrialAttemptCluster__primary gateTrialAttemptCluster__primary--${presentation.tone}`}
        type="button"
        onClick={onPrimary}
        disabled={presentation.primaryDisabled}
        title={presentation.primaryDisabled ? presentation.detail : undefined}
      >
        {presentation.primaryLabel}
      </button>
      <div className="gateTrialAttemptCluster__detail">{presentation.detail}</div>
      <div className="gateTrialAttemptCluster__actions">
        {showStop ? <button className="button-standard button-standard--ghost" type="button" onClick={onStop}>Stop</button> : null}
        {presentation.showBuySafetyNet ? (
          <button
            className="button-standard"
            type="button"
            onClick={onBuySafetyNet}
            disabled={!presentation.buySafetyNetEnabled}
            title={!presentation.buySafetyNetEnabled ? presentation.detail : undefined}
          >
            Buy Safety Net
          </button>
        ) : null}
      </div>
    </section>
  );
}
