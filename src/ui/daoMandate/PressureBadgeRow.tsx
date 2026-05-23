import classNames from 'classnames';

import type { DaoPressureBadgeState, DaoPressureBadgeV1 } from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import './PressureBadgeRow.scss';

export interface PressureBadgeRowProps {
  badges: DaoPressureBadgeV1[];
  maxVisible?: number;
  emptyLabel?: string;
  onBadgeInspect?: (badge: DaoPressureBadgeV1) => void;
  compact?: boolean;
  className?: string;
  testId?: string;
}

const STATE_LABELS: Record<DaoPressureBadgeState, string> = {
  quiet: 'Quiet',
  stable: 'Stable',
  unknown: 'Unknown',
  thin: 'Thin',
  strained: 'Strained',
  low: 'Low',
  ready: 'Ready',
};

export function PressureBadgeRow({
  badges,
  maxVisible = 3,
  emptyLabel = 'No pressure badge is active.',
  onBadgeInspect,
  compact = false,
  className,
  testId = 'dao-pressure-badge-row',
}: PressureBadgeRowProps) {
  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = Math.max(0, badges.length - visibleBadges.length);

  return (
    <section
      className={classNames('daoPressureBadgeRow', compact && 'daoPressureBadgeRow--compact', className)}
      aria-label="Pressure badges"
      data-testid={testId}
    >
      {visibleBadges.length === 0 ? <p className="daoPressureBadgeRow__empty">{emptyLabel}</p> : null}
      {visibleBadges.length > 0 ? (
        <div className="daoPressureBadgeRow__list" role="list">
          {visibleBadges.map((badge) => (
            <PressureBadgeItem key={badge.id} badge={badge} onBadgeInspect={onBadgeInspect} compact={compact} />
          ))}
          {hiddenCount > 0 ? (
            <span className="daoPressureBadgeRow__overflow" aria-label={`${hiddenCount} more pressure badges`}>
              +{hiddenCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PressureBadgeItem({
  badge,
  onBadgeInspect,
  compact,
}: {
  badge: DaoPressureBadgeV1;
  onBadgeInspect?: (badge: DaoPressureBadgeV1) => void;
  compact: boolean;
}) {
  const stateLabel = STATE_LABELS[badge.state];

  return (
    <article
      className={classNames('daoPressureBadge', `daoPressureBadge--${badge.state}`, `daoPressureBadge--tone-${badge.tone}`)}
      role="listitem"
      aria-label={`${badge.label}: ${stateLabel}`}
    >
      <span className="daoPressureBadge__icon" aria-hidden="true" data-icon-id={badge.iconId}>
        <span className="daoPressureBadge__glyph" />
      </span>
      <span className="daoPressureBadge__body">
        <span className="daoPressureBadge__label">{badge.label}</span>
        <span className="daoPressureBadge__state">{stateLabel}</span>
        {!compact ? <span className="daoPressureBadge__detail">{badge.detail}</span> : null}
      </span>
      {onBadgeInspect ? (
        <button
          type="button"
          className="daoPressureBadge__inspect"
          onClick={() => onBadgeInspect(badge)}
          aria-label={`Inspect pressure badge: ${badge.label}`}
        >
          Inspect
        </button>
      ) : null}
    </article>
  );
}
