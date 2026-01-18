import type { ItemType } from '../../types';
import type { DisplayStack } from './inventoryTypes';

type InventorySlotTileProps = {
  stack: DisplayStack;
  isSelected: boolean;
  isNew: boolean;
  onSelect: () => void;
};

const getTypeGlyph = (type: ItemType | string): string => {
  switch (type) {
    case 'weapon':
      return '🗡️';
    case 'accessory':
      return '🧿';
    case 'consumable':
      return '💊';
    case 'material':
      return '🪨';
    case 'treasure':
      return '💎';
    default:
      return '📦';
  }
};

const getRarityClass = (rarity?: string): string => {
  switch ((rarity ?? 'common').toLowerCase()) {
    case 'uncommon':
      return 'inventorySlotRarityUncommon';
    case 'rare':
      return 'inventorySlotRarityRare';
    case 'epic':
      return 'inventorySlotRarityEpic';
    case 'legendary':
      return 'inventorySlotRarityLegendary';
    case 'mythic':
      return 'inventorySlotRarityMythic';
    case 'common':
    default:
      return 'inventorySlotRarityCommon';
  }
};

export default function InventorySlotTile({ stack, isSelected, isNew, onSelect }: InventorySlotTileProps) {
  const rarityClass = getRarityClass(stack.rarity);
  const labelRarity = stack.rarity ?? 'common';
  return (
    <button
      type="button"
      className={`inventorySlotTile inventorySlotTileOccupied ${rarityClass}${
        isSelected ? ' inventorySlotTileSelected' : ''
      }${isNew ? ' inventorySlotTileNew' : ''}`}
      onClick={onSelect}
      aria-label={`${stack.name}, ${stack.type}, ${labelRarity}, quantity ${stack.quantity}`}
      title={`${stack.name} (${stack.type})`}
      role="gridcell"
    >
      <div className="inventorySlotTileIcon" aria-hidden="true">
        {getTypeGlyph(stack.type)}
      </div>

      {stack.quantity > 1 ? (
        <div className="inventorySlotTileQty" aria-hidden="true">
          x{stack.quantity}
        </div>
      ) : null}

      {stack.stackable && (stack.maxStack ?? 0) > 1 ? (
        <div className="inventorySlotTileStackGauge" aria-hidden="true">
          <div
            className="inventorySlotTileStackGaugeFill"
            style={{ width: `${Math.min(100, (stack.quantity / (stack.maxStack ?? 1)) * 100)}%` }}
          />
        </div>
      ) : null}

      {isNew ? <div className="inventorySlotTileNewDot" aria-hidden="true" /> : null}
    </button>
  );
}
