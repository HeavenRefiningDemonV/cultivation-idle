import type { ReactNode } from 'react';
import type { BountyInstance } from '../../stores/bountyStore.js';

export function TrackedBountyProgressLine(props: {
  bounty?: BountyInstance;
  className?: string;
  compact?: boolean;
  title?: string;
  progressText?: string;
  detailLine?: ReactNode;
}) {
  const { bounty, className, compact = false, title, progressText, detailLine } = props;
  const fallbackProgress = bounty ? `${bounty.progress} / ${bounty.target}${bounty.progress >= bounty.target ? ' • Ready' : ''}` : '0 / 0';
  const label = compact ? 'Bounty overlap' : 'Tracked Bounty';
  const resolvedTitle = title ?? bounty?.title ?? 'Tracked bounty';
  return (
    <div className={`${className ?? 'trackedBountyProgressLine'} ${compact ? 'trackedBountyProgressLine--compact' : ''}`.trim()}>
      <span className="trackedBountyProgressLine__label">{label}: {resolvedTitle}</span>
      <span className="trackedBountyProgressLine__progress">
        {progressText ?? fallbackProgress}
      </span>
      {detailLine ? <span className="trackedBountyProgressLine__detail">{detailLine}</span> : null}
    </div>
  );
}
