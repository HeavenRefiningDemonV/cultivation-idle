import type { ComponentType, MouseEvent } from 'react';
import type { LucideProps } from 'lucide-react';
import type { PrestigeUpgradeDef } from '../../content';

interface PrestigeUpgradePanelCardProps {
  upgrade: PrestigeUpgradeDef;
  level: number;
  maxLevel: number;
  costLabel: string;
  locked: boolean;
  lockedReason?: string;
  isMaxed: boolean;
  isSelected: boolean;
  isPurchasing: boolean;
  categoryLabel: string;
  CategoryIcon: ComponentType<LucideProps>;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function PrestigeUpgradePanelCard({
  upgrade,
  level,
  maxLevel,
  costLabel,
  locked,
  lockedReason,
  isMaxed,
  isSelected,
  isPurchasing,
  categoryLabel,
  CategoryIcon,
  onSelect,
}: PrestigeUpgradePanelCardProps) {
  const isOwned = level > 0;

  return (
    <button
      type="button"
      className={`prestigeUpgradePanel${locked ? ' is-locked' : ''}${isMaxed ? ' is-maxed' : ''}${
        isSelected ? ' is-selected' : ''
      }`}
      aria-disabled={locked}
      onClick={onSelect}
      title={lockedReason}
      data-state={isMaxed ? 'maxed' : locked ? 'locked' : isOwned ? 'owned' : 'available'}
      disabled={isPurchasing}
    >
      <div className="prestigeUpgradePanel__top">
        <div className="prestigeUpgradePanel__titleRow">
          <div className="prestigeUpgradePanel__title">{upgrade.name}</div>
          <div className="prestigeUpgradePanel__categoryPill">
            <CategoryIcon aria-hidden="true" />
            <span>{categoryLabel}</span>
          </div>
        </div>
        <div className="prestigeUpgradePanel__metaRow">
          <div className="prestigeUpgradePanel__level">
            Lv {level}/{Math.max(1, maxLevel)}
          </div>
          <div className="prestigeUpgradePanel__cost">Cost: {costLabel}</div>
        </div>
      </div>
      <div className="prestigeUpgradePanel__badges">
        {locked && <span className="prestigeBadge prestigeBadge--locked">Locked</span>}
        {isMaxed && <span className="prestigeBadge prestigeBadge--maxed">Max</span>}
        {!locked && !isMaxed && isOwned && (
          <span className="prestigeBadge prestigeBadge--owned">Owned</span>
        )}
      </div>
    </button>
  );
}
