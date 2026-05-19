import type { VisualBadgeSurface } from '../../features/techniques/techniqueVisualIdentity.js';
import { GameIcon, ICONS, type IconId } from '../icons/index.js';

interface VisualIdentityBadgeProps {
  badge: VisualBadgeSurface;
  className?: string;
  showSublabel?: boolean;
  compact?: boolean;
}

function isIconId(value: string | null | undefined): value is IconId {
  return Boolean(value && value in ICONS);
}

export function VisualIdentityBadge({ badge, className, showSublabel = false, compact = false }: VisualIdentityBadgeProps) {
  const iconId = isIconId(badge.iconId) ? badge.iconId : null;
  const label = compact ? badge.shortLabel ?? badge.label : badge.label;
  const badgeClassName = [
    'visualIdentityBadge',
    compact ? 'visualIdentityBadge--compact' : null,
    showSublabel ? 'visualIdentityBadge--withSublabel' : null,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={badgeClassName}
      data-badge-kind={badge.badgeKind}
      data-tone={badge.tone}
      data-key={badge.dataKey}
      aria-label={badge.ariaLabel}
      title={badge.ariaLabel}
    >
      {iconId ? <GameIcon icon={iconId} size={14} decorative /> : null}
      <span className="visualIdentityBadge__text">
        <span className="visualIdentityBadge__label">{label}</span>
        {showSublabel && badge.sublabel ? (
          <small className="visualIdentityBadge__sublabel">{badge.sublabel}</small>
        ) : null}
      </span>
    </span>
  );
}
