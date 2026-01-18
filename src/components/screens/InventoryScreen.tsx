import { useEffect, useMemo, useState } from 'react';
import { Backpack, Coins, Gem, Medal, User, X } from 'lucide-react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { getItemDef } from '../../stores/contentStore';
import { useBuffStore } from '../../stores/buffStore';
import { useUIStore } from '../../stores/uiStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import './InventoryScreen.scss';

type DisplayItem = {
  itemId: string;
  qty: number;
  name: string;
  category: string;
  stackSize?: number;
  description?: string;
  note?: string;
  usage?: string;
  sellValue?: number;
};

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

const formatPocketLabel = (category: string) => {
  if (POCKET_LABELS[category]) return POCKET_LABELS[category];
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [equipmentOverlayOpen, setEquipmentOverlayOpen] = useState(false);

  const displayItems = useMemo<DisplayItem[]>(() => {
    return Object.entries(items)
      .map(([itemId, qty]) => {
        const def = getItemDef(itemId);
        const category = (def?.category ?? 'misc').toString();
        return {
          itemId,
          qty,
          name: def?.name ?? itemId,
          category,
          stackSize: def?.stackSize,
          description: def?.description,
          note: def?.note,
          usage: def?.usage,
          sellValue: def?.sellValue,
        };
      })
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
  }, [items]);

  const nonCurrencyItems = useMemo(() => displayItems.filter((item) => item.category !== 'currency'), [displayItems]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: nonCurrencyItems.length };
    nonCurrencyItems.forEach((item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    });
    return counts;
  }, [nonCurrencyItems]);

  const pockets = useMemo(() => {
    const categories = new Set(nonCurrencyItems.map((item) => item.category));
    const extras = [...categories].filter((category) => !POCKET_ORDER.includes(category)).sort();
    return ['all', ...POCKET_ORDER, ...extras];
  }, [nonCurrencyItems]);

  const filteredItems = useMemo(() => {
    if (activePocket === 'all') return nonCurrencyItems;
    return nonCurrencyItems.filter((item) => item.category === activePocket);
  }, [activePocket, nonCurrencyItems]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return displayItems.find((item) => item.itemId === selectedItemId) ?? null;
  }, [displayItems, selectedItemId]);

  useEffect(() => {
    if (selectedItemId && !filteredItems.some((item) => item.itemId === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [filteredItems, selectedItemId]);

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
        <div className="inventoryHeaderTitle">
          <span className="inventoryHeaderEyebrow">Spatial Ring</span>
          <h2>Inventory</h2>
        </div>
        <div className="inventoryCurrencyStrip">
          <div className="inventoryCurrencyPill">
            <Coins size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Gold</span>
            <span className="inventoryCurrencyValue">{currencies.gold}</span>
          </div>
          <div className="inventoryCurrencyPill">
            <Gem size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Spirit Stones</span>
            <span className="inventoryCurrencyValue">{currencies.spiritStones}</span>
          </div>
          <div className="inventoryCurrencyPill">
            <Medal size={16} aria-hidden="true" />
            <span className="inventoryCurrencyLabel">Merit</span>
            <span className="inventoryCurrencyValue">{currencies.merit}</span>
          </div>
        </div>
        <div className="inventoryHeaderActions">
          <button
            className="inventoryIconButton"
            type="button"
            onClick={openManualSatchel}
            aria-label="Open manual satchel"
          >
            <Backpack size={18} aria-hidden="true" />
            <span className="inventoryIconBadge">{satchelCount}</span>
          </button>
          <button
            className="inventoryIconButton"
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
                  className="inventoryPocketButton"
                  type="button"
                  onClick={() => setActivePocket(category)}
                  disabled={isDisabled}
                  data-active={isActive}
                >
                  <span className="inventoryPocketLabel">{formatPocketLabel(category)}</span>
                  <span className="inventoryPocketCount">{count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <main className="inventoryRingPanel">
          <div className="inventoryRingHeader">
            <div className="inventoryRingTitle">
              <span className="inventoryRingPocket">{selectedCategoryLabel}</span>
              <span className="inventoryRingCount">{filteredItems.length} items</span>
            </div>
          </div>
          <div className="inventoryRingScroll" role="region" aria-label="Inventory items">
            {filteredItems.length === 0 ? (
              <div className="inventoryGridEmpty">No items in this pocket.</div>
            ) : (
              <div className="inventoryItemGrid">
                {filteredItems.map((item) => (
                  <button
                    key={item.itemId}
                    className="inventoryItemTile"
                    type="button"
                    onClick={() => setSelectedItemId(item.itemId)}
                    data-selected={selectedItemId === item.itemId}
                  >
                    <div className="inventoryItemTileHeader">
                      <span className="inventoryItemTileName">{item.name}</span>
                      <span className="inventoryItemTileQty">x{item.qty}</span>
                    </div>
                    <div className="inventoryItemTileMeta">
                      <span className="inventoryItemTileCategory">{formatPocketLabel(item.category)}</span>
                      {item.stackSize ? <span className="inventoryItemTileStack">Stack {item.stackSize}</span> : null}
                    </div>
                    <div className="inventoryItemTileId">{item.itemId}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="inventoryInspector inventoryPanelBase">
          {!selectedItem ? (
            <div className="inventoryInspectorEmpty">
              <div className="inventoryInspectorTitle">Select an item</div>
              <div className="inventoryInspectorCopy">Tap a tile to see details. Manual Satchel tips live there too.</div>
            </div>
          ) : (
            <div className="inventoryInspectorContent">
              <div className="inventoryInspectorHeader">
                <div>
                  <div className="inventoryInspectorName">{selectedItem.name}</div>
                  <div className="inventoryInspectorMeta">
                    <span className="inventoryCategoryBadge">{formatPocketLabel(selectedItem.category)}</span>
                    <span className="inventoryInspectorQty">x{selectedItem.qty}</span>
                  </div>
                </div>
              </div>
              {selectedItem.description ? <p className="inventoryInspectorDescription">{selectedItem.description}</p> : null}
              {selectedItem.note ? <p className="inventoryInspectorNote">{selectedItem.note}</p> : null}
              <div className="inventoryInspectorDetails">
                <div className="inventoryInspectorDetail">
                  <span className="inventoryInspectorLabel">Item ID</span>
                  <span className="inventoryInspectorValue inventoryInspectorValue--mono">{selectedItem.itemId}</span>
                </div>
                {selectedItem.stackSize ? (
                  <div className="inventoryInspectorDetail">
                    <span className="inventoryInspectorLabel">Stack Size</span>
                    <span className="inventoryInspectorValue">{selectedItem.stackSize}</span>
                  </div>
                ) : null}
                {selectedItem.usage ? (
                  <div className="inventoryInspectorDetail">
                    <span className="inventoryInspectorLabel">Usage</span>
                    <span className="inventoryInspectorValue">{selectedItem.usage.replace(/_/g, ' ')}</span>
                  </div>
                ) : null}
                {typeof selectedItem.sellValue === 'number' ? (
                  <div className="inventoryInspectorDetail">
                    <span className="inventoryInspectorLabel">Sell Value</span>
                    <span className="inventoryInspectorValue">{selectedItem.sellValue}</span>
                  </div>
                ) : null}
              </div>
              <div className="inventoryInspectorActions">
                {selectedItem.category === 'talisman' && selectedItem.qty > 0 ? (
                  <button
                    className="inventoryPrimaryButton"
                    type="button"
                    onClick={() => {
                      const result = activateTalisman(selectedItem.itemId);
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
        </aside>
      </div>

      {equipmentOverlayOpen ? (
        <div className="inventoryEquipmentOverlay" role="dialog" aria-modal="true" aria-label="Equipment overview">
          <div className="inventoryEquipmentPanel">
            <div className="inventoryEquipmentHeader">
              <div>
                <div className="inventoryEquipmentTitle">Cultivator Equipment</div>
                <div className="inventoryEquipmentSubtitle">Quick view of your equipped gear.</div>
              </div>
              <button
                className="inventoryIconButton"
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
