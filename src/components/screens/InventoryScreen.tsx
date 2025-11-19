import { useState } from 'react';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { formatNumber } from '../../utils/numbers';
import type { ItemDefinition, ItemRarity } from '../../types';

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
      return 'border-gray-400 bg-gray-50';
    case 'uncommon':
      return 'border-green-500 bg-green-50';
    case 'rare':
      return 'border-blue-500 bg-blue-50';
    case 'epic':
      return 'border-purple-500 bg-purple-50';
    case 'legendary':
      return 'border-orange-500 bg-orange-50';
    case 'mythic':
      return 'border-red-500 bg-red-50';
    default:
      return 'border-gray-400 bg-gray-50';
  }
}

/**
 * Get rarity text color
 */
function getRarityTextColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return 'text-gray-700';
    case 'uncommon':
      return 'text-green-700';
    case 'rare':
      return 'text-blue-700';
    case 'epic':
      return 'text-purple-700';
    case 'legendary':
      return 'text-orange-700';
    case 'mythic':
      return 'text-red-700';
    default:
      return 'text-gray-700';
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
    <div className="bg-slate-800/50 border-2 border-gold-accent/30 rounded-lg p-4">
      <h3 className="text-lg font-cinzel font-bold text-gold-accent mb-3 capitalize">
        {slotType}
      </h3>

      {item ? (
        <div className="space-y-3">
          {/* Item Name */}
          <div className={`font-semibold ${getRarityTextColor(item.rarity)}`}>
            {item.name}
          </div>

          {/* Item Description */}
          <p className="text-sm text-slate-400">{item.description}</p>

          {/* Stats */}
          {item.stats && (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
              <div className="text-xs space-y-1">
                {item.stats.atk && (
                  <div className="text-green-400">⚔️ ATK: +{formatNumber(item.stats.atk)}</div>
                )}
                {item.stats.def && (
                  <div className="text-green-400">🛡️ DEF: +{formatNumber(item.stats.def)}</div>
                )}
                {item.stats.hp && (
                  <div className="text-green-400">❤️ HP: +{formatNumber(item.stats.hp)}</div>
                )}
                {item.stats.crit && item.stats.crit > 0 && (
                  <div className="text-green-400">💥 Crit: +{item.stats.crit}%</div>
                )}
                {item.stats.critDmg && item.stats.critDmg > 0 && (
                  <div className="text-green-400">⚡ Crit Dmg: +{item.stats.critDmg}%</div>
                )}
                {item.stats.dodge && item.stats.dodge > 0 && (
                  <div className="text-green-400">🌀 Dodge: +{item.stats.dodge}%</div>
                )}
                {item.stats.qiGain && item.stats.qiGain > 0 && (
                  <div className="text-green-400">✨ Qi Gain: +{item.stats.qiGain}%</div>
                )}
              </div>
            </div>
          )}

          {/* Unequip Button */}
          <button
            onClick={onUnequip}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            Unequip
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl text-slate-600 mb-2">
            {slotType === 'weapon' ? '⚔️' : '💎'}
          </div>
          <div className="text-sm text-slate-500 italic">Empty Slot</div>
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
}

function ItemCard({ itemId, quantity, onEquip, onUse }: ItemCardProps) {
  const itemDef = getItemDefinition(itemId);

  if (!itemDef) {
    return null;
  }

  const isEquipment = itemDef.type === 'weapon' || itemDef.type === 'accessory';
  const isConsumable = itemDef.type === 'consumable';

  return (
    <div className={`border-2 rounded-lg p-4 transition-all hover:scale-105 ${getRarityColor(itemDef.rarity)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className={`font-semibold font-cinzel ${getRarityTextColor(itemDef.rarity)}`}>
            {itemDef.name}
          </h3>
          <div className="text-xs text-slate-600 mt-1 capitalize">
            {itemDef.rarity} • Lv {itemDef.level}
          </div>
        </div>
        {quantity > 1 && (
          <div className="bg-slate-700 text-white text-xs px-2 py-1 rounded font-bold">
            x{quantity}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-700 mb-3 leading-relaxed">{itemDef.description}</p>

      {/* Stats for Equipment */}
      {itemDef.stats && (
        <div className="bg-green-50 border border-green-300 rounded p-2 mb-3">
          <div className="text-xs space-y-1">
            {itemDef.stats.atk && (
              <div className="text-green-800">⚔️ ATK: +{formatNumber(itemDef.stats.atk)}</div>
            )}
            {itemDef.stats.def && (
              <div className="text-green-800">🛡️ DEF: +{formatNumber(itemDef.stats.def)}</div>
            )}
            {itemDef.stats.hp && (
              <div className="text-green-800">❤️ HP: +{formatNumber(itemDef.stats.hp)}</div>
            )}
            {itemDef.stats.crit && itemDef.stats.crit > 0 && (
              <div className="text-green-800">💥 Crit: +{itemDef.stats.crit}%</div>
            )}
            {itemDef.stats.critDmg && itemDef.stats.critDmg > 0 && (
              <div className="text-green-800">⚡ Crit Dmg: +{itemDef.stats.critDmg}%</div>
            )}
            {itemDef.stats.dodge && itemDef.stats.dodge > 0 && (
              <div className="text-green-800">🌀 Dodge: +{itemDef.stats.dodge}%</div>
            )}
            {itemDef.stats.qiGain && itemDef.stats.qiGain > 0 && (
              <div className="text-green-800">✨ Qi Gain: +{itemDef.stats.qiGain}%</div>
            )}
          </div>
        </div>
      )}

      {/* Consumable Effects */}
      {itemDef.consumable && (
        <div className="bg-blue-50 border border-blue-300 rounded p-2 mb-3">
          <div className="text-xs text-blue-800">
            {itemDef.consumable.healHP && `Heals ${formatNumber(itemDef.consumable.healHP)} HP`}
            {itemDef.consumable.healPercent && `Heals ${itemDef.consumable.healPercent}% HP`}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isEquipment && (
          <button
            onClick={() => onEquip(itemId)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
          >
            Equip
          </button>
        )}
        {isConsumable && (
          <button
            onClick={() => onUse(itemId)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
          >
            Use
          </button>
        )}
        <button
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
          Inventory
        </h1>
        <div className="text-lg text-gold-accent/80">
          Gold: <span className="font-bold">{formatNumber(gold)}</span> 💰
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {items.length} / {maxSlots} slots used
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="bg-slate-900/50 rounded-lg border-2 border-gold-accent/30 p-6">
        <h2 className="text-2xl font-cinzel font-bold text-gold-accent mb-4">
          Equipped
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      <div className="flex gap-2 border-b-2 border-gold-accent/30">
        {(['all', 'weapons', 'accessories', 'consumables', 'materials'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold font-cinzel capitalize transition-all ${
              activeTab === tab
                ? 'text-gold-accent border-b-4 border-gold-accent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className="min-h-[400px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl text-slate-600 mb-4">📦</div>
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No Items in {activeTab}
            </h3>
            <p className="text-slate-500 text-sm">
              Defeat enemies to find loot!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                itemId={item.itemId}
                quantity={item.quantity}
                onEquip={handleEquip}
                onUse={handleUse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
