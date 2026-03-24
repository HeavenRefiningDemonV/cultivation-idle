import type { BountyInstance } from '../../stores/bountyStore.js';

export function TrackedBountyProgressLine(props: { bounty: BountyInstance; className?: string }) {
  const { bounty, className } = props;
  const claimReady = bounty.progress >= bounty.target;
  return (
    <div className={className ?? 'trackedBountyProgressLine'}>
      <span className="trackedBountyProgressLine__label">Tracked Bounty: {bounty.title}</span>
      <span className="trackedBountyProgressLine__progress">
        {bounty.progress} / {bounty.target}
        {claimReady ? ' • Claim Ready' : ''}
      </span>
    </div>
  );
}
