import type { CSSProperties } from 'react';
import type { TrialLifecycleSnapshot } from '../../systems/progression/runtime/trialLifecycle.js';

export function GateTrialSafetyNetCard(props: {
  lifecycle: TrialLifecycleSnapshot;
  reserveHeadline: string;
  reserveGapLine: string;
  eligibleDefeatRewardLine: string;
  currentMerit: string;
  currentGold: string;
  currentSpiritStones: string;
  frameArtUrl?: string | null;
}) {
  const {
    lifecycle,
    reserveHeadline,
    reserveGapLine,
    eligibleDefeatRewardLine,
    currentMerit,
    currentGold,
    currentSpiritStones,
    frameArtUrl = null,
  } = props;
  const costLine = [
    lifecycle.failSafe.cost?.gold ? `${lifecycle.failSafe.cost.gold} Gold` : null,
    lifecycle.failSafe.cost?.merit ? `${lifecycle.failSafe.cost.merit} Merit` : null,
    lifecycle.failSafe.cost?.spiritStones ? `${lifecycle.failSafe.cost.spiritStones} Spirit Stones` : null,
  ].filter(Boolean).join(' / ');
  const style = frameArtUrl
    ? ({ '--gate-trial-failsafe-art': `url(${frameArtUrl})` } as CSSProperties)
    : undefined;

  return (
    <section
      className={`gateTrialSafetyNetCard${frameArtUrl ? ' gateTrialSafetyNetCard--supported' : ''}`}
      style={style}
      aria-label="Gate Trial safety net status"
    >
      <h4 className="gateTrialSafetyNetCard__title">Safety Net</h4>
      <div>Eligible Failures: {lifecycle.failSafe.eligibleFailures} / {lifecycle.failSafe.threshold}</div>
      <div>Threshold: {lifecycle.failSafe.threshold} eligible failures.</div>
      <div>Cost: {costLine || 'No cost configured'}</div>
      <div>Current reserve: Gold {currentGold} · Merit {currentMerit} · Spirit Stones {currentSpiritStones}</div>
      <div>{reserveHeadline}</div>
      <div>{reserveGapLine}</div>
      <div>{eligibleDefeatRewardLine}</div>
      {!lifecycle.failSafe.canPurchase && lifecycle.failSafe.blockedReason ? <div>{lifecycle.failSafe.blockedReason}</div> : null}
      {lifecycle.failSafe.status === 'resolved' ? <div>Safety Net resolved for this gate.</div> : null}
    </section>
  );
}
