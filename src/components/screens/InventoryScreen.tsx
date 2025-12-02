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
      return 'inventoryScreenRarityCommon';
    case 'uncommon':
      return 'inventoryScreenRarityUncommon';
    case 'rare':
      return 'inventoryScreenRarityRare';
    case 'epic':
      return 'inventoryScreenRarityEpic';
    case 'legendary':
      return 'inventoryScreenRarityLegendary';
    case 'mythic':
      return 'inventoryScreenRarityMythic';
    default:
      return 'inventoryScreenRarityCommon';
  }
}

/**
 * Get rarity text color
 */
function getRarityTextColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return 'inventoryScreenTextCommon';
    case 'uncommon':
      return 'inventoryScreenTextUncommon';
    case 'rare':
      return 'inventoryScreenTextRare';
    case 'epic':
      return 'inventoryScreenTextEpic';
    case 'legendary':
      return 'inventoryScreenTextLegendary';
    case 'mythic':
      return 'inventoryScreenTextMythic';
    default:
      return 'inventoryScreenTextCommon';
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
    <div className={'inventoryScreenSlotCard'}>
      <h3 className={'inventoryScreenSlotTitle'}>{slotType}</h3>

      {item ? (
        <div className={'inventoryScreenSlotContent'}>
          {/* Item Name */}
          <div className={`${'inventoryScreenSlotName'} ${getRarityTextColor(item.rarity)}`}>
            {item.name}
          </div>

          {/* Item Description */}
          <p className={'inventoryScreenSlotDescription'}>{item.description}</p>

          {/* Stats */}
          {item.stats && (
            <div className={'inventoryScreenStatBlock'}>
              {item.stats.atk && (
                <div className={'inventoryScreenStatLine'}>⚔️ ATK: +{formatNumber(item.stats.atk)}</div>
              )}
              {item.stats.def && (
                <div className={'inventoryScreenStatLine'}>🛡️ DEF: +{formatNumber(item.stats.def)}</div>
              )}
              {item.stats.hp && <div className={'inventoryScreenStatLine'}>❤️ HP: +{formatNumber(item.stats.hp)}</div>}
              {item.stats.crit && item.stats.crit > 0 && (
                <div className={'inventoryScreenStatLine'}>💥 Crit: +{item.stats.crit}%</div>
              )}
              {item.stats.critDmg && item.stats.critDmg > 0 && (
                <div className={'inventoryScreenStatLine'}>⚡ Crit Dmg: +{item.stats.critDmg}%</div>
              )}
              {item.stats.dodge && item.stats.dodge > 0 && (
                <div className={'inventoryScreenStatLine'}>🌀 Dodge: +{item.stats.dodge}%</div>
              )}
              {item.stats.qiGain && item.stats.qiGain > 0 && (
                <div className={'inventoryScreenStatLine'}>✨ Qi Gain: +{item.stats.qiGain}%</div>
              )}
            </div>
          )}

          {/* Unequip Button */}
          <button onClick={onUnequip} className={'inventoryScreenActionButton'}>
            Unequip
          </button>
        </div>
      ) : (
        <div className={'inventoryScreenSlotEmpty'}>
          <div className={'inventoryScreenSlotEmptyIcon'}>{slotType === 'weapon' ? '⚔️' : '💎'}</div>
          <div className={'inventoryScreenSlotDescription'}>Empty Slot</div>
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
    <div className={`${'inventoryScreenItemCard'} ${getRarityColor(itemDef.rarity)}`}>
      {/* Header */}
      <div className={'inventoryScreenItemHeader'}>
        <div>
          <h3 className={`${'inventoryScreenItemTitle'} ${getRarityTextColor(itemDef.rarity)}`}>{itemDef.name}</h3>
          <div className={'inventoryScreenItemMeta'}>
            {itemDef.rarity} • Lv {itemDef.level}
          </div>
        </div>
        {quantity > 1 && <div className={'inventoryScreenQuantityBadge'}>x{quantity}</div>}
      </div>

      {/* Description */}
      <p className={'inventoryScreenItemDescription'}>{itemDef.description}</p>

      {/* Stats for Equipment */}
      {itemDef.stats && (
        <div className={'inventoryScreenEquipmentStats'}>
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
        <div className={'inventoryScreenConsumableStats'}>
          {itemDef.consumable.healHP && `Heals ${formatNumber(itemDef.consumable.healHP)} HP`}
          {itemDef.consumable.healPercent && `Heals ${itemDef.consumable.healPercent}% HP`}
        </div>
      )}

      {/* Action Buttons */}
      <div className={'inventoryScreenItemActions'}>
        {isEquipment && (
          <button onClick={() => onEquip(itemId)} className={`${'inventoryScreenItemButton'} ${'inventoryScreenButtonEquip'}`}>
            Equip
          </button>
        )}
        {isConsumable && (
          <button onClick={() => onUse(itemId)} className={`${'inventoryScreenItemButton'} ${'inventoryScreenButtonUse'}`}>
            Use
          </button>
        )}
        <button
          onClick={() => onSell(itemId, quantity)}
          className={`${'inventoryScreenItemButton'} ${'inventoryScreenButtonSell'}`}
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
    <div className={'inventoryScreenRoot'}>
      {/* Header */}
      <div className={'inventoryScreenHeader'}>
        <h1 className={'inventoryScreenTitle'}>Inventory</h1>
        <div className={'inventoryScreenGoldRow'}>
          Gold: <span className={'inventoryScreenSlotName'}>{formatNumber(gold)}</span> 💰
        </div>
        <div className={'inventoryScreenSlotInfo'}>
          {items.length} / {maxSlots} slots used
        </div>
      </div>

      {/* Equipment Slots */}
      <div className={'inventoryScreenEquipmentPanel'}>
        <h2 className={'inventoryScreenSectionTitle'}>Equipped</h2>
        <div className={'inventoryScreenEquipmentGrid'}>
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
      <div className={'inventoryScreenTabs'}>
        {(['all', 'weapons', 'accessories', 'consumables', 'materials'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${'inventoryScreenTabButton'} ${activeTab === tab ? 'inventoryScreenTabButtonActive' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className={'inventoryScreenInventorySection'}>
        {filteredItems.length === 0 ? (
          <div className={'inventoryScreenEmptyState'}>
            <div className={'inventoryScreenEmptyIcon'}>📦</div>
            <h3 className={'inventoryScreenEmptyTitle'}>No Items in {activeTab}</h3>
            <p className={'inventoryScreenSlotDescription'}>Defeat enemies to find loot!</p>
          </div>
        ) : (
          <div className={'inventoryScreenCardGrid'}>
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
