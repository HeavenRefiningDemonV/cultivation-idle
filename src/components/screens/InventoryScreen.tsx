import { useMemo, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { getItemDef } from '../../stores/contentStore';
import { useBuffStore } from '../../stores/buffStore';
import { useUIStore } from '../../stores/uiStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import './InventoryScreen.scss';

type DisplayItem = {
  itemId: string;
  qty: number;
  name: string;
  category: string;
  stackSize?: number;
};

function CurrencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="inventory-currency-row">
      <span className="inventory-currency-label">{label}</span>
      <span className="inventory-currency-value">{value}</span>
    </div>
  );
}

export default function InventoryScreen() {
  const currencies = useInventoryStore((state) => state.currencies);
  const items = useInventoryStore((state) => state.items);
  const activateTalisman = useBuffStore((state) => state.activateTalisman);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));
  const [statusByItem, setStatusByItem] = useState<Record<string, { type: 'success' | 'error'; message: string }>>(
    {},
  );

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
        };
      })
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
  }, [items]);

  return (
    <div className="inventory-screen">
      <h2>Inventory</h2>

      <div className="inventory-satchel-entry">
        <button className="inventory-satchel-button" onClick={openManualSatchel}>
          Manual Satchel ({satchelCount})
        </button>
        <div className="inventory-satchel-copy">Buy Manual → Study Manual → Technique Learned → Equip Technique → Auto-Used in Combat</div>
      </div>

      <div className="inventory-currencies">
        <CurrencyRow label="Gold" value={currencies.gold} />
        <CurrencyRow label="Spirit Stones" value={currencies.spiritStones} />
        <CurrencyRow label="Merit" value={currencies.merit} />
      </div>

      <div className="inventory-items">
        <h3>Items</h3>
        {displayItems.length === 0 ? (
          <div className="inventory-empty">No items yet.</div>
        ) : (
          <div className="inventory-item-grid">
            {displayItems.map((item) => (
              <div key={item.itemId} className="inventory-item-card">
                <div className="inventory-item-header">
                  <div className="inventory-item-name">{item.name}</div>
                  <div className="inventory-item-qty">x{item.qty}</div>
                </div>
                <div className="inventory-item-meta">
                  <span className="inventory-item-category">{item.category}</span>
                  {item.stackSize ? (
                    <span className="inventory-item-stack">Stack: {item.stackSize}</span>
                  ) : null}
                </div>
                <div className="inventory-item-id">{item.itemId}</div>
                {item.category === 'talisman' && item.qty > 0 && (
                  <div className="inventory-item-actions">
                    <button
                      className="inventory-item-use"
                      onClick={() => {
                        const result = activateTalisman(item.itemId);
                        if (!result.ok) {
                          setStatusByItem((prev) => ({
                            ...prev,
                            [item.itemId]: { type: 'error', message: result.error },
                          }));
                          return;
                        }
                        setStatusByItem((prev) => ({
                          ...prev,
                          [item.itemId]: { type: 'success', message: 'Activated talisman' },
                        }));
                      }}
                    >
                      Use
                    </button>
                  </div>
                )}
                {statusByItem[item.itemId] && (
                  <div className={`inventory-item-status inventory-item-status--${statusByItem[item.itemId].type}`}>
                    {statusByItem[item.itemId].message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
