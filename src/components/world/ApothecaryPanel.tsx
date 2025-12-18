import { useEffect, useMemo, useState } from 'react';
import { useContentStore } from '../../stores/contentStore';
import { useShopStore } from '../../stores/shopStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import type { ApothecaryStock } from '../../content';

interface ApothecaryPanelProps {
  shopId: string | null;
}

function getItemName(stock: ApothecaryStock, itemsById: Record<string, { name: string }>): string {
  return itemsById[stock.itemId]?.name ?? stock.itemId;
}

export function ApothecaryPanel({ shopId }: ApothecaryPanelProps) {
  const { shop, formatPrice, itemsById } = useContentStore((state) => ({
    shop: state.isLoaded && shopId ? state.getApothecaryShop(shopId) : undefined,
    formatPrice: state.formatPrice,
    itemsById: state.maps.itemsById,
  }));
  const purchasedToday = useShopStore((state) => state.purchasedToday);
  const dayKey = useShopStore((state) => state.dayKey);
  const ensureDayKeyCurrent = useShopStore((state) => state.ensureDayKeyCurrent);
  const buy = useShopStore((state) => state.buy);
  const canBuy = useShopStore((state) => state.canBuy);
  const currencies = useInventoryStore((state) => state.currencies);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    ensureDayKeyCurrent();
  }, [ensureDayKeyCurrent]);

  const stockList = useMemo(() => shop?.stock ?? [], [shop]);

  if (!shopId) {
    return <div className={'apothecaryMessage'}>No Apothecary in this city.</div>;
  }

  if (!shop) {
    return (
      <div className={'apothecaryMessage'}>
        Apothecary data missing (shopId={shopId}). Please check content files.
      </div>
    );
  }

  const handleQuantityChange = (stockId: string, value: number) => {
    if (!Number.isFinite(value)) return;
    const normalized = Math.max(1, Math.floor(value));
    setQuantities((prev) => ({ ...prev, [stockId]: normalized }));
  };

  const handleQuickSet = (stockId: string, value: number, cap?: number | null) => {
    const upperBound = cap != null ? Math.max(1, cap) : undefined;
    const bounded = upperBound ? Math.min(value, upperBound) : value;
    setQuantities((prev) => ({ ...prev, [stockId]: Math.max(1, bounded) }));
  };

  const handleBuy = (stock: ApothecaryStock) => {
    const qty = quantities[stock.id] ?? 1;
    const result = buy(shop.id, stock.id, qty);
    if (result.ok) {
      const itemName = getItemName(stock, itemsById);
      setMessages((prev) => ({
        ...prev,
        [stock.id]: `Purchased +${result.itemQty} ${itemName}`,
      }));
    } else {
      setMessages((prev) => ({ ...prev, [stock.id]: result.error }));
    }
  };

  return (
    <div className={'apothecaryPanel'}>
      <div className={'apothecaryHeader'}>
        <div>
          <div className={'apothecaryTitle'}>{shop.name ?? 'Apothecary'}</div>
          <div className={'apothecarySubtitle'}>Daily purchases reset each local day ({dayKey})</div>
        </div>
      </div>

      <div className={'apothecaryStockList'}>
        {stockList.map((stock) => {
          const purchased = purchasedToday[shop.id]?.[stock.id] ?? 0;
          const limit = stock.dailyLimit;
          const remaining = limit === undefined || limit === null ? null : Math.max(limit - purchased, 0);
          const maxAllowed = remaining !== null ? Math.max(remaining, 1) : 99;
          const qty = Math.min(quantities[stock.id] ?? 1, maxAllowed);
          const affordability = canBuy(shop.id, stock.id, qty);
          const message = messages[stock.id];
          const itemName = getItemName(stock, itemsById);
          const priceLabel = formatPrice(stock.price);
          const grantsQty = stock.qty ?? 1;

          return (
            <div key={stock.id} className={'apothecaryStock'}>
              <div className={'apothecaryStockMain'}>
                <div>
                  <div className={'apothecaryItemName'}>{itemName}</div>
                  <div className={'apothecaryPrice'}>Price: {priceLabel}</div>
                  <div className={'apothecaryLimit'}>
                    Purchased today: {purchased}
                    {limit !== undefined && limit !== null ? ` / ${limit}` : ' (no limit)'}
                  </div>
                  {limit !== undefined && limit !== null && (
                    <div className={'apothecaryRemaining'}>Remaining today: {remaining}</div>
                  )}
                  <div className={'apothecaryQtyInfo'}>Grants {grantsQty}x per purchase</div>
                  <div className={'apothecaryWallet'}>
                    Wallet — Gold: {currencies.gold}, Spirit Stones: {currencies.spiritStones}, Merit: {currencies.merit}
                  </div>
                </div>
                <div className={'apothecaryActions'}>
                  <div className={'apothecaryQuantity'}>
                    <label htmlFor={`qty-${stock.id}`}>Quantity</label>
                    <input
                      id={`qty-${stock.id}`}
                      type="number"
                      min={1}
                      max={maxAllowed}
                      value={qty}
                      onChange={(e) => handleQuantityChange(stock.id, Number(e.target.value))}
                    />
                    <div className={'apothecaryQuickButtons'}>
                      <button onClick={() => handleQuickSet(stock.id, 1, maxAllowed)}>x1</button>
                      <button onClick={() => handleQuickSet(stock.id, Math.min(5, maxAllowed), maxAllowed)}>x5</button>
                      <button onClick={() => handleQuickSet(stock.id, maxAllowed, maxAllowed)}>Max</button>
                    </div>
                  </div>
                  <button
                    className={'apothecaryBuyButton'}
                    onClick={() => handleBuy(stock)}
                    disabled={!affordability.ok || (remaining !== null && remaining <= 0)}
                  >
                    {remaining === 0 ? 'Sold Out Today' : 'Buy'}
                  </button>
                  <div className={'apothecaryMessageRow'}>
                    {message && <span className={'apothecaryFeedback'}>{message}</span>}
                    {!message && !affordability.ok && (
                      <span className={'apothecaryFeedback apothecaryFeedback--error'}>{affordability.error}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {stockList.length === 0 && <div className={'apothecaryMessage'}>No items available.</div>}
      </div>
    </div>
  );
}
