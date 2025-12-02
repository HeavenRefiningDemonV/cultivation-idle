import { useState } from 'react';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { formatNumber } from '../../utils/numbers';
import type { ItemDefinition, ItemRarity } from '../../types';
import styles from './InventoryScreen.module.css';

/**
 * Tab type for inventory sections
 */
type InventoryTabType = 'all' | 'weapons' | 'accessories' | 'consumables' | 'materials';

const rarityVisuals: Record<ItemRarity, { border: string; tagClass: string; text: string; fill: string }> = {
  common: { border: '#9ca3af', tagClass: styles.rarityCommon, text: '#374151', fill: '#f3f4f6' },
  uncommon: { border: '#22c55e', tagClass: styles.rarityUncommon, text: '#166534', fill: '#ecfdf3' },
  rare: { border: '#3b82f6', tagClass: styles.rarityRare, text: '#1d4ed8', fill: '#eff6ff' },
  epic: { border: '#a855f7', tagClass: styles.rarityEpic, text: '#6b21a8', fill: '#f5ebff' },
  legendary: { border: '#f97316', tagClass: styles.rarityLegendary, text: '#c2410c', fill: '#fff7ed' },
  mythic: { border: '#ef4444', tagClass: styles.rarityMythic, text: '#b91c1c', fill: '#fef2f2' },
};

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
    <div className={styles.slotCard}>
      <h3 className={styles.slotTitle}>{slotType}</h3>

      {item ? (
        <div className={styles.slotContent}>
          <div className={`${styles.rarityTag} ${rarityVisuals[item.rarity].tagClass}`}>{item.name}</div>

          <p className={styles.description}>{item.description}</p>

          {item.stats && (
            <div className={styles.statBlock}>
              {item.stats.atk && <div className={styles.statLine}>⚔️ ATK: +{formatNumber(item.stats.atk)}</div>}
              {item.stats.def && <div className={styles.statLine}>🛡️ DEF: +{formatNumber(item.stats.def)}</div>}
              {item.stats.hp && <div className={styles.statLine}>❤️ HP: +{formatNumber(item.stats.hp)}</div>}
              {item.stats.crit && item.stats.crit > 0 && (
                <div className={styles.statLine}>💥 Crit: +{item.stats.crit}%</div>
              )}
              {item.stats.critDmg && item.stats.critDmg > 0 && (
                <div className={styles.statLine}>⚡ Crit Dmg: +{item.stats.critDmg}%</div>
              )}
              {item.stats.dodge && item.stats.dodge > 0 && (
                <div className={styles.statLine}>🌀 Dodge: +{item.stats.dodge}%</div>
              )}
              {item.stats.qiGain && item.stats.qiGain > 0 && (
                <div className={styles.statLine}>✨ Qi Gain: +{item.stats.qiGain}%</div>
              )}
            </div>
          )}

          <button onClick={onUnequip} className={`${styles.button} ${styles.buttonDanger}`}>
            Unequip
          </button>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{slotType === 'weapon' ? '⚔️' : '💍'}</div>
          <div className={styles.emptySubtitle}>Empty Slot</div>
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

  const rarity = rarityVisuals[itemDef.rarity];
  const isEquipment = itemDef.type === 'weapon' || itemDef.type === 'accessory';
  const isConsumable = itemDef.type === 'consumable';

  return (
    <div
      className={styles.itemCard}
      style={{ borderColor: rarity.border, background: `linear-gradient(180deg, rgba(12,18,32,0.9), ${rarity.fill})` }}
    >
      {/* Header */}
      <div className={styles.itemHeader}>
        <div>
          <h3 className={styles.itemTitle} style={{ color: rarity.text }}>
            {itemDef.name}
          </h3>
          <div className={styles.itemMeta}>
            {itemDef.rarity} • Lv {itemDef.level}
          </div>
        </div>
        {quantity > 1 && <div className={styles.quantityBadge}>x{quantity}</div>}
      </div>

      {/* Description */}
      <p className={styles.itemDescription}>{itemDef.description}</p>

      {/* Stats for Equipment */}
      {itemDef.stats && (
        <div className={styles.statBlock}>
          {itemDef.stats.atk && <div className={styles.statLine}>⚔️ ATK: +{formatNumber(itemDef.stats.atk)}</div>}
          {itemDef.stats.def && <div className={styles.statLine}>🛡️ DEF: +{formatNumber(itemDef.stats.def)}</div>}
          {itemDef.stats.hp && <div className={styles.statLine}>❤️ HP: +{formatNumber(itemDef.stats.hp)}</div>}
          {itemDef.stats.crit && itemDef.stats.crit > 0 && (
            <div className={styles.statLine}>💥 Crit: +{itemDef.stats.crit}%</div>
          )}
          {itemDef.stats.critDmg && itemDef.stats.critDmg > 0 && (
            <div className={styles.statLine}>⚡ Crit Dmg: +{itemDef.stats.critDmg}%</div>
          )}
          {itemDef.stats.dodge && itemDef.stats.dodge > 0 && (
            <div className={styles.statLine}>🌀 Dodge: +{itemDef.stats.dodge}%</div>
          )}
          {itemDef.stats.qiGain && itemDef.stats.qiGain > 0 && (
            <div className={styles.statLine}>✨ Qi Gain: +{itemDef.stats.qiGain}%</div>
          )}
        </div>
      )}

      {/* Consumable Effects */}
      {itemDef.consumable && (
        <div className={styles.consumableBlock}>
          {itemDef.consumable.healHP && `Heals ${formatNumber(itemDef.consumable.healHP)} HP`}
          {itemDef.consumable.healPercent && `Heals ${itemDef.consumable.healPercent}% HP`}
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        {isEquipment && (
          <button onClick={() => onEquip(itemId)} className={`${styles.button} ${styles.buttonPrimary}`}>
            Equip
          </button>
        )}
        {isConsumable && (
          <button onClick={() => onUse(itemId)} className={`${styles.button} ${styles.buttonSuccess}`}>
            Use
          </button>
        )}
        <button
          onClick={() => onSell(itemId, quantity)}
          className={`${styles.button} ${styles.buttonGold}`}
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
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Inventory</h1>
        <div className={styles.goldText}>
          Gold: <span className={styles.panelTitle}>{formatNumber(gold)}</span> 💰
        </div>
        <div className={styles.subtitle}>
          {items.length} / {maxSlots} slots used
        </div>
      </div>

      {/* Equipment Slots */}
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Equipped</h2>
        <div className={styles.equipmentGrid}>
          <EquipmentSlot slotType="weapon" item={equippedWeapon} onUnequip={unequipWeapon} />
          <EquipmentSlot slotType="accessory" item={equippedAccessory} onUnequip={unequipAccessory} />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['all', 'weapons', 'accessories', 'consumables', 'materials'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className={styles.inventoryArea}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>No Items in {activeTab}</div>
            <div className={styles.emptySubtitle}>Defeat enemies to find loot!</div>
          </div>
        ) : (
          <div className={styles.inventoryGrid}>
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
