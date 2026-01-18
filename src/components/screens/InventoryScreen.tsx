import { useEffect, useMemo, useRef, useState } from 'react';
import { Backpack, Coins, Gem, Medal, User, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { getItemDef } from '../../stores/contentStore';
import { useBuffStore } from '../../stores/buffStore';
import { useUIStore } from '../../stores/uiStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import './InventoryScreen.scss';

type DisplayStack = {
  stackId: string;
  itemId: string;
  quantity: number;
  name: string;
  description?: string;
  type: string;
  rarity?: string;
  level?: number;
  maxStack?: number;
  stackable?: boolean;
  value?: string | number;
  note?: string;
  usage?: string;
};

type InventorySlot =
  | { kind: 'item'; stack: DisplayStack; slotIndex: number }
  | { kind: 'empty'; slotIndex: number };

const POCKET_ORDER = ['consumable', 'talisman', 'rune', 'reagent', 'material', 'crate', 'token', 'gateItem', 'misc'];

const POCKET_LABELS: Record<string, string> = {
  all: 'All',
  consumable: 'Consumables',
  talisman: 'Talismans',
  rune: 'Runes',
  reagent: 'Reagents',
  material: 'Materials',
  crate: 'Crates',
  token: 'Tokens',
  gateItem: 'Gate Items',
  misc: 'Misc',
};

const POCKET_TYPE_MAP: Record<string, string[]> = {
  all: [],
  consumable: ['consumable'],
  talisman: ['talisman'],
  rune: ['rune'],
  reagent: ['reagent'],
  material: ['material'],
  crate: ['crate'],
  token: ['token'],
  gateItem: ['gateItem'],
  misc: ['misc'],
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const RARITY_RANK = new Map(RARITY_ORDER.map((rarity, index) => [rarity, index]));
const DEFAULT_MAX_SLOTS = 36;

const formatPocketLabel = (category: string) => {
  if (POCKET_LABELS[category]) return POCKET_LABELS[category];
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
};

const sortStacks = (stacks: DisplayStack[]) => {
  return [...stacks].sort((a, b) => {
    const rarityA = RARITY_RANK.get((a.rarity ?? '').toLowerCase()) ?? -1;
    const rarityB = RARITY_RANK.get((b.rarity ?? '').toLowerCase()) ?? -1;
    if (rarityA !== rarityB) return rarityB - rarityA;

    const levelA = a.level ?? 0;
    const levelB = b.level ?? 0;
    if (levelA !== levelB) return levelB - levelA;

    return a.name.localeCompare(b.name);
  });
};

export default function InventoryScreen() {
  const currencies = useInventoryStore((state) => state.currencies);
  const items = useInventoryStore((state) => state.items);
  const activateTalisman = useBuffStore((state) => state.activateTalisman);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const addNotification = useUIStore((state) => state.addNotification);
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));
  const equippedWeaponId = useEquipmentStore((state) => state.equippedWeaponId);
  const equippedAccessoryId = useEquipmentStore((state) => state.equippedAccessoryId);
  const [activePocket, setActivePocket] = useState('all');
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [equipmentOverlayOpen, setEquipmentOverlayOpen] = useState(false);
  const warnedMissingDefs = useRef(new Set<string>());

  const { displayStacks, missingItemIds } = useMemo(() => {
    const missing: string[] = [];
    const stacks = Object.entries(items)
      .map(([itemId, quantity]) => {
        const def = getItemDef(itemId);
        if (!def) {
          missing.push(itemId);
          return null;
        }
        const extra = def as { rarity?: string; level?: number; type?: string; maxStack?: number; value?: string | number };
        return {
          stackId: itemId,
          itemId,
          quantity,
          name: def.name ?? itemId,
          description: def.description,
          type: extra.type ?? def.category,
          rarity: extra.rarity,
          level: extra.level,
          maxStack: extra.maxStack ?? def.stackSize,
          stackable: extra.type ? extra.type !== 'currency' : def.stackSize !== 0,
          value: extra.value ?? def.sellValue,
          note: def.note,
          usage: def.usage,
        } satisfies DisplayStack;
      })
      .filter((stack): stack is DisplayStack => Boolean(stack));

    return { displayStacks: stacks, missingItemIds: missing };
  }, [items]);

  useEffect(() => {
    if (missingItemIds.length === 0) return;
    missingItemIds.forEach((itemId) => {
      if (warnedMissingDefs.current.has(itemId)) return;
      warnedMissingDefs.current.add(itemId);
      console.warn(`[Inventory] Missing item definition for ${itemId}`);
    });
  }, [missingItemIds]);

  const nonCurrencyStacks = useMemo(
    () => displayStacks.filter((stack) => stack.type !== 'currency' && stack.itemId !== 'currency'),
    [displayStacks],
  );

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: nonCurrencyStacks.length };
    nonCurrencyStacks.forEach((stack) => {
      const category = stack.type ?? 'misc';
      counts[category] = (counts[category] ?? 0) + 1;
    });
    return counts;
  }, [nonCurrencyStacks]);

  const pockets = useMemo(() => {
    const categories = new Set(nonCurrencyStacks.map((stack) => stack.type ?? 'misc'));
    const extras = [...categories].filter((category) => !POCKET_ORDER.includes(category)).sort();
    return ['all', ...POCKET_ORDER, ...extras];
  }, [nonCurrencyStacks]);

  const maxSlots = DEFAULT_MAX_SLOTS;
  const usedSlots = nonCurrencyStacks.length;
  const freeSlots = Math.max(0, maxSlots - usedSlots);

  const { filteredStacks, visibleSlots, hasOverflow } = useMemo(() => {
    const isAll = activePocket === 'all';
    const typeFilter = POCKET_TYPE_MAP[activePocket] ?? [activePocket];
    const stacks = isAll
      ? nonCurrencyStacks
      : nonCurrencyStacks.filter((stack) => typeFilter.includes(stack.type ?? 'misc'));

    const sortedStacks = sortStacks(stacks);
    if (isAll) {
      const overflow = sortedStacks.length > maxSlots;
      const cappedStacks = overflow ? sortedStacks.slice(0, maxSlots) : sortedStacks;
      const emptySlots = overflow ? 0 : freeSlots;
      const slots: InventorySlot[] = cappedStacks.map((stack, index) => ({
        kind: 'item',
        stack,
        slotIndex: index,
      }));

      for (let i = 0; i < emptySlots; i += 1) {
        slots.push({ kind: 'empty', slotIndex: slots.length });
      }

      return { filteredStacks: sortedStacks, visibleSlots: slots, hasOverflow: overflow };
    }

    const slots: InventorySlot[] = sortedStacks.map((stack, index) => ({
      kind: 'item',
      stack,
      slotIndex: index,
    }));

    for (let i = 0; i < freeSlots; i += 1) {
      slots.push({ kind: 'empty', slotIndex: slots.length });
    }

    return { filteredStacks: sortedStacks, visibleSlots: slots, hasOverflow: false };
  }, [activePocket, freeSlots, maxSlots, nonCurrencyStacks]);

  const selectedStack = useMemo(() => {
    if (!selectedStackId) return null;
    return displayStacks.find((stack) => stack.stackId === selectedStackId) ?? null;
  }, [displayStacks, selectedStackId]);

  useEffect(() => {
    if (!selectedStackId) return;
    const stillExists = displayStacks.some((stack) => stack.stackId === selectedStackId);
    if (!stillExists) setSelectedStackId(null);
  }, [displayStacks, selectedStackId]);

  useEffect(() => {
    if (!selectedStackId) return;
    const visible = visibleSlots.some((slot) => slot.kind === 'item' && slot.stack.stackId === selectedStackId);
    if (!visible) setSelectedStackId(null);
  }, [selectedStackId, visibleSlots]);

  useEffect(() => {
    if (!pockets.includes(activePocket)) {
      setActivePocket('all');
    }
  }, [activePocket, pockets]);

  const selectedCategoryLabel = formatPocketLabel(activePocket);

  const weaponName = equippedWeaponId ? getItemDef(equippedWeaponId)?.name ?? equippedWeaponId : 'None';
  const accessoryName = equippedAccessoryId ? getItemDef(equippedAccessoryId)?.name ?? equippedAccessoryId : 'None';

  return (
    <div className="inventoryScreenRoot">
      <div className="inventoryScreenHeader inventoryPanelBase">
        <div className="inventoryHeaderLeft">
          <div className="inventoryHeaderTitle">Spatial Ring Inventory</div>
          <div className="inventoryHeaderSubtitle">Treasures secured within your pocket realm.</div>
        </div>
        <div className="inventoryHeaderCurrencyStrip">
          <div className="inventoryCurrencyChip">
            <Coins size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Gold</span>
            <span className="inventoryCurrencyValue">{currencies.gold}</span>
          </div>
          <div className="inventoryCurrencyChip">
            <Gem size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Spirit Stones</span>
            <span className="inventoryCurrencyValue">{currencies.spiritStones}</span>
          </div>
          <div className="inventoryCurrencyChip">
            <Medal size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Merit</span>
            <span className="inventoryCurrencyValue">{currencies.merit}</span>
          </div>
        </div>
        <div className="inventoryHeaderActions">
          <button
            className="button-standard inventoryHeaderIconButton"
            type="button"
            onClick={openManualSatchel}
            aria-label="Open manual satchel"
          >
            <Backpack size={18} aria-hidden="true" />
            <span className="inventoryHeaderBadge">{satchelCount}</span>
          </button>
          <button
            className="button-standard inventoryHeaderIconButton"
            type="button"
            onClick={() => setEquipmentOverlayOpen((prev) => !prev)}
            aria-label="Toggle equipment overview"
            data-active={equipmentOverlayOpen}
          >
            <User size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="inventoryScreenBody">
        <nav className="inventoryPocketRail inventoryPanelBase" aria-label="Inventory pockets">
          <div className="inventoryPocketTitle">Pockets</div>
          <div className="inventoryPocketList">
            {pockets.map((category) => {
              const count = countsByCategory[category] ?? 0;
              const isDisabled = category !== 'all' && count === 0;
              const isActive = activePocket === category;
              return (
                <button
                  key={category}
                  className={`inventoryPocketButton${isActive ? ' inventoryPocketButton--active' : ''}${
                    isDisabled ? ' inventoryPocketButton--disabled' : ''
                  }`}
                  type="button"
                  onClick={() => setActivePocket(category)}
                  disabled={isDisabled}
                >
                  <span className="inventoryPocketLabel">{formatPocketLabel(category)}</span>
                  <span className="inventoryPocketCount">{count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="inventoryRingPanel inventoryPanelBase">
          <div className="inventoryRingSubheader">
            <div className="inventoryRingTitle">
              <span className="inventoryRingPocket">{selectedCategoryLabel}</span>
              <span className="inventoryRingCount">{filteredStacks.length} items</span>
            </div>
            {hasOverflow ? <div className="inventoryOverflowWarning">Inventory overflow (debug)</div> : null}
          </div>
          <div className="inventoryRingScroll" role="region" aria-label="Void Ring inventory slots">
            <div className="inventorySlotGrid" role="grid">
              {visibleSlots.map((slot) =>
                slot.kind === 'item' ? (
                  <button
                    key={slot.slotIndex}
                    className={`inventorySlotTile${
                      selectedStackId === slot.stack.stackId ? ' inventorySlotTile--selected' : ''
                    }`}
                    type="button"
                    onClick={() => setSelectedStackId(slot.stack.stackId)}
                    role="gridcell"
                  >
                    <div className="inventorySlotTileHeader">
                      <span className="inventorySlotTileName">{slot.stack.name}</span>
                      <span className="inventorySlotTileQty">x{slot.stack.quantity}</span>
                    </div>
                    <div className="inventorySlotTileMeta">{formatPocketLabel(slot.stack.type)}</div>
                  </button>
                ) : (
                  <div
                    key={slot.slotIndex}
                    className="inventorySlotTile inventorySlotTileEmpty"
                    aria-hidden="true"
                  />
                ),
              )}
            </div>
          </div>
        </main>

        <aside className="inventoryInspector inventoryPanelBase">
          <div className="inventoryInspectorScroll">
            {!selectedStack ? (
              <div className="inventoryInspectorEmpty">
                <div className="inventoryInspectorTitle">Select an item to inspect</div>
                <div className="inventoryInspectorCopy">Tap a slot to see details. Manual Satchel tips live there too.</div>
              </div>
            ) : (
              <div className="inventoryInspectorContent">
                <div className="inventoryInspectorHeader">
                  <div>
                    <div className="inventoryInspectorName">{selectedStack.name}</div>
                    <div className="inventoryInspectorMeta">
                      <span className="inventoryCategoryBadge">{formatPocketLabel(selectedStack.type)}</span>
                      <span className="inventoryInspectorQty">x{selectedStack.quantity}</span>
                    </div>
                  </div>
                </div>
                {selectedStack.description ? (
                  <p className="inventoryInspectorDescription">{selectedStack.description}</p>
                ) : null}
                {selectedStack.note ? <p className="inventoryInspectorNote">{selectedStack.note}</p> : null}
                <div className="inventoryInspectorDetails">
                  <div className="inventoryInspectorDetail">
                    <span className="inventoryInspectorLabel">Item ID</span>
                    <span className="inventoryInspectorValue inventoryInspectorValue--mono">{selectedStack.itemId}</span>
                  </div>
                  {selectedStack.maxStack ? (
                    <div className="inventoryInspectorDetail">
                      <span className="inventoryInspectorLabel">Stack Size</span>
                      <span className="inventoryInspectorValue">{selectedStack.maxStack}</span>
                    </div>
                  ) : null}
                  {selectedStack.usage ? (
                    <div className="inventoryInspectorDetail">
                      <span className="inventoryInspectorLabel">Usage</span>
                      <span className="inventoryInspectorValue">{selectedStack.usage.replace(/_/g, ' ')}</span>
                    </div>
                  ) : null}
                  {selectedStack.value !== undefined ? (
                    <div className="inventoryInspectorDetail">
                      <span className="inventoryInspectorLabel">Sell Value</span>
                      <span className="inventoryInspectorValue">{selectedStack.value}</span>
                    </div>
                  ) : null}
                </div>
                <div className="inventoryInspectorActions">
                  {selectedStack.type === 'talisman' && selectedStack.quantity > 0 ? (
                    <button
                      className="button-standard inventoryPrimaryButton"
                      type="button"
                      onClick={() => {
                        const result = activateTalisman(selectedStack.itemId);
                        if (!result.ok) {
                          addNotification('error', result.error);
                          return;
                        }
                        addNotification('success', 'Activated talisman.');
                      }}
                    >
                      Activate Talisman
                    </button>
                  ) : (
                    <div className="inventoryInspectorEmptyAction">No actions available.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {equipmentOverlayOpen ? (
        <div className="inventoryEquipmentOverlay" role="dialog" aria-modal="true" aria-label="Equipment overview">
          <div className="inventoryEquipmentPanel inventoryPanelBase">
            <div className="inventoryEquipmentHeader">
              <div>
                <div className="inventoryEquipmentTitle">Cultivator Equipment</div>
                <div className="inventoryEquipmentSubtitle">Quick view of your equipped gear.</div>
              </div>
              <button
                className="button-standard inventoryEquipmentClose"
                type="button"
                onClick={() => setEquipmentOverlayOpen(false)}
                aria-label="Close equipment overview"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="inventoryEquipmentGrid">
              <div className="inventoryEquipmentRow">
                <span className="inventoryEquipmentLabel">Weapon</span>
                <span className="inventoryEquipmentValue">{weaponName}</span>
              </div>
              <div className="inventoryEquipmentRow">
                <span className="inventoryEquipmentLabel">Accessory</span>
                <span className="inventoryEquipmentValue">{accessoryName}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
