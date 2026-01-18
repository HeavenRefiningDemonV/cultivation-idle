import { useEffect, useMemo, useRef, useState } from 'react';
import { Backpack, Coins, Gem, Medal, User, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { getItemDef } from '../../stores/contentStore';
import { useBuffStore } from '../../stores/buffStore';
import { useUIStore } from '../../stores/uiStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import InventorySlotTile from '../inventory/InventorySlotTile';
import type { DisplayStack } from '../inventory/inventoryTypes';
import type { ItemDefinition } from '../../types';
import './InventoryScreen.scss';

type InventorySlot =
  | { kind: 'item'; stack: DisplayStack; slotIndex: number }
  | { kind: 'empty'; slotIndex: number };

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const RARITY_RANK = new Map(RARITY_ORDER.map((rarity, index) => [rarity, index]));
const RARITY_SORT_RANK: Record<string, number> = {
  mythic: 6,
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};
const TYPE_SORT_RANK: Record<string, number> = {
  weapon: 1,
  accessory: 2,
  consumable: 3,
  material: 4,
  treasure: 5,
  misc: 99,
};
const DEFAULT_MAX_SLOTS = 36;
const INVENTORY_FILTERS_KEY = 'inventory.v2.filters';
const BASE_KNOWN_TYPES = ['weapon', 'accessory', 'consumable', 'material', 'treasure'];
const OPTIONAL_TYPES = ['talisman', 'rune', 'reagent'];
const SORT_MODES = ['rarity_desc', 'name_asc', 'qty_desc', 'type_then_rarity', 'new_first'] as const;
const DEFAULT_FILTERS = {
  activePocketId: 'all',
  searchQuery: '',
  sortMode: 'rarity_desc',
} as const;

type PocketDef = {
  id: string;
  label: string;
  icon: string;
  predicate: (def: ItemDefinition) => boolean;
};

const formatPocketLabel = (category: string) => {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
};

const getDefType = (def: ItemDefinition) => {
  const maybeDef = def as ItemDefinition & { category?: string; type?: string };
  return maybeDef.type ?? maybeDef.category ?? 'misc';
};

const getRaritySortRank = (rarity?: string) => RARITY_SORT_RANK[(rarity ?? '').toLowerCase()] ?? 0;

const getTypeSortRank = (type?: string) => TYPE_SORT_RANK[(type ?? '').toLowerCase()] ?? 98;

const compareFallback = (a: DisplayStack, b: DisplayStack) => {
  const nameCompare = a.name.localeCompare(b.name);
  if (nameCompare !== 0) return nameCompare;
  const itemCompare = a.itemId.localeCompare(b.itemId);
  if (itemCompare !== 0) return itemCompare;
  return a.stackId.localeCompare(b.stackId);
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
  const [activePocketId, setActivePocketId] = useState(DEFAULT_FILTERS.activePocketId);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_FILTERS.searchQuery);
  const [sortMode, setSortMode] = useState(DEFAULT_FILTERS.sortMode);
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [equipmentOverlayOpen, setEquipmentOverlayOpen] = useState(false);
  const prevStackIdsRef = useRef<Set<string>>(new Set());
  const [newStackIds, setNewStackIds] = useState<Set<string>>(new Set());
  const warnedMissingDefs = useRef(new Set<string>());
  const filtersLoadedRef = useRef(false);

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

  const pocketDefinitions = useMemo(() => {
    const extraTypeSet = new Set<string>();
    nonCurrencyStacks.forEach((stack) => {
      if (!stack.type || BASE_KNOWN_TYPES.includes(stack.type)) return;
      if (stack.type === 'currency') return;
      extraTypeSet.add(stack.type);
    });

    const extraTypes = [...extraTypeSet];
    const orderedExtras = [
      ...OPTIONAL_TYPES.filter((type) => extraTypeSet.has(type)),
      ...extraTypes.filter((type) => !OPTIONAL_TYPES.includes(type)).sort(),
    ];
    const knownTypes = new Set([...BASE_KNOWN_TYPES, ...orderedExtras]);

    const basePockets: PocketDef[] = [
      { id: 'all', label: 'All', icon: '🧺', predicate: () => true },
      { id: 'weapon', label: 'Weapons', icon: '🗡️', predicate: (def) => getDefType(def) === 'weapon' },
      { id: 'accessory', label: 'Accessories', icon: '🧿', predicate: (def) => getDefType(def) === 'accessory' },
      { id: 'consumable', label: 'Consumables', icon: '🧪', predicate: (def) => getDefType(def) === 'consumable' },
      { id: 'material', label: 'Materials', icon: '🪨', predicate: (def) => getDefType(def) === 'material' },
      { id: 'treasure', label: 'Treasures', icon: '💎', predicate: (def) => getDefType(def) === 'treasure' },
    ];

    const extraPockets = orderedExtras.map((type) => ({
      id: type,
      label: formatPocketLabel(type),
      icon: '📦',
      predicate: (def: ItemDefinition) => getDefType(def) === type,
    }));

    const miscPocket: PocketDef = {
      id: 'misc',
      label: 'Misc',
      icon: '📦',
      predicate: (def) => !knownTypes.has(getDefType(def)),
    };

    return [...basePockets, ...extraPockets, miscPocket];
  }, [nonCurrencyStacks]);

  const pocketIdSet = useMemo(() => new Set(pocketDefinitions.map((pocket) => pocket.id)), [pocketDefinitions]);

  useEffect(() => {
    if (filtersLoadedRef.current) return;
    if (pocketIdSet.size === 0) return;
    const stored = localStorage.getItem(INVENTORY_FILTERS_KEY);
    if (!stored) {
      filtersLoadedRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        activePocketId?: unknown;
        searchQuery?: unknown;
        sortMode?: unknown;
      };
      const nextPocketId =
        typeof parsed.activePocketId === 'string' && pocketIdSet.has(parsed.activePocketId)
          ? parsed.activePocketId
          : DEFAULT_FILTERS.activePocketId;
      const nextSearchQuery = typeof parsed.searchQuery === 'string' ? parsed.searchQuery : DEFAULT_FILTERS.searchQuery;
      const nextSortMode =
        typeof parsed.sortMode === 'string' && SORT_MODES.includes(parsed.sortMode as (typeof SORT_MODES)[number])
          ? parsed.sortMode
          : DEFAULT_FILTERS.sortMode;
      setActivePocketId(nextPocketId);
      setSearchQuery(nextSearchQuery);
      setSortMode(nextSortMode);
    } catch {
      setActivePocketId(DEFAULT_FILTERS.activePocketId);
      setSearchQuery(DEFAULT_FILTERS.searchQuery);
      setSortMode(DEFAULT_FILTERS.sortMode);
    } finally {
      filtersLoadedRef.current = true;
    }
  }, [pocketIdSet]);

  useEffect(() => {
    if (!pocketIdSet.has(activePocketId)) {
      setActivePocketId(DEFAULT_FILTERS.activePocketId);
      return;
    }
    const payload = {
      activePocketId,
      searchQuery,
      sortMode,
    };
    localStorage.setItem(INVENTORY_FILTERS_KEY, JSON.stringify(payload));
  }, [activePocketId, pocketIdSet, searchQuery, sortMode]);

  useEffect(() => {
    const currentIds = new Set(nonCurrencyStacks.map((stack) => stack.stackId));
    const newIds: string[] = [];
    currentIds.forEach((id) => {
      if (!prevStackIdsRef.current.has(id)) {
        newIds.push(id);
      }
    });

    if (newIds.length > 0) {
      setNewStackIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      newIds.forEach((id) => {
        window.setTimeout(() => {
          setNewStackIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 4000);
      });
    }

    prevStackIdsRef.current = currentIds;
  }, [nonCurrencyStacks]);

  const pocketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pocketDefinitions.forEach((pocket) => {
      counts[pocket.id] = 0;
    });
    nonCurrencyStacks.forEach((stack) => {
      const def = getItemDef(stack.itemId);
      if (!def) return;
      pocketDefinitions.forEach((pocket) => {
        if (pocket.predicate(def)) {
          counts[pocket.id] = (counts[pocket.id] ?? 0) + 1;
        }
      });
    });
    return counts;
  }, [nonCurrencyStacks, pocketDefinitions]);

  const maxSlots = DEFAULT_MAX_SLOTS;
  const usedSlots = nonCurrencyStacks.length;
  const freeSlots = Math.max(0, maxSlots - usedSlots);
  const searchQueryTrimmed = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const isFilterActive = activePocketId !== 'all' || searchQueryTrimmed !== '';

  const activePocket = useMemo(
    () => pocketDefinitions.find((pocket) => pocket.id === activePocketId) ?? pocketDefinitions[0],
    [activePocketId, pocketDefinitions],
  );

  const pocketFilteredStacks = useMemo(() => {
    if (!activePocket) return [];
    if (activePocket.id === 'all') return nonCurrencyStacks;
    return nonCurrencyStacks.filter((stack) => {
      const def = getItemDef(stack.itemId);
      if (!def) return false;
      return activePocket.predicate(def);
    });
  }, [activePocket, nonCurrencyStacks]);

  const searchedStacks = useMemo(() => {
    if (searchQueryTrimmed === '') return pocketFilteredStacks;
    return pocketFilteredStacks.filter((stack) => {
      const haystack = [
        stack.name,
        stack.itemId,
        stack.description ?? '',
        stack.type ?? '',
        stack.rarity ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchQueryTrimmed);
    });
  }, [pocketFilteredStacks, searchQueryTrimmed]);

  const sortedStacks = useMemo(() => {
    const stacks = [...searchedStacks];
    stacks.sort((a, b) => {
      switch (sortMode) {
        case 'name_asc': {
          return compareFallback(a, b);
        }
        case 'qty_desc': {
          const qtyDiff = b.quantity - a.quantity;
          if (qtyDiff !== 0) return qtyDiff;
          const rarityDiff = getRaritySortRank(b.rarity) - getRaritySortRank(a.rarity);
          if (rarityDiff !== 0) return rarityDiff;
          return compareFallback(a, b);
        }
        case 'type_then_rarity': {
          const typeDiff = getTypeSortRank(a.type) - getTypeSortRank(b.type);
          if (typeDiff !== 0) return typeDiff;
          const rarityDiff = getRaritySortRank(b.rarity) - getRaritySortRank(a.rarity);
          if (rarityDiff !== 0) return rarityDiff;
          return compareFallback(a, b);
        }
        case 'new_first': {
          const newDiff = Number(newStackIds.has(b.stackId)) - Number(newStackIds.has(a.stackId));
          if (newDiff !== 0) return newDiff;
          const rarityDiff = getRaritySortRank(b.rarity) - getRaritySortRank(a.rarity);
          if (rarityDiff !== 0) return rarityDiff;
          return compareFallback(a, b);
        }
        case 'rarity_desc':
        default: {
          const rarityDiff = getRaritySortRank(b.rarity) - getRaritySortRank(a.rarity);
          if (rarityDiff !== 0) return rarityDiff;
          return compareFallback(a, b);
        }
      }
    });
    return stacks;
  }, [newStackIds, searchedStacks, sortMode]);

  const { filteredStacks, visibleSlots, hasOverflow } = useMemo(() => {
    if (!isFilterActive) {
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
  }, [freeSlots, isFilterActive, maxSlots, sortedStacks]);

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
    if (!selectedStackId) return;
    const stillMatches = sortedStacks.some((stack) => stack.stackId === selectedStackId);
    if (!stillMatches) setSelectedStackId(null);
  }, [activePocketId, searchQueryTrimmed, selectedStackId, sortedStacks]);

  const selectedCategoryLabel = activePocket?.label ?? 'All';

  const pocketNewIndicators = useMemo(() => {
    const indicators: Record<string, boolean> = {};
    pocketDefinitions.forEach((pocket) => {
      indicators[pocket.id] = false;
    });
    if (newStackIds.size === 0) return indicators;
    nonCurrencyStacks.forEach((stack) => {
      if (!newStackIds.has(stack.stackId)) return;
      const def = getItemDef(stack.itemId);
      if (!def) return;
      pocketDefinitions.forEach((pocket) => {
        if (pocket.predicate(def)) {
          indicators[pocket.id] = true;
        }
      });
    });
    return indicators;
  }, [newStackIds, nonCurrencyStacks, pocketDefinitions]);

  const weaponName = equippedWeaponId ? getItemDef(equippedWeaponId)?.name ?? equippedWeaponId : 'None';
  const accessoryName = equippedAccessoryId ? getItemDef(equippedAccessoryId)?.name ?? equippedAccessoryId : 'None';

  const handleSelectStack = (stackId: string) => {
    setSelectedStackId(stackId);
    setNewStackIds((prev) => {
      if (!prev.has(stackId)) return prev;
      const next = new Set(prev);
      next.delete(stackId);
      return next;
    });
  };

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
          <div className="inventoryPocketRailHeader">
            <div className="inventoryPocketRailTitle">Pockets</div>
            <div className="inventoryPocketRailMeta">
              {usedSlots} / {maxSlots}
            </div>
          </div>
          <div className="inventoryPocketList">
            {pocketDefinitions.map((pocket) => {
              const count = pocketCounts[pocket.id] ?? 0;
              const isDisabled = pocket.id !== 'all' && count === 0;
              const isActive = activePocketId === pocket.id;
              const hasNew = pocketNewIndicators[pocket.id];
              return (
                <button
                  key={pocket.id}
                  className={`inventoryPocketButton${isActive ? ' inventoryPocketButton--active' : ''}${
                    isDisabled ? ' inventoryPocketButton--disabled' : ''
                  }`}
                  type="button"
                  onClick={() => setActivePocketId(pocket.id)}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  title={pocket.label}
                >
                  <span className="inventoryPocketIcon" aria-hidden="true">
                    {pocket.icon}
                  </span>
                  <span className="inventoryPocketLabel">{pocket.label}</span>
                  <span className="inventoryPocketCount" aria-hidden="true">
                    {count}
                  </span>
                  {hasNew ? <span className="inventoryPocketNewDot" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="inventoryRingPanel inventoryPanelBase">
          <div className="inventoryRingSubheader inventoryPanelBase">
            <div className="inventoryRingSubheaderLeft">
              <div className="inventoryRingPocketTitle">{selectedCategoryLabel}</div>
              <div className="inventoryRingPocketMeta">
                Showing {filteredStacks.length} items
                {searchQueryTrimmed !== '' ? ` • Search: "${searchQueryTrimmed}"` : ''}
              </div>
              {hasOverflow ? <div className="inventoryOverflowWarning">Inventory overflow (debug)</div> : null}
            </div>
            <div className="inventoryRingSubheaderRight">
              <div className="inventorySearch">
                <span className="inventorySearchIcon" aria-hidden="true">
                  🔍
                </span>
                <input
                  className="inventorySearchInput"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search items..."
                  aria-label="Search inventory items"
                />
                {searchQueryTrimmed !== '' ? (
                  <button
                    type="button"
                    className="inventorySearchClear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
              <div className="inventorySort">
                <span className="inventorySortLabel">Sort</span>
                <select
                  className="inventorySortSelect"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  aria-label="Sort inventory items"
                >
                  <option value="rarity_desc">Rarity (High → Low)</option>
                  <option value="name_asc">Name (A → Z)</option>
                  <option value="qty_desc">Quantity (High → Low)</option>
                  <option value="type_then_rarity">Type → Rarity</option>
                  <option value="new_first">New (Newest first)</option>
                </select>
              </div>
              {isFilterActive ? (
                <button
                  type="button"
                  className="inventoryToolsReset"
                  onClick={() => {
                    setActivePocketId('all');
                    setSearchQuery('');
                    setSelectedStackId(null);
                  }}
                  aria-label="Reset filters"
                  title="Reset filters"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
          <div className="inventoryRingScroll" role="region" aria-label="Void Ring inventory slots">
            <div className="inventorySlotGrid" role="grid">
              {visibleSlots.map((slot) =>
                slot.kind === 'item' ? (
                  <InventorySlotTile
                    key={slot.slotIndex}
                    stack={slot.stack}
                    isSelected={selectedStackId === slot.stack.stackId}
                    isNew={newStackIds.has(slot.stack.stackId)}
                    onSelect={() => handleSelectStack(slot.stack.stackId)}
                  />
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
