// Inventory v2 equipment drawer to reduce clutter; opened via button.
import { useEffect, useMemo, useState } from 'react';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { getItemDef } from '../../stores/contentStore';
import type { ItemDefinition } from '../../types';
import type { IconId } from '../../ui/icons';
import { GameIcon } from '../../ui/icons';
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

const SLOT_CONFIG: Record<EquipmentSlotType, { label: string; iconId: IconId }> = {
  weapon: { label: 'Weapon', iconId: 'jadeSword' },
  accessory: { label: 'Accessory', iconId: 'placeholderRingSmall' },
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
        className={`inventoryEquipSlot ${rarityClass}${equipped ? ' inventoryEquipSlotFilled' : ''}${
          isSelected ? ' inventoryEquipSlotSelected' : ''
        }${compatible ? ' inventoryEquipSlotCompatible' : ''}${isPulse ? ' inventoryEquipSlotPulse' : ''}`}
        onClick={() => handleSlotClick(slot)}
        aria-label={`${SLOT_CONFIG[slot].label} slot`}
      >
        <div className="inventoryEquipSlotIcon" aria-hidden="true">
          <GameIcon icon={SLOT_CONFIG[slot].iconId} size={20} decorative />
        </div>
        <div className="inventoryEquipSlotLabel">{SLOT_CONFIG[slot].label}</div>
        {equipped ? (
          <>
            <div className="inventoryEquipSlotItem">{equipped?.name ?? equippedId ?? 'Equipped'}</div>
            <div className="inventoryEquipSlotChip">Equipped</div>
          </>
        ) : (
          <div className="inventoryEquipSlotEmpty">Empty</div>
        )}
        {compatible ? <div className="inventoryEquipSlotHint">Click to Equip</div> : null}
      </button>
    );
  };

  return (
    <div
      className={`inventoryEquipDrawerOverlay${open ? ' inventoryEquipDrawerOverlayOpen' : ''}`}
      onClick={() => {
        if (open) onClose();
      }}
      aria-hidden={!open}
    >
      <div
        className={`inventoryEquipDrawerPanel${open ? ' inventoryEquipDrawerPanelOpen' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="inventoryEquipHeader">
          <div>
            <div className="inventoryEquipTitle">Equipment</div>
            <div className="inventoryEquipSubtitle">Select an item in your satchel, then click a slot to equip.</div>
          </div>
          <button type="button" className="inventoryEquipClose" onClick={onClose} aria-label="Close equipment drawer">
            <GameIcon icon="inkX" size={12} decorative />
          </button>
        </div>

        <div className="inventoryEquipStage">
          <div className="inventoryEquipRune" aria-hidden="true" />
          <div className="inventoryEquipSilhouette" aria-hidden="true" />
          <div className="inventoryEquipSlotWeapon">
            {renderSlot('weapon', equippedWeapon, equippedWeaponId)}
          </div>
          <div className="inventoryEquipSlotAccessory">
            {renderSlot('accessory', equippedAccessory, equippedAccessoryId)}
          </div>
        </div>

        <div className="inventoryEquipDetails">
          {!selectedSlot ? (
            <div className="inventoryEquipEmpty">
              <div className="inventoryEquipEmptyTitle">Choose a slot to inspect</div>
              <div className="inventoryEquipEmptyText">Equipment grants lasting bonuses to your cultivator.</div>
            </div>
          ) : (
            <div className="inventoryEquipDetailContent">
              <div className="inventoryEquipDetailHeader">
                <div className="inventoryEquipDetailSlot">{SLOT_CONFIG[selectedSlot].label}</div>
                {selectedSlotDef ? <div className="inventoryEquipDetailChip">Equipped</div> : null}
              </div>
              {selectedSlotDef ? (
                <>
                  <div className="inventoryEquipDetailName">{selectedSlotDef.name}</div>
                  {selectedSlotDef.description ? (
                    <p className="inventoryEquipDetailDescription">{selectedSlotDef.description}</p>
                  ) : null}
                  {equippedDetails.length > 0 ? (
                    <div className="inventoryEquipStatList">
                      {equippedDetails.map((stat) => (
                        <div key={stat.label} className="inventoryEquipStatRow">
                          <span className="inventoryEquipStatLabel">{stat.label}</span>
                          <span className="inventoryEquipStatValue">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inventoryEquipDetailDescription">No stat bonuses listed.</div>
                  )}
                </>
              ) : (
                <div className="inventoryEquipDetailDescription">
                  Empty slot. Equip an item to channel its power into your cultivator.
                </div>
              )}
              <div className="inventoryEquipActions">
                {selectedSlotDef ? (
                  <button type="button" className="inventoryEquipActionButton" onClick={() => handleUnequip(selectedSlot)}>
                    Unequip
                  </button>
                ) : null}
                {pendingReplaceSlot === selectedSlot && selectedItemId && selectedItemName && slotIsCompatible(selectedSlot) ? (
                  <button
                    type="button"
                    className="inventoryEquipActionButton inventoryEquipActionButton--primary"
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
