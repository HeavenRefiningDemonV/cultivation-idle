import type { CSSProperties } from 'react';
import type { PrestigeUpgradeDef } from '../../systems/prestige/applyPrestigeEffects';
import { getPrestigeCategoryKey } from '../../features/prestige/prestigeCategories';
import {
  getPrestigeCategoryIcon,
  getPrestigeEdictKind,
  getPrestigeKindIcon,
} from '../../features/prestige/prestigeEdictIconMap';

interface PrestigeEdictSpineProps {
  upgrade: PrestigeUpgradeDef;
  level: number;
  maxLevel: number;
  cost: number;
  canAfford: boolean;
  locked: boolean;
  lockedReason?: string;
  isPurchasing: boolean;
  onPurchase: () => void;
}

export function PrestigeEdictSpine({
  upgrade,
  level,
  maxLevel,
  cost,
  canAfford,
  locked,
  lockedReason,
  isPurchasing,
  onPurchase,
}: PrestigeEdictSpineProps) {
  const categoryKey = getPrestigeCategoryKey(upgrade.id);
  const kind = getPrestigeEdictKind(upgrade.id);
  const categoryIcon = getPrestigeCategoryIcon(categoryKey);
  const kindIcon = getPrestigeKindIcon(kind);
  const isMaxed = level >= maxLevel;
  const progress = maxLevel > 0 ? Math.min(1, level / maxLevel) : 0;
  const state = isMaxed ? 'maxed' : locked ? 'locked' : canAfford ? 'affordable' : 'available';
  const buttonLabel = isMaxed ? 'MAX' : locked ? 'LOCKED' : `Seal · ${cost} AP`;
  const reasonId = lockedReason ? `prestige-edict-reason-${upgrade.id}` : undefined;
  const progressStyle = { ['--progress' as string]: `${progress * 100}%` } as CSSProperties;

  return (
    <div
      className="prestigeEdictSpine"
      data-state={state}
      data-category={categoryKey}
      data-kind={kind}
      role="listitem"
    >
      <div className="prestigeEdictIconRow" aria-label={`${categoryIcon.label}, ${kindIcon.label}`}>
        <span className="prestigeEdictIcon" title={categoryIcon.label} aria-label={categoryIcon.label}>
          <categoryIcon.Icon aria-hidden="true" />
        </span>
        <span className="prestigeEdictIcon" title={kindIcon.label} aria-label={kindIcon.label}>
          <kindIcon.Icon aria-hidden="true" />
        </span>
      </div>

      <div className="prestigeEdictName" title={upgrade.name}>
        <span>{upgrade.name}</span>
      </div>

      <div className="prestigeEdictProgress" style={progressStyle} aria-hidden="true">
        <span className="prestigeEdictProgressFill" />
      </div>

      {(isMaxed || locked) && (
        <div className="prestigeEdictBadge" aria-hidden="true">
          {isMaxed ? 'MAX' : 'LOCKED'}
        </div>
      )}

      {lockedReason && (
        <span id={reasonId} className="prestigeEdictVisuallyHidden">
          {lockedReason}
        </span>
      )}

      <button
        type="button"
        className="prestigeEdictSealButton"
        disabled={locked || isMaxed || !canAfford || isPurchasing}
        onClick={onPurchase}
        title={lockedReason ?? buttonLabel}
        aria-describedby={reasonId}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
