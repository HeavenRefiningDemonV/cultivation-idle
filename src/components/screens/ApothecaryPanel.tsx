import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore';
import { useShopStore } from '../../stores/shopStore';
import { randFloat } from '../../utils/rng';
import { RewardService } from '../../services/rewards';
import { apothecaryBundles } from '../../features/apothecary/apothecaryBundles';
import { apothecaryServices } from '../../features/apothecary/apothecaryServices';
import { buildPotionMetaChips } from '../../features/apothecary/potionMetaIcons';
import { GameEvents } from '../../services/events/GameEvents';
import { getConsumableSpec } from '../../systems/consumables/consumableCatalog';
import { ConsumableMetaChips } from '../consumables/ConsumableMetaChips';
import { MedicinePouchModal } from '../modals/MedicinePouchModal';
import { InkPanel, PaperCard, PaperChip } from '../../ui/ink';
import './ApothecaryPanel.scss';

type ShelfKey = 'combat' | 'cultivation' | 'rotating' | 'services' | 'bundles';

type StatusMessage = { type: 'success' | 'error'; message: string };

interface ApothecaryPanelProps {
  shopId: string | null;
}

function stringToSeed(input: string) {
  let seed = 0;
  for (let i = 0; i < input.length; i += 1) {
    seed = (seed * 31 + input.charCodeAt(i)) >>> 0;
  }
  return seed;
}

function pickDeterministic<T>(pool: T[], count: number, seed: number) {
  const available = [...pool];
  const picks: T[] = [];
  let currentSeed = seed;

  while (picks.length < count && available.length > 0) {
    const { value, seed: nextSeed } = randFloat(currentSeed || 1);
    currentSeed = nextSeed;
    const idx = Math.floor(value * available.length);
    picks.push(available.splice(idx, 1)[0]);
  }

  return { picks, seed: currentSeed };
}

function usageLabel(usage?: string) {
  switch (usage) {
    case 'combat_only':
      return 'Combat Only';
    case 'cultivate_only':
      return 'Cultivation Only';
    case 'combat_or_world':
      return 'Combat / World';
    default:
      return 'General';
  }
}

function usageToChipUsage(usage?: string): 'combat' | 'cultivation' | 'both' {
  switch (usage) {
    case 'combat_only':
      return 'combat';
    case 'cultivate_only':
      return 'cultivation';
    case 'combat_or_world':
    default:
      return 'both';
  }
}

export function ApothecaryPanel({ shopId }: ApothecaryPanelProps) {
  const apothecary = useContentStore((state) =>
    shopId ? state.maps.apothecariesById[shopId] : undefined,
  );
  const currencies = useInventoryStore((state) => state.currencies);
  const getQty = useInventoryStore((state) => state.getQty);

  const dayKey = useShopStore((state) => state.dayKey);
  const ensureDayKeyCurrent = useShopStore((state) => state.ensureDayKeyCurrent);
  const getPurchased = useShopStore((state) => state.getPurchased);
  const getRemainingToday = useShopStore((state) => state.getRemainingToday);
  const canBuy = useShopStore((state) => state.canBuy);
  const buy = useShopStore((state) => state.buy);

  const [activeShelf, setActiveShelf] = useState<ShelfKey>('combat');
  const [statusByStock, setStatusByStock] = useState<Record<string, StatusMessage>>({});
  const [statusByBundle, setStatusByBundle] = useState<Record<string, StatusMessage>>({});
  const [statusByService, setStatusByService] = useState<Record<string, StatusMessage>>({});
  const [pouchOpen, setPouchOpen] = useState(false);
  const pouchButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    ensureDayKeyCurrent();
  }, [ensureDayKeyCurrent]);

  const stock = apothecary?.stock ?? [];
  const pouchSlots = useMedicinePouchStore((state) => state.slots);
  const badgeCount = Object.values(pouchSlots || {}).filter((slot) => Boolean(slot?.equippedItemId)).length;
  const badgeDisplay = badgeCount > 9 ? '9+' : `${badgeCount}`;
  const hasReadyPouchItem = Object.values(pouchSlots || {}).some(
    (slot) => Boolean(slot?.enabled && slot?.equippedItemId && getQty(slot.equippedItemId) > 0),
  );

  const combatStock = useMemo(
    () =>
      stock.filter((entry) => {
        const usage = getItemDef(entry.itemId)?.usage;
        // Default unknown usage to combat to keep items visible until tagged.
        return usage === 'combat_only' || usage === 'combat_or_world' || usage === undefined;
      }),
    [stock],
  );

  const cultivationStock = useMemo(
    () => stock.filter((entry) => getItemDef(entry.itemId)?.usage === 'cultivate_only'),
    [stock],
  );

  const rotatingStock = useMemo(() => {
    if (!apothecary) return [] as typeof stock;
    let seed = stringToSeed(`${apothecary.id}${dayKey}rotating`);
    const combatPick = pickDeterministic(combatStock, 2, seed);
    seed = combatPick.seed;
    const cultivationPick = pickDeterministic(cultivationStock, 2, seed);
    return [...combatPick.picks, ...cultivationPick.picks];
  }, [apothecary, dayKey, combatStock, cultivationStock]);

  const renderPlaceholder = (title: string, body: string) => (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>{title}</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>{body}</div>
    </div>
  );

  if (!shopId) {
    return renderPlaceholder('No Apothecary here', 'This city does not host an apothecary.');
  }

  if (!apothecary) {
    return renderPlaceholder('Apothecary data missing', `Shop definition not found (id: ${shopId}).`);
  }

  if (!apothecary.stock || apothecary.stock.length === 0) {
    return renderPlaceholder(apothecary.name ?? 'Apothecary', 'No stock available.');
  }

  const shelfOptions: { key: ShelfKey; label: string }[] = [
    { key: 'combat', label: `Combat (${combatStock.length})` },
    { key: 'cultivation', label: `Cultivation (${cultivationStock.length})` },
    { key: 'rotating', label: `Rotating (${rotatingStock.length})` },
    { key: 'services', label: 'Services' },
    { key: 'bundles', label: 'Bundles' },
  ];

  const renderStatus = (status?: StatusMessage) =>
    status ? (
      <div
        className={`apothecaryStatus apothecaryStatus--${status.type}`}
        role={status.type === 'error' ? 'alert' : 'status'}
      >
        {status.message}
      </div>
    ) : null;

  const renderStockCard = (entryId: string) => {
    const stockEntry = stock.find((s) => s.id === entryId);
    if (!stockEntry) return null;

    const itemDef = getItemDef(stockEntry.itemId);
    const itemName = itemDef?.name ?? stockEntry.itemId;
    const description = itemDef?.description || itemDef?.id || 'No description yet.';
    const rarity = itemDef?.rarity?.toLowerCase();
    const consumableSpec = getConsumableSpec(stockEntry.itemId);
    const perPurchaseQty = stockEntry.qty ?? 1;
    const purchased = getPurchased(apothecary.id, stockEntry.id);
    const remaining = getRemainingToday(apothecary.id, stockEntry.id, stockEntry.dailyLimit);
    const limit = stockEntry.dailyLimit;
    const owned = getQty(stockEntry.itemId);

    const maxUnlimitedQty = Math.min(99, itemDef?.stackSize ?? 99);
    const maxBuyQty = limit == null ? maxUnlimitedQty : remaining ?? 0;

    const canBuyOneResult = remaining !== 0 ? canBuy(apothecary.id, stockEntry.id, 1) : { ok: false, error: 'Sold out' };
    const canBuyMaxResult =
      maxBuyQty > 0 ? canBuy(apothecary.id, stockEntry.id, maxBuyQty) : { ok: false, error: 'Sold out' };
    const canBuyOne = canBuyOneResult.ok;
    const canBuyMax = canBuyMaxResult.ok;
    const blockedReason = canBuyOneResult.ok ? null : canBuyOneResult.error ?? 'Blocked';
    const showSealStamp = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

    const status = statusByStock[stockEntry.id];
    const tag = usageLabel(itemDef?.usage);
    const chips = buildPotionMetaChips({
      itemId: stockEntry.itemId,
      usage: usageToChipUsage(itemDef?.usage),
      stackSize: itemDef?.stackSize,
      spec: consumableSpec,
    });

    const handlePurchase = (qty: number) => {
      if (qty <= 0) return;
      GameEvents.emit({
        type: 'apothecary/item_selected',
        payload: { shopId: apothecary.id, itemId: stockEntry.itemId, qty },
      });
      const result = buy(apothecary.id, stockEntry.id, qty);
      if (!result.ok) {
        setStatusByStock((prev) => ({
          ...prev,
          [stockEntry.id]: { type: 'error', message: result.error || 'Purchase failed.' },
        }));
        GameEvents.emit({
          type: 'apothecary/buy_failed',
          payload: { shopId: apothecary.id, itemId: stockEntry.itemId, reason: result.error || 'Purchase failed.' },
        });
        if (result.error && /daily limit|sold out/i.test(result.error)) {
          GameEvents.emit({
            type: 'apothecary/daily_limit_hit',
            payload: { shopId: apothecary.id, itemId: stockEntry.itemId },
          });
        }
        return;
      }

      const grantedQty = result.grantedQty ?? perPurchaseQty * qty;
      setStatusByStock((prev) => ({
        ...prev,
        [stockEntry.id]: {
          type: 'success',
          message: `Purchased ${grantedQty} × ${itemName}.`,
        },
      }));
      GameEvents.emit({
        type: 'apothecary/buy_success',
        payload: { shopId: apothecary.id, itemId: stockEntry.itemId, qty: grantedQty },
      });
    };

    return (
      <PaperCard
        key={stockEntry.id}
        className={'apothecaryCard'}
        data-state={blockedReason ? 'blocked' : 'available'}
        variant="tray"
      >
        <div className={'apothecaryCardHeader'}>
          <div>
            <div className={'apothecaryCardTitle'}>{itemName}</div>
            <div className={'apothecaryCardSubtitle'}>{description}</div>
          </div>
          <div className={'apothecaryTagRow'}>
            <div className={'apothecaryTag'}>{tag}</div>
            {showSealStamp && <span className={`apothecarySealStamp apothecarySealStamp--${rarity}`}>Seal</span>}
            {blockedReason && (
              <span className={'apothecarySealBadge apothecaryTooltip'} data-tooltip={blockedReason}>
                Blocked
              </span>
            )}
          </div>
        </div>

        <div className={'apothecaryCardMeta'}>
          <span className={'apothecaryMetaLine'}>Owned: {owned}</span>
          <span className={'apothecaryMetaLine'}>Price: {formatPrice(stockEntry.price) || 'Free'}</span>
        </div>
        <div className={'apothecaryCardChips'}>
          <ConsumableMetaChips chips={chips} />
        </div>

        <div className={'apothecaryLimitBlock'}>
          {limit != null ? (
            <>
              <progress value={purchased} max={limit} className={'apothecaryProgress'} />
              <div className={'apothecaryLimitText'}>
                Remaining today: {Math.max(remaining ?? 0, 0)} / {limit}
              </div>
            </>
          ) : (
            <div className={'apothecaryLimitText'}>No daily limit</div>
          )}
        </div>

        <div className={'apothecaryActions'}>
          <button
            className={`apothecaryActionButton${canBuyOne ? ' apothecaryActionButton--active' : ''}`}
            onClick={() => handlePurchase(1)}
            disabled={!canBuyOne}
            title={!canBuyOne ? canBuyOneResult.error : undefined}
          >
            Buy 1
          </button>
          <button
            className={`apothecaryActionButton${canBuyMax ? ' apothecaryActionButton--active' : ''}`}
            onClick={() => handlePurchase(maxBuyQty)}
            disabled={!canBuyMax}
            title={!canBuyMax ? canBuyMaxResult.error : undefined}
          >
            Buy Max
          </button>
        </div>

        {renderStatus(status)}
      </PaperCard>
    );
  };

  const renderBundleCard = (bundle: (typeof apothecaryBundles)[number]) => {
    const status = statusByBundle[bundle.id];

    const handlePurchase = () => {
      GameEvents.emit({
        type: 'apothecary/item_selected',
        payload: { shopId: apothecary.id, itemId: bundle.items[0]?.itemId ?? bundle.id, qty: 1 },
      });
      const reason = `apothecary_bundle:${bundle.id}`;
      const spent = RewardService.spendCurrency(bundle.cost, reason);
      if (!spent) {
        setStatusByBundle((prev) => ({
          ...prev,
          [bundle.id]: { type: 'error', message: 'Not enough currency for this bundle.' },
        }));
        GameEvents.emit({ type: 'apothecary/bundle_buy', payload: { bundleId: bundle.id, ok: false } });
        return;
      }

      RewardService.grantRewards({ items: bundle.items }, reason);
      setStatusByBundle((prev) => ({
        ...prev,
        [bundle.id]: { type: 'success', message: 'Bundle purchased. Items delivered to inventory.' },
      }));
      GameEvents.emit({ type: 'apothecary/bundle_buy', payload: { bundleId: bundle.id, ok: true } });
    };

    return (
      <PaperCard key={bundle.id} className={'apothecaryCard apothecaryCard--bundle'} variant="tray">
        <div className={'apothecaryCardHeader'}>
          <div>
            <div className={'apothecaryCardTitle'}>{bundle.name}</div>
            <div className={'apothecaryCardSubtitle'}>{bundle.description}</div>
          </div>
          <div className={'apothecaryTag'}>Bundle</div>
        </div>

        <div className={'apothecaryCardBody'}>
          <div className={'apothecaryBundlePrice'}>Total: {formatPrice(bundle.cost) || 'Free'}</div>
          <div className={'apothecaryBundleIncludesLabel'}>Includes</div>
          <ul className={'apothecaryBundleList'}>
            {bundle.items.map((item) => {
              const itemDef = getItemDef(item.itemId);
              const name = itemDef?.name ?? item.itemId;
              return (
                <li key={item.itemId} className={'apothecaryBundleListItem'}>
                  <span className={'apothecaryBundleItemName'}>{name}</span>
                  <span className={'apothecaryBundleItemQty'}>× {item.qty}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={'apothecaryActions'}>
          <button
            className={'apothecaryActionButton apothecaryActionButton--active'}
            onClick={handlePurchase}
          >
            Buy Bundle
          </button>
        </div>

        {renderStatus(status)}
      </PaperCard>
    );
  };

  const renderServiceCard = (service: (typeof apothecaryServices)[number]) => {
    const status = statusByService[service.id];

    const handleClick = () => {
      setStatusByService((prev) => ({
        ...prev,
        [service.id]: {
          type: 'error',
          message: 'Service not implemented yet.',
        },
      }));
    };

    return (
      <PaperCard key={service.id} className={'apothecaryCard apothecaryCard--service'} variant="tray">
        <div className={'apothecaryCardHeader'}>
          <div>
            <div className={'apothecaryCardTitle'}>{service.name}</div>
            <div className={'apothecaryCardSubtitle'}>{service.description}</div>
          </div>
          <div className={'apothecaryTag'}>Service</div>
        </div>

        <div className={'apothecaryActions'}>
          <button
            className={'apothecaryActionButton apothecaryActionButton--active'}
            onClick={handleClick}
          >
            {service.actionLabel}
          </button>
        </div>

        {renderStatus(status)}
      </PaperCard>
    );
  };

  const renderShelf = (key: ShelfKey) => {
    if (key === 'bundles') {
      if (!apothecaryBundles.length) {
        return (
          <div className={'apothecaryEmpty'}>
            <div className={'apothecaryEmptyTitle'}>No bundles available.</div>
            <div className={'apothecaryEmptyBody'}>Special bundles will appear here when stocked.</div>
          </div>
        );
      }

      return (
        <div className={'apothecaryGrid apothecaryGrid--bundles'}>
          {apothecaryBundles.map((bundle) => renderBundleCard(bundle))}
        </div>
      );
    }

    if (key === 'services') {
      if (!apothecaryServices.length) {
        return (
          <div className={'apothecaryEmpty'}>
            <div className={'apothecaryEmptyTitle'}>No services active.</div>
            <div className={'apothecaryEmptyBody'}>Service counters will open here soon.</div>
          </div>
        );
      }

      return (
        <div className={'apothecaryGrid apothecaryGrid--services'}>
          {apothecaryServices.map((service) => renderServiceCard(service))}
        </div>
      );
    }

    const shelfStock = key === 'combat' ? combatStock : key === 'cultivation' ? cultivationStock : rotatingStock;

    if (!shelfStock.length) {
      return (
        <div className={'apothecaryEmpty'}>
          <div className={'apothecaryEmptyTitle'}>Nothing available.</div>
          <div className={'apothecaryEmptyBody'}>No items match this shelf right now.</div>
        </div>
      );
    }

    return (
      <div className={'apothecaryGrid'}>
        {shelfStock.map((entry) => renderStockCard(entry.id))}
      </div>
    );
  };

  return (
    <InkPanel variant="apothecary" watermark className={'apothecaryPanel apothecaryPanel--v2'}>
      <header className={'apothecaryTopRibbon'}>
        <div className={'apothecaryTopLeft'}>
          <div className={'apothecaryHeading'}>{apothecary.name ?? 'Apothecary'}</div>
          <div className={'apothecarySubheading'}>
            Buy remedies for combat and cultivation. Daily limits reset at local midnight.
          </div>
          <div className={'apothecaryDayKey'}>Day: {dayKey}</div>
        </div>
        <div className={'apothecaryTopRight'}>
          <PaperCard className={'apothecaryWallet'} variant="label">
            <div className={'apothecaryWalletLabel'}>Wallet</div>
            <div className={'apothecaryWalletGrid'}>
              <span>Gold</span>
              <strong>{currencies.gold ?? '0'}</strong>
              <span>Spirit Stones</span>
              <strong>{currencies.spiritStones ?? '0'}</strong>
              <span>Merit</span>
              <strong>{currencies.merit ?? '0'}</strong>
            </div>
          </PaperCard>
        </div>
      </header>

      <div className={'apothecaryStage'}>
        <div className={'apothecaryPouchTrigger'}>
          <button
            type="button"
            className={`apothecaryPouchIconButton${
              hasReadyPouchItem ? ' apothecaryPouchIconButton--ready' : ''
            }`}
            onClick={() => setPouchOpen(true)}
            aria-label="Open Medicine Pouch"
            title="Medicine Pouch"
            ref={pouchButtonRef}
          >
            <span className="apothecaryPouchIcon" aria-hidden="true">
              🧪
            </span>
            {badgeCount > 0 && (
              <span className="apothecaryPouchBadge" aria-label={`${badgeCount} items`}>
                {badgeDisplay}
              </span>
            )}
            {hasReadyPouchItem && <span className="apothecaryPouchReadyDot" aria-hidden="true" />}
          </button>
        </div>
        <div className={'apothecarySafeZone'}>
          <PaperCard className={'apothecaryStoreFrame'} variant="tray">
            <div className={'apothecaryShelfTabs'}>
              {shelfOptions.map((option) => (
                <PaperChip
                  key={option.key}
                  className={`apothecaryShelfTab${activeShelf === option.key ? ' apothecaryShelfTab--active' : ''}`}
                  text={option.label}
                  onClick={() => setActiveShelf(option.key)}
                />
              ))}
            </div>

            {renderShelf(activeShelf)}
          </PaperCard>
        </div>
        <div className={'apothecaryAmbientZone'} aria-hidden="true" />
      </div>

      <MedicinePouchModal open={pouchOpen} onClose={() => setPouchOpen(false)} anchorRef={pouchButtonRef} />
    </InkPanel>
  );
}
