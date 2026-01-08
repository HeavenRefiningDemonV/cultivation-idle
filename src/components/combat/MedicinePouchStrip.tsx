import { useEffect, useMemo, useState } from 'react';
import { getItemDef } from '../../stores/contentStore';
import { useCombatStore } from '../../stores/combatStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore';
import { useUIStore } from '../../stores/uiStore';
import { getConsumableSpec, isCombatUsableConsumable } from '../../systems/consumables/consumableCatalog';
import type { MedicinePouchSlotKey } from '../../types';
import { GameEvents } from '../../services/events/GameEvents';
import './MedicinePouchStrip.scss';

const slotOrder: MedicinePouchSlotKey[] = ['healing', 'utility', 'specialty'];
const slotShortLabel: Record<MedicinePouchSlotKey, string> = {
  healing: 'H',
  utility: 'U',
  specialty: 'S',
};
const slotFullLabel: Record<MedicinePouchSlotKey, string> = {
  healing: 'Healing',
  utility: 'Utility',
  specialty: 'Specialty',
};

export function MedicinePouchStrip() {
  const inCombat = useCombatStore((state) => state.inCombat);
  const consumeCombatConsumable = useCombatStore((state) => state.consumeCombatConsumable);

  const slots = useMedicinePouchStore((state) => state.slots);
  const markUsed = useMedicinePouchStore((state) => state.markUsed);

  const getQty = useInventoryStore((state) => state.getQty);

  const useConsumablesInCombat = useUIStore((state) => state.settings.useConsumablesInCombat);

  const [now, setNow] = useState(() => Date.now());
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, []);

  const slotData = useMemo(
    () =>
      slotOrder.map((slotKey) => {
        const slot = slots[slotKey];
        const itemId = slot?.equippedItemId ?? null;
        const spec = itemId ? getConsumableSpec(itemId) : null;
        const itemDef = itemId ? getItemDef(itemId) : null;
        const charges = itemId ? getQty(itemId) : 0;
        const requiredCooldownMs = Math.max(slot.cooldownSec, spec?.cooldownSec ?? 0) * 1000;
        const remainingCooldownMs =
          slot.lastUsedAt === null ? 0 : Math.max(0, requiredCooldownMs - (now - slot.lastUsedAt));
        return {
          slotKey,
          slot,
          itemId,
          spec,
          itemDef,
          charges,
          remainingCooldownMs,
          onCooldown: remainingCooldownMs > 0,
        };
      }),
    [getQty, now, slots],
  );

  if (!inCombat) return null;

  const handleClick = (slotKey: MedicinePouchSlotKey) => {
    const data = slotData.find((entry) => entry.slotKey === slotKey);
    if (!data) return;

    if (!data.slot.enabled) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'Slot disabled' }));
      return;
    }

    if (!useConsumablesInCombat) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'Enable consumables in Combat Theater' }));
      return;
    }

    if (!data.itemId) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'Empty slot' }));
      return;
    }

    if (!isCombatUsableConsumable(data.itemId) || !data.spec) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'Not usable in combat' }));
      return;
    }

    if (data.charges <= 0) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'No charges' }));
      GameEvents.emit({ type: 'pouch/out_of_charges', payload: { slotKey, itemId: data.itemId ?? undefined, source: 'manual' } });
      return;
    }

    if (data.onCooldown) {
      setMessages((prev) => ({ ...prev, [slotKey]: 'On cooldown' }));
      return;
    }

    const result = consumeCombatConsumable(data.itemId, 'manual', Date.now());
    if (!result.ok) {
      const friendlyReason =
        result.reason === 'not_in_combat'
          ? 'Not in combat'
          : result.reason === 'no_charges'
            ? 'No charges'
            : 'Failed to use';
      setMessages((prev) => ({ ...prev, [slotKey]: friendlyReason }));
      return;
    }

    markUsed(slotKey, Date.now());
    setMessages((prev) => ({ ...prev, [slotKey]: 'Used' }));
    const remaining = data.itemId ? getQty(data.itemId) : 0;
    if (remaining <= 1) {
      GameEvents.emit({ type: 'pouch/low_charges_warning', payload: { slotKey, itemId: data.itemId ?? undefined, remaining } });
    }
  };

  return (
    <div className={'medicinePouchStrip'}>
      {slotData.map((data) => {
        const itemName = data.itemId ? data.itemDef?.name ?? data.itemId : 'Empty';
        const cooldownLabel = data.remainingCooldownMs > 0 ? `${Math.ceil(data.remainingCooldownMs / 1000)}s` : '';
        const disabled = !data.slot.enabled || !data.itemId;

        return (
          <button
            key={data.slotKey}
            className={`medicinePouchChip${disabled ? ' medicinePouchChip--disabled' : ''}`}
            onClick={() => handleClick(data.slotKey)}
            type="button"
          >
            <div className={'medicinePouchChipTop'}>
              <span className={'medicinePouchChipLabel'}>{slotShortLabel[data.slotKey]}</span>
              <span className={'medicinePouchChipName'}>{itemName}</span>
            </div>
            <div className={'medicinePouchChipMeta'}>
              <span>Charges: {data.charges}</span>
              {cooldownLabel && <span className={'medicinePouchChipCooldown'}>{cooldownLabel}</span>}
            </div>
            {!data.slot.enabled && <div className={'medicinePouchChipStatus'}>Disabled</div>}
            {messages[data.slotKey] && (
              <div className={'medicinePouchChipMessage'}>{messages[data.slotKey]}</div>
            )}
            <div className={'medicinePouchChipFooter'}>{slotFullLabel[data.slotKey]}</div>
          </button>
        );
      })}
    </div>
  );
}
