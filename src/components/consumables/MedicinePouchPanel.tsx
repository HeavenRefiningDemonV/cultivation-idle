import { useEffect, useMemo, useState } from 'react';
import { getItemDef } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore';
import { getConsumableSpec, isCombatUsableConsumable } from '../../systems/consumables/consumableCatalog';
import type { MedicinePouchSlotKey, MedicinePouchTrigger } from '../../types';
import './MedicinePouchPanel.scss';

type SlotConfigField = 'enabled' | 'trigger' | 'thresholdPct' | 'cooldownSec' | 'bossOnly';

const slotLabels: Record<MedicinePouchSlotKey, string> = {
  healing: 'Healing',
  utility: 'Utility',
  specialty: 'Specialty',
};

const triggerOptions: { value: MedicinePouchTrigger; label: string }[] = [
  { value: 'manual', label: 'Manual only' },
  { value: 'hpBelowPct', label: 'HP below %' },
  { value: 'qiBelowPct', label: 'Qi below %' },
  { value: 'intentBelowPct', label: 'Intent below %' },
  { value: 'fightStart', label: 'On fight start' },
  { value: 'bossStart', label: 'On boss start' },
];

function usageLabel(usage?: 'combat_only' | 'combat_or_world' | 'cultivate_only') {
  switch (usage) {
    case 'combat_only':
      return 'Combat Only';
    case 'combat_or_world':
      return 'Combat or World';
    case 'cultivate_only':
      return 'Cultivation Only';
    default:
      return 'General';
  }
}

function formatCooldownLabel(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

export function MedicinePouchPanel() {
  const slots = useMedicinePouchStore((state) => state.slots);
  const equip = useMedicinePouchStore((state) => state.equip);
  const setSlotConfig = useMedicinePouchStore((state) => state.setSlotConfig);

  const inventoryItems = useInventoryStore((state) => state.items);
  const getQty = useInventoryStore((state) => state.getQty);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(handle);
  }, []);

  const availableOptions = useMemo(
    () =>
      Object.entries(inventoryItems)
        .filter(([itemId, qty]) => qty > 0 && isCombatUsableConsumable(itemId))
        .map(([itemId, qty]) => {
          const itemDef = getItemDef(itemId);
          return { itemId, qty, name: itemDef?.name ?? itemId };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [inventoryItems],
  );

  const renderSlotControls = (slotKey: MedicinePouchSlotKey) => {
    const slot = slots[slotKey];
    const equippedId = slot?.equippedItemId ?? null;
    const itemDef = equippedId ? getItemDef(equippedId) : null;
    const spec = equippedId ? getConsumableSpec(equippedId) : null;
    const charges = equippedId ? getQty(equippedId) : 0;
    const requiredCooldownMs = Math.max(slot.cooldownSec, spec?.cooldownSec ?? 0) * 1000;
    const remainingCooldownMs =
      slot.lastUsedAt === null ? 0 : Math.max(0, requiredCooldownMs - (now - slot.lastUsedAt));
    const shouldShowThreshold =
      slot.trigger === 'hpBelowPct' || slot.trigger === 'qiBelowPct' || slot.trigger === 'intentBelowPct';
    const usage = itemDef?.usage;

    const handleConfigChange = (field: SlotConfigField, value: unknown) => {
      setSlotConfig(slotKey, { [field]: value } as Partial<typeof slot>);
    };

    return (
      <div key={slotKey} className={'medicinePouchCard'}>
        <div className={'medicinePouchCardHeader'}>
          <div>
            <div className={'medicinePouchCardTitle'}>{slotLabels[slotKey]}</div>
            <div className={'medicinePouchCardSubtitle'}>
              {equippedId ? itemDef?.name ?? equippedId : 'Empty'}
            </div>
          </div>
          <div className={'medicinePouchTag'}>{usageLabel(usage)}</div>
        </div>

        <div className={'medicinePouchMeta'}>
          <div>Charges: {charges}</div>
          <div>Cooldown: {formatCooldownLabel(remainingCooldownMs)}</div>
        </div>

        <div className={'medicinePouchField'}>
          <label className={'medicinePouchLabel'} htmlFor={`${slotKey}-select`}>
            Equip
          </label>
          <select
            id={`${slotKey}-select`}
            className={'medicinePouchSelect'}
            value={equippedId ?? ''}
            onChange={(e) => equip(slotKey, e.target.value || null)}
          >
            <option value="">(Empty)</option>
            {availableOptions.map((option) => (
              <option key={option.itemId} value={option.itemId}>
                {option.name} (x{option.qty})
              </option>
            ))}
          </select>
          <button className={'medicinePouchButton medicinePouchButton--ghost'} onClick={() => equip(slotKey, null)}>
            Clear
          </button>
        </div>

        <div className={'medicinePouchField medicinePouchField--inline'}>
          <label className={'medicinePouchCheckbox'}>
            <input
              type="checkbox"
              checked={slot.enabled}
              onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            />
            Slot enabled
          </label>
          <label className={'medicinePouchCheckbox'}>
            <input
              type="checkbox"
              checked={slot.bossOnly}
              onChange={(e) => handleConfigChange('bossOnly', e.target.checked)}
            />
            Boss only
          </label>
        </div>

        <div className={'medicinePouchField'}>
          <label className={'medicinePouchLabel'} htmlFor={`${slotKey}-trigger`}>
            Trigger
          </label>
          <select
            id={`${slotKey}-trigger`}
            className={'medicinePouchSelect'}
            value={slot.trigger}
            onChange={(e) => handleConfigChange('trigger', e.target.value as MedicinePouchTrigger)}
          >
            {triggerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {shouldShowThreshold && (
          <div className={'medicinePouchField'}>
            <label className={'medicinePouchLabel'} htmlFor={`${slotKey}-threshold`}>
              Threshold (%)
            </label>
            <input
              id={`${slotKey}-threshold`}
              type="number"
              min={0}
              max={100}
              className={'medicinePouchInput'}
              value={slot.thresholdPct}
              onChange={(e) => handleConfigChange('thresholdPct', Number(e.target.value))}
            />
          </div>
        )}

        <div className={'medicinePouchField'}>
          <label className={'medicinePouchLabel'} htmlFor={`${slotKey}-cooldown`}>
            Cooldown (seconds)
          </label>
          <input
            id={`${slotKey}-cooldown`}
            type="number"
            min={0}
            max={3600}
            className={'medicinePouchInput'}
            value={slot.cooldownSec}
            onChange={(e) => handleConfigChange('cooldownSec', Number(e.target.value))}
          />
          <div className={'medicinePouchHint'}>
            Baseline: {spec ? `${spec.cooldownSec}s` : '—'} (uses max of slot and item)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={'medicinePouchPanel'}>
      <div className={'medicinePouchPanelHeader'}>
        <div>
          <div className={'medicinePouchTitle'}>Medicine Pouch</div>
          <div className={'medicinePouchSubtitle'}>
            Configure automatic combat consumables. Auto-use respects the combat toggle.
          </div>
        </div>
        <div className={'medicinePouchFootnote'}>
          Auto-use requires enabling “Use consumables in combat” in Combat Theater controls.
        </div>
      </div>

      <div className={'medicinePouchGrid'}>
        {(['healing', 'utility', 'specialty'] as MedicinePouchSlotKey[]).map((slotKey) => renderSlotControls(slotKey))}
      </div>
    </div>
  );
}
