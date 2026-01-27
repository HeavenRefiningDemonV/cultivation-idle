import classNames from 'classnames';
import type { MetaChip } from '../../features/apothecary/potionMetaIcons';
import { GameIcon } from '../../ui/icons';
import './ConsumableMetaChips.scss';

type ConsumableMetaChipsProps = {
  chips: MetaChip[];
  className?: string;
  compact?: boolean;
};

export function ConsumableMetaChips({
  chips,
  className,
  compact = false,
}: ConsumableMetaChipsProps) {
  if (!chips.length) {
    return null;
  }

  return (
    <div
      className={classNames(
        'consumableMetaChips',
        compact && 'consumableMetaChips--compact',
        className,
      )}
      aria-label="Consumable metadata"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={`consumableMetaChip consumableMetaChip--${chip.key} apothecaryTooltip`}
          data-tooltip={chip.tooltip}
          aria-label={chip.tooltip}
          tabIndex={0}
        >
          <span className="consumableMetaChipIcon" aria-hidden="true">
            <GameIcon icon={chip.iconId} size={14} decorative />
          </span>
          {chip.text ? <span className="consumableMetaChipText">{chip.text}</span> : null}
        </span>
      ))}
    </div>
  );
}
