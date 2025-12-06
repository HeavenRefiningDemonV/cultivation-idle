import { useState } from 'react';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { formatNumber } from '../../utils/numbers';
import type { ItemDefinition, ItemRarity } from '../../types';
import './InventoryScreen.scss';

/**
 * Tab type for inventory sections
 */
type InventoryTabType = 'all' | 'weapons' | 'accessories' | 'consumables' | 'materials';

/**
 * Get rarity-specific styling
 */
function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return 'inventory-screen__rarity-common';
    case 'uncommon':
      return 'inventory-screen__rarity-uncommon';
    case 'rare':
      return 'inventory-screen__rarity-rare';
    case 'epic':
      return 'inventory-screen__rarity-epic';
    case 'legendary':
      return 'inventory-screen__rarity-legendary';
    case 'mythic':
      return 'inventory-screen__rarity-mythic';
    default:
      return 'inventory-screen__rarity-common';
  }
}

/**
 * Get rarity text color
 */
function getRarityTextColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return 'inventory-screen__text-common';
    case 'uncommon':
      return 'inventory-screen__text-uncommon';
    case 'rare':
      return 'inventory-screen__text-rare';
    case 'epic':
      return 'inventory-screen__text-epic';
    case 'legendary':
      return 'inventory-screen__text-legendary';
    case 'mythic':
      return 'inventory-screen__text-mythic';
    default:
      return 'inventory-screen__text-common';
  }
}

/**
 * Equipment Slot Component
 */
interface EquipmentSlotProps {
  slotType: 'weapon' | 'accessory';
  item: ItemDefinition | null;
  onUnequip: () => void;
}

function EquipmentSlot({ slotType, item, onUnequip }: EquipmentSlotProps) {
  return (
    <div className={'inventory-screen__slot-card'}>
      <h3 className={'inventory-screen__slot-title'}>{slotType}</h3>

      {item ? (
        <div className={'inventory-screen__slot-content'}>
          {/* Item Name */}
          <div className={`${'inventory-screen__slot-name'} ${getRarityTextColor(item.rarity)}`}>
            {item.name}
          </div>

          {/* Item Description */}
          <p className={'inventory-screen__slot-description'}>{item.description}</p>

          {/* Stats */}
          {item.stats && (
            <div className={'inventory-screen__stat-block'}>
              {item.stats.atk && (
                <div className={'inventory-screen__stat-line'}>⚔️ ATK: +{formatNumber(item.stats.atk)}</div>
              )}
              {item.stats.def && (
                <div className={'inventory-screen__stat-line'}>🛡️ DEF: +{formatNumber(item.stats.def)}</div>
              )}
              {item.stats.hp && <div className={'inventory-screen__stat-line'}>❤️ HP: +{formatNumber(item.stats.hp)}</div>}
              {item.stats.crit && item.stats.crit > 0 && (
                <div className={'inventory-screen__stat-line'}>💥 Crit: +{item.stats.crit}%</div>
              )}
              {item.stats.critDmg && item.stats.critDmg > 0 && (
                <div className={'inventory-screen__stat-line'}>⚡ Crit Dmg: +{item.stats.critDmg}%</div>
              )}
              {item.stats.dodge && item.stats.dodge > 0 && (
                <div className={'inventory-screen__stat-line'}>🌀 Dodge: +{item.stats.dodge}%</div>
              )}
              {item.stats.qiGain && item.stats.qiGain > 0 && (
                <div className={'inventory-screen__stat-line'}>✨ Qi Gain: +{item.stats.qiGain}%</div>
              )}
            </div>
          )}

          {/* Unequip Button */}
          <button onClick={onUnequip} className={'inventory-screen__action-button'}>
            Unequip
          </button>
        </div>
      ) : (
        <div className={'inventory-screen__slot-empty'}>
          <div className={'inventory-screen__slot-empty-icon'}>{slotType === 'weapon' ? '⚔️' : '💎'}</div>
          <div className={'inventory-screen__slot-description'}>Empty Slot</div>
        </div>
      )}
    </div>
  );
}

/**
 * Item Card Component
 */
interface ItemCardProps {
  itemId: string;
  quantity: number;
  onEquip: (itemId: string) => void;
  onUse: (itemId: string) => void;
  onSell: (itemId: string, quantity: number) => void;
}

function ItemCard({ itemId, quantity, onEquip, onUse, onSell }: ItemCardProps) {
  const itemDef = getItemDefinition(itemId);

  if (!itemDef) {
    return null;
  }

  const isEquipment = itemDef.type === 'weapon' || itemDef.type === 'accessory';
  const isConsumable = itemDef.type === 'consumable';

  return (
    <div className={`${'inventory-screen__item-card'} ${getRarityColor(itemDef.rarity)}`}>
      {/* Header */}
      <div className={'inventory-screen__item-header'}>
        <div>
          <h3 className={`${'inventory-screen__item-title'} ${getRarityTextColor(itemDef.rarity)}`}>{itemDef.name}</h3>
          <div className={'inventory-screen__item-meta'}>
            {itemDef.rarity} • Lv {itemDef.level}
          </div>
        </div>
        {quantity > 1 && <div className={'inventory-screen__quantity-badge'}>x{quantity}</div>}
      </div>

      {/* Description */}
      <p className={'inventory-screen__item-description'}>{itemDef.description}</p>

      {/* Stats for Equipment */}
      {itemDef.stats && (
        <div className={'inventory-screen__equipment-stats'}>
          {itemDef.stats.atk && <div>⚔️ ATK: +{formatNumber(itemDef.stats.atk)}</div>}
          {itemDef.stats.def && <div>🛡️ DEF: +{formatNumber(itemDef.stats.def)}</div>}
          {itemDef.stats.hp && <div>❤️ HP: +{formatNumber(itemDef.stats.hp)}</div>}
          {itemDef.stats.crit && itemDef.stats.crit > 0 && <div>💥 Crit: +{itemDef.stats.crit}%</div>}
          {itemDef.stats.critDmg && itemDef.stats.critDmg > 0 && <div>⚡ Crit Dmg: +{itemDef.stats.critDmg}%</div>}
          {itemDef.stats.dodge && itemDef.stats.dodge > 0 && <div>🌀 Dodge: +{itemDef.stats.dodge}%</div>}
          {itemDef.stats.qiGain && itemDef.stats.qiGain > 0 && <div>✨ Qi Gain: +{itemDef.stats.qiGain}%</div>}
        </div>
      )}

      {/* Consumable Effects */}
      {itemDef.consumable && (
        <div className={'inventory-screen__consumable-stats'}>
          {itemDef.consumable.healHP && `Heals ${formatNumber(itemDef.consumable.healHP)} HP`}
          {itemDef.consumable.healPercent && `Heals ${itemDef.consumable.healPercent}% HP`}
        </div>
      )}

      {/* Action Buttons */}
      <div className={'inventory-screen__item-actions'}>
        {isEquipment && (
          <button onClick={() => onEquip(itemId)} className={`${'inventory-screen__item-button'} ${'inventory-screen__button-equip'}`}>
            Equip
          </button>
        )}
        {isConsumable && (
          <button onClick={() => onUse(itemId)} className={`${'inventory-screen__item-button'} ${'inventory-screen__button-use'}`}>
            Use
          </button>
        )}
        <button
          onClick={() => onSell(itemId, quantity)}
          className={`${'inventory-screen__item-button'} ${'inventory-screen__button-sell'}`}
          title={`Sell for ${formatNumber(itemDef.value)} gold`}
        >
          Sell
        </button>
      </div>
    </div>
  );
}

/**
 * Main Inventory Screen Component
 */
export function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<InventoryTabType>('all');

  const {
    items,
    equippedWeapon,
    equippedAccessory,
    gold,
    maxSlots,
    equipWeapon,
    unequipWeapon,
    equipAccessory,
    unequipAccessory,
    useConsumable: consumeItem,
    sellItem,
  } = useInventoryStore();

  // Filter items based on active tab
  const filteredItems = items.filter((item) => {
    const itemDef = getItemDefinition(item.itemId);
    if (!itemDef) return false;

    switch (activeTab) {
      case 'all':
        return true;
      case 'weapons':
        return itemDef.type === 'weapon';
      case 'accessories':
        return itemDef.type === 'accessory';
      case 'consumables':
        return itemDef.type === 'consumable';
      case 'materials':
        return itemDef.type === 'material' || itemDef.type === 'treasure';
      default:
        return true;
    }
  });

  // Handle equip action
  const handleEquip = (itemId: string) => {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) return;

    if (itemDef.type === 'weapon') {
      equipWeapon(itemId);
    } else if (itemDef.type === 'accessory') {
      equipAccessory(itemId);
    }
  };

  // Handle use consumable
  const handleUse = (itemId: string) => {
    consumeItem(itemId);
  };

  const handleSell = (itemId: string, quantity: number) => {
    sellItem(itemId, quantity);
  };

  return (
    <div className={'inventory-screen'}>
      {/* Header */}
      <div className={'inventory-screen__header'}>
        <h1 className={'inventory-screen__title'}>Inventory</h1>
        <div className={'inventory-screen__gold-row'}>
          Gold: <span className={'inventory-screen__slot-name'}>{formatNumber(gold)}</span> 💰
        </div>
        <div className={'inventory-screen__slot-info'}>
          {items.length} / {maxSlots} slots used
        </div>
      </div>

      {/* Equipment Slots */}
      <div className={'inventory-screen__equipment-panel'}>
        <h2 className={'inventory-screen__section-title'}>Equipped</h2>
        <div className={'inventory-screen__equipment-grid'}>
          <EquipmentSlot
            slotType="weapon"
            item={equippedWeapon}
            onUnequip={unequipWeapon}
          />
          <EquipmentSlot
            slotType="accessory"
            item={equippedAccessory}
            onUnequip={unequipAccessory}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={'inventory-screen__tabs'}>
        {(['all', 'weapons', 'accessories', 'consumables', 'materials'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${'inventory-screen__tab-button'} ${activeTab === tab ? 'inventory-screen__tab-button-active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className={'inventory-screen__inventory-section'}>
        {filteredItems.length === 0 ? (
          <div className={'inventory-screen__empty-state'}>
            <div className={'inventory-screen__empty-icon'}>📦</div>
            <h3 className={'inventory-screen__empty-title'}>No Items in {activeTab}</h3>
            <p className={'inventory-screen__slot-description'}>Defeat enemies to find loot!</p>
          </div>
        ) : (
          <div className={'inventory-screen__card-grid'}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                itemId={item.itemId}
                quantity={item.quantity}
                onEquip={handleEquip}
                onUse={handleUse}
                onSell={handleSell}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
