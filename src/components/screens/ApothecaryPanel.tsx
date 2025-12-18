import { useEffect, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore';
import { useShopStore } from '../../stores/shopStore';
import { multiply } from '../../utils/numbers';

interface ApothecaryPanelProps {
  shopId: string | null;
}

const currencyKeys = ['gold', 'spiritStones', 'merit'] as const;

function computeTotalPrice(price: Partial<Record<string, string>>, qty: number) {
  const totals: Partial<Record<string, string>> = {};
  currencyKeys.forEach((key) => {
    const unit = price[key];
    if (unit !== undefined) {
      totals[key] = multiply(unit, qty).toString();
    }
  });
  return totals;
}

export function ApothecaryPanel({ shopId }: ApothecaryPanelProps) {
  const shop = useContentStore((state) => (shopId ? state.maps.apothecariesById[shopId] : undefined));
  const purchasedToday = useShopStore((state) => state.purchasedToday);
  const dayKey = useShopStore((state) => state.dayKey);
  const ensureDayKeyCurrent = useShopStore((state) => state.ensureDayKeyCurrent);
  const buy = useShopStore((state) => state.buy);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [statusByStock, setStatusByStock] = useState<
    Record<string, { type: 'success' | 'error'; message: string }>
  >({});

  useEffect(() => {
    ensureDayKeyCurrent();
  }, [ensureDayKeyCurrent]);

  const handleSetQty = (stockId: string, qty: number) => {
    const next = Math.max(1, Math.floor(qty));
    setQuantities((prev) => ({ ...prev, [stockId]: next }));
  };

  const renderContent = () => {
    if (!shopId) {
      return (
        <div className={'worldScreenPlaceholder'}>
          <div className={'worldScreenPlaceholderHeader'}>
            <div className={'worldScreenPlaceholderTitle'}>No Apothecary here</div>
          </div>
          <div className={'worldScreenPlaceholderBody'}>This city does not host an apothecary.</div>
        </div>
      );
    }

    if (!shop) {
      return (
        <div className={'worldScreenPlaceholder'}>
          <div className={'worldScreenPlaceholderHeader'}>
            <div className={'worldScreenPlaceholderTitle'}>Apothecary data missing</div>
          </div>
          <div className={'worldScreenPlaceholderBody'}>Shop definition not found (id: {shopId}).</div>
        </div>
      );
    }

    if (!shop.stock || shop.stock.length === 0) {
      return (
        <div className={'worldScreenPlaceholder'}>
          <div className={'worldScreenPlaceholderHeader'}>
            <div className={'worldScreenPlaceholderTitle'}>{shop.name ?? 'Apothecary'}</div>
          </div>
          <div className={'worldScreenPlaceholderBody'}>No stock available.</div>
        </div>
      );
    }

    return (
      <div className={'apothecaryPanel'}>
        <div className={'apothecaryPanelHeader'}>
          <div>
            <div className={'apothecaryTitle'}>{shop.name ?? 'Apothecary'}</div>
            <div className={'apothecarySubtitle'}>Daily reset key: {dayKey}</div>
          </div>
          <div className={'apothecaryMeta'}>
            <div>ID: {shop.id}</div>
            <div>City: {shop.cityId}</div>
          </div>
        </div>

        <div className={'apothecaryStockList'}>
          {shop.stock.map((stock) => {
            const item = getItemDef(stock.itemId);
            const itemName = item?.name ?? stock.itemId;
            const perPurchaseQty = stock.qty ?? 1;
            const purchased = purchasedToday[shop.id]?.[stock.id] ?? 0;
            const limit = stock.dailyLimit;
            const remaining = limit == null ? null : Math.max(limit - purchased, 0);
            const qty = quantities[stock.id] ?? 1;
            const cappedQty = remaining == null ? qty : Math.min(qty, Math.max(remaining, 1));
            const totalPrice = computeTotalPrice(stock.price ?? {}, cappedQty);

            const canBuy = cappedQty >= 1 && (remaining == null || cappedQty <= remaining);
            const status = statusByStock[stock.id];
            const maxButtonQty = remaining == null ? 99 : Math.max(remaining, 0);

            return (
              <div key={stock.id} className={'apothecaryStockCard'}>
                <div className={'apothecaryStockHeader'}>
                  <div>
                    <div className={'apothecaryStockName'}>{itemName}</div>
                    <div className={'apothecaryStockId'}>{stock.itemId}</div>
                  </div>
                  <div className={'apothecaryPriceBlock'}>
                    <div>Price: {formatPrice(stock.price) || 'Free'}</div>
                    <div className={'apothecaryPerQty'}>Grants {perPurchaseQty}x per purchase</div>
                  </div>
                </div>
                <div className={'apothecaryStockBody'}>
                  <div className={'apothecaryLimit'}>
                    Daily limit:{' '}
                    {limit == null ? 'Unlimited' : `${purchased} / ${limit}`}
                    {remaining != null && ` (Remaining: ${remaining})`}
                  </div>
                  <div className={'apothecaryControls'}>
                    <div className={'apothecaryQtyControls'}>
                      <label className={'apothecaryLabel'}>
                        Qty
                        <input
                          type="number"
                          min={1}
                          value={cappedQty}
                          onChange={(e) => handleSetQty(stock.id, Number(e.target.value))}
                          disabled={remaining === 0}
                        />
                      </label>
                      <div className={'apothecaryQuickButtons'}>
                        <button onClick={() => handleSetQty(stock.id, 1)} disabled={remaining === 0}>
                          x1
                        </button>
                        <button onClick={() => handleSetQty(stock.id, 5)} disabled={remaining === 0}>
                          x5
                        </button>
                        <button
                          onClick={() => handleSetQty(stock.id, maxButtonQty || 1)}
                          disabled={remaining === 0}
                        >
                          Max
                        </button>
                      </div>
                    </div>
                    <div className={'apothecaryTotals'}>
                      <div>Total price: {formatPrice(totalPrice) || 'Free'}</div>
                      <div>Will receive: {perPurchaseQty * cappedQty}x</div>
                    </div>
                    <div className={'apothecaryActions'}>
                      <button
                        className={`worldScreenModuleButton ${canBuy ? 'worldScreenModuleButton--active' : ''}`}
                        onClick={() => {
                          const result = buy(shop.id, stock.id, cappedQty);
                          if (!result.ok) {
                            setStatusByStock((prev) => ({
                              ...prev,
                              [stock.id]: { type: 'error', message: result.error || 'Purchase failed' },
                            }));
                            return;
                          }
                          setStatusByStock((prev) => ({
                            ...prev,
                            [stock.id]: {
                              type: 'success',
                              message: `Purchased +${(result.grantedQty ?? perPurchaseQty * cappedQty)} ${itemName}`,
                            },
                          }));
                        }}
                        disabled={!canBuy || remaining === 0}
                      >
                        {remaining === 0 ? 'Sold Out Today' : 'Buy'}
                      </button>
                    </div>
                  </div>
                  {status && (
                    <div
                      className={`apothecaryStatus apothecaryStatus--${status.type}`}
                      role={status.type === 'error' ? 'alert' : 'status'}
                    >
                      {status.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return renderContent();
}
