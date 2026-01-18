// Inventory v2 equipment drawer to reduce clutter; opened via button.
import { useEffect, useMemo, useState } from 'react';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { getItemDef } from '../../stores/contentStore';
import type { ItemDefinition } from '../../types';
import './EquipmentDrawer.scss';

type EquipmentDrawerProps = {
  open: boolean;
  onClose: () => void;
  selectedItemId: string | null;
  selectedItemType: string | null;
  selectedItemName: string | null;
  onRequestClearSelection?: () => void;
};

type EquipmentSlotType = 'weapon' | 'accessory';

type StatEntry = { label: string; value: string };

const SLOT_CONFIG: Record<EquipmentSlotType, { label: string; icon: string }> = {
  weapon: { label: 'Weapon', icon: '⚔️' },
  accessory: { label: 'Accessory', icon: '💎' },
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

const formatStatValue = (key: string, value: string | number) => {
  const numeric = typeof value === 'number' ? value.toString() : value;
  if (['crit', 'critDmg', 'dodge', 'qiGain'].includes(key)) {
    return `${numeric}%`;
  }
  return numeric;
};

const buildStatEntries = (def: ItemDefinition | null): StatEntry[] => {
  if (!def?.stats) return [];
  const stats = def.stats;
  const entries: StatEntry[] = [];
  if (stats.atk !== undefined) entries.push({ label: 'Attack', value: formatStatValue('atk', stats.atk) });
  if (stats.def !== undefined) entries.push({ label: 'Defense', value: formatStatValue('def', stats.def) });
  if (stats.hp !== undefined) entries.push({ label: 'Health', value: formatStatValue('hp', stats.hp) });
  if (stats.crit !== undefined) entries.push({ label: 'Crit', value: formatStatValue('crit', stats.crit) });
  if (stats.critDmg !== undefined) entries.push({ label: 'Crit Dmg', value: formatStatValue('critDmg', stats.critDmg) });
  if (stats.dodge !== undefined) entries.push({ label: 'Dodge', value: formatStatValue('dodge', stats.dodge) });
  if (stats.qiGain !== undefined) entries.push({ label: 'Qi Gain', value: formatStatValue('qiGain', stats.qiGain) });
  return entries;
};

export default function EquipmentDrawer({
  open,
  onClose,
  selectedItemId,
  selectedItemType,
  selectedItemName,
  onRequestClearSelection,
}: EquipmentDrawerProps) {
  const equippedWeaponId = useEquipmentStore((state) => state.equippedWeaponId);
  const equippedAccessoryId = useEquipmentStore((state) => state.equippedAccessoryId);
  const equipWeapon = useEquipmentStore((state) => state.equipWeapon);
  const equipAccessory = useEquipmentStore((state) => state.equipAccessory);
  const addItem = useInventoryStore((state) => state.addItem);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const addNotification = useUIStore((state) => state.addNotification);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [pendingReplaceSlot, setPendingReplaceSlot] = useState<EquipmentSlotType | null>(null);
  const [pulseSlot, setPulseSlot] = useState<EquipmentSlotType | null>(null);

  const equippedWeapon = useMemo(
    () => (equippedWeaponId ? getItemDef(equippedWeaponId) ?? null : null),
    [equippedWeaponId],
  );
  const equippedAccessory = useMemo(
    () => (equippedAccessoryId ? getItemDef(equippedAccessoryId) ?? null : null),
    [equippedAccessoryId],
  );

  const selectedSlotDef = selectedSlot === 'weapon' ? equippedWeapon : selectedSlot === 'accessory' ? equippedAccessory : null;

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, open]);

  useEffect(() => {
    if (!pendingReplaceSlot) return;
    if (!selectedItemId || selectedItemType !== pendingReplaceSlot) {
      setPendingReplaceSlot(null);
    }
  }, [pendingReplaceSlot, selectedItemId, selectedItemType]);

  const triggerPulse = (slot: EquipmentSlotType) => {
    setPulseSlot(slot);
    window.setTimeout(() => setPulseSlot((prev) => (prev === slot ? null : prev)), 700);
  };

  const slotIsCompatible = (slot: EquipmentSlotType) => selectedItemType === slot && Boolean(selectedItemId);

  const handleEquip = (slot: EquipmentSlotType, isReplace: boolean) => {
    if (!selectedItemId || selectedItemType !== slot) {
      addNotification('warning', 'Could not equip.', 2500);
      return;
    }

    const equippedId = slot === 'weapon' ? equippedWeaponId : equippedAccessoryId;
    if (equippedId && equippedId === selectedItemId) {
      addNotification('info', 'That item is already equipped.', 2000);
      return;
    }

    const removed = removeItem(selectedItemId, 1);
    if (!removed) {
      addNotification('warning', 'Could not equip.', 2500);
      return;
    }

    if (equippedId) {
      addItem(equippedId, 1);
    }

    if (slot === 'weapon') {
      equipWeapon(selectedItemId);
    } else {
      equipAccessory(selectedItemId);
    }

    if (isReplace) {
      addNotification('info', 'Replaced equipment.', 2000);
    } else {
      addNotification('success', `Equipped ${selectedItemName ?? 'item'}.`, 2000);
    }

    triggerPulse(slot);
    setPendingReplaceSlot(null);
    setSelectedSlot(slot);
    onRequestClearSelection?.();
  };

  const handleUnequip = (slot: EquipmentSlotType) => {
    const equippedId = slot === 'weapon' ? equippedWeaponId : equippedAccessoryId;
    if (!equippedId) return;
    addItem(equippedId, 1);
    if (slot === 'weapon') {
      equipWeapon(null);
    } else {
      equipAccessory(null);
    }
    addNotification('success', 'Unequipped.', 2000);
    triggerPulse(slot);
  };

  const handleSlotClick = (slot: EquipmentSlotType) => {
    setSelectedSlot(slot);
    const isCompatible = slotIsCompatible(slot);
    const equippedId = slot === 'weapon' ? equippedWeaponId : equippedAccessoryId;
    if (!isCompatible) {
      setPendingReplaceSlot(null);
      return;
    }
    if (!equippedId) {
      handleEquip(slot, false);
      return;
    }
    setPendingReplaceSlot(slot);
  };

  const equippedDetails = useMemo(() => buildStatEntries(selectedSlotDef), [selectedSlotDef]);

  const renderSlot = (slot: EquipmentSlotType, equipped: ItemDefinition | null, equippedId: string | null) => {
    const compatible = slotIsCompatible(slot);
    const isSelected = selectedSlot === slot;
    const rarityClass = getRarityClass(equipped?.rarity);
    const isPulse = pulseSlot === slot;
    return (
      <button
        type="button"
        key={slot}
        className={`equipmentDrawerSlot ${rarityClass}${equipped ? ' equipmentDrawerSlotFilled' : ''}${
          isSelected ? ' equipmentDrawerSlotSelected' : ''
        }${compatible ? ' equipmentDrawerSlotCompatible' : ''}${isPulse ? ' equipmentDrawerSlotPulse' : ''}`}
        onClick={() => handleSlotClick(slot)}
        aria-label={`${SLOT_CONFIG[slot].label} slot`}
      >
        <div className="equipmentDrawerSlotIcon" aria-hidden="true">
          {SLOT_CONFIG[slot].icon}
        </div>
        <div className="equipmentDrawerSlotLabel">{SLOT_CONFIG[slot].label}</div>
        {equipped ? (
          <>
            <div className="equipmentDrawerSlotItem">{equipped?.name ?? equippedId ?? 'Equipped'}</div>
            <div className="equipmentDrawerSlotChip">Equipped</div>
          </>
        ) : (
          <div className="equipmentDrawerSlotEmpty">Empty</div>
        )}
        {compatible ? <div className="equipmentDrawerSlotHint">Click to Equip</div> : null}
      </button>
    );
  };

  return (
    <div
      className="equipmentDrawerOverlay"
      data-open={open}
      onClick={() => {
        if (open) onClose();
      }}
      aria-hidden={!open}
    >
      <div className="equipmentDrawerPanel" data-open={open} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="equipmentDrawerHeader">
          <div>
            <div className="equipmentDrawerTitle">Equipment</div>
            <div className="equipmentDrawerSubtitle">Select an item in your satchel, then click a slot to equip.</div>
          </div>
          <button type="button" className="equipmentDrawerClose" onClick={onClose} aria-label="Close equipment drawer">
            ✕
          </button>
        </div>

        <div className="equipmentDrawerStage">
          <div className="equipmentDrawerRune" aria-hidden="true" />
          <div className="equipmentDrawerSilhouette" aria-hidden="true" />
          <div className="equipmentDrawerSlotLeft">
            {renderSlot('weapon', equippedWeapon, equippedWeaponId)}
          </div>
          <div className="equipmentDrawerSlotRight">
            {renderSlot('accessory', equippedAccessory, equippedAccessoryId)}
          </div>
        </div>

        <div className="equipmentDrawerDetails">
          {!selectedSlot ? (
            <div className="equipmentDrawerEmpty">
              <div className="equipmentDrawerEmptyTitle">Choose a slot to inspect</div>
              <div className="equipmentDrawerEmptyText">Equipment grants lasting bonuses to your cultivator.</div>
            </div>
          ) : (
            <div className="equipmentDrawerDetailContent">
              <div className="equipmentDrawerDetailHeader">
                <div className="equipmentDrawerDetailSlot">{SLOT_CONFIG[selectedSlot].label}</div>
                {selectedSlotDef ? <div className="equipmentDrawerDetailChip">Equipped</div> : null}
              </div>
              {selectedSlotDef ? (
                <>
                  <div className="equipmentDrawerDetailName">{selectedSlotDef.name}</div>
                  {selectedSlotDef.description ? (
                    <p className="equipmentDrawerDetailDescription">{selectedSlotDef.description}</p>
                  ) : null}
                  {equippedDetails.length > 0 ? (
                    <div className="equipmentDrawerStatList">
                      {equippedDetails.map((stat) => (
                        <div key={stat.label} className="equipmentDrawerStatRow">
                          <span className="equipmentDrawerStatLabel">{stat.label}</span>
                          <span className="equipmentDrawerStatValue">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="equipmentDrawerDetailDescription">No stat bonuses listed.</div>
                  )}
                </>
              ) : (
                <div className="equipmentDrawerDetailDescription">
                  Empty slot. Equip an item to channel its power into your cultivator.
                </div>
              )}
              <div className="equipmentDrawerActions">
                {selectedSlotDef ? (
                  <button type="button" className="equipmentDrawerActionButton" onClick={() => handleUnequip(selectedSlot)}>
                    Unequip
                  </button>
                ) : null}
                {pendingReplaceSlot === selectedSlot && selectedItemId && selectedItemName && slotIsCompatible(selectedSlot) ? (
                  <button
                    type="button"
                    className="equipmentDrawerActionButton equipmentDrawerActionButton--primary"
                    onClick={() => handleEquip(selectedSlot, true)}
                  >
                    Replace {selectedSlotDef?.name ?? 'Empty'} → {selectedItemName}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
