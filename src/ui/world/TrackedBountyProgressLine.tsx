import type { BountyInstance } from '../../stores/bountyStore.js';

export function TrackedBountyProgressLine(props: { bounty: BountyInstance; className?: string; compact?: boolean }) {
  const { bounty, className, compact = false } = props;
  const claimReady = bounty.progress >= bounty.target;
  const label = compact ? 'Bounty overlap' : 'Tracked Bounty';
  return (
    <div className={`${className ?? 'trackedBountyProgressLine'} ${compact ? 'trackedBountyProgressLine--compact' : ''}`.trim()}>
      <span className="trackedBountyProgressLine__label">{label}: {bounty.title}</span>
      <span className="trackedBountyProgressLine__progress">
        {bounty.progress} / {bounty.target}
        {claimReady ? ' • Ready' : ''}
      </span>
    </div>
  );
}
