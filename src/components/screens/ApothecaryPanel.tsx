import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useShopStore } from '../../stores/shopStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { buildApothecaryBuyReadModel } from '../../features/apothecary/apothecaryBuyReadModel.js';
import { apothecaryServices } from '../../features/apothecary/apothecaryServices.js';
import { buildPotionMetaChips } from '../../features/apothecary/potionMetaIcons.js';
import {
  buildApothecaryPrepReadModel,
  type ApothecaryRecommendedPackageEntry,
  type ApothecaryRouteIntent,
} from '../../features/apothecary/apothecaryPrepReadModel.js';
import { ApothecaryBrewPanel } from '../../features/apothecary/ApothecaryBrewPanel.js';
import { GameEvents } from '../../services/events/GameEvents.js';
import { getConsumableSpec } from '../../systems/consumables/consumableCatalog.js';
import { consumeConsumable } from '../../systems/consumables/consumeConsumable.js';
import { ConsumableMetaChips } from '../consumables/ConsumableMetaChips.js';
import { MedicinePouchPanel } from '../consumables/MedicinePouchPanel.js';
import { MedicinePouchModal } from '../modals/MedicinePouchModal.js';
import { InkPanel, PaperCard, PaperChip } from '../../ui/ink.js';
import { GameIcon } from '../../ui/icons.js';
import './ApothecaryPanel.scss';

type BuyFilterKey = 'all' | 'combat' | 'cultivation' | 'rotating';
type PrimaryTabKey = 'buy' | 'brew' | 'pouch';

type StatusMessage = { type: 'success' | 'error'; message: string };

interface ApothecaryPanelProps {
  shopId: string | null;
  initialSurface?: PrimaryTabKey;
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

export function ApothecaryPanel({ shopId, initialSurface = 'buy' }: ApothecaryPanelProps) {
  const apothecary = useContentStore((state) =>
    shopId ? state.maps.apothecariesById[shopId] : undefined,
  );
  const raw = useContentStore((state) => state.raw);
  const city = useContentStore((state) =>
    apothecary?.cityId ? state.maps.citiesById[apothecary.cityId] : undefined,
  );

  const currencies = useInventoryStore((state) => state.currencies);
  const inventoryItems = useInventoryStore((state) => state.items);
  const getQty = useInventoryStore((state) => state.getQty);

  const dayKey = useShopStore((state) => state.dayKey);
  const ensureDayKeyCurrent = useShopStore((state) => state.ensureDayKeyCurrent);
  const getPurchased = useShopStore((state) => state.getPurchased);
  const getRemainingToday = useShopStore((state) => state.getRemainingToday);
  const canBuy = useShopStore((state) => state.canBuy);
  const buy = useShopStore((state) => state.buy);
  const purchasedToday = useShopStore((state) => (shopId ? state.purchasedToday[shopId] ?? {} : {}));

  const pouchSlots = useMedicinePouchStore((state) => state.slots);
  const brewQueue = useProfessionStore((state) => state.alchemyQueue);
  const addNotification = useUIStore((state) => state.addNotification);

  const [activeTab, setActiveTab] = useState<PrimaryTabKey>(initialSurface);
  const [buyFilter, setBuyFilter] = useState<BuyFilterKey>('all');
  const [statusByStock, setStatusByStock] = useState<Record<string, StatusMessage>>({});
  const [bundleStatus, setBundleStatus] = useState<StatusMessage | null>(null);
  const [pouchOpen, setPouchOpen] = useState(false);
  const pouchButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    ensureDayKeyCurrent();
  }, [ensureDayKeyCurrent]);

  useEffect(() => {
    setActiveTab(initialSurface);
  }, [initialSurface, shopId]);

  const renderPlaceholder = (title: string, body: string) => (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>{title}</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>{body}</div>
    </div>
  );

  const stock = apothecary?.stock ?? [];
  const combatStock = stock.filter((entry) => {
    const usage = getItemDef(entry.itemId)?.usage;
    return usage === 'combat_only' || usage === 'combat_or_world' || usage === undefined;
  });
  const cultivationStock = stock.filter((entry) => getItemDef(entry.itemId)?.usage === 'cultivate_only');
  const rotatingStock = stock.filter((entry, index) => index < 2 || index === stock.length - 1);

  const prepModel = useMemo(
    () =>
      buildApothecaryPrepReadModel({
        content: raw,
        shop: apothecary,
        inventoryItems,
        pouchSlots,
        purchasedTodayByStockId: purchasedToday,
        brewQueue,
        bundleCount: 0,
      }),
    [apothecary, brewQueue, inventoryItems, pouchSlots, purchasedToday, raw],
  );

  const buyReadModel = useMemo(
    () =>
      buildApothecaryBuyReadModel({
        content: raw,
        shop: apothecary ?? null,
        inventoryItems,
        currencies,
        purchasedTodayByStockId: purchasedToday,
      }),
    [apothecary, currencies, inventoryItems, purchasedToday, raw],
  );

  const cityBundle = buyReadModel.bundleState.bundle;

  const pouchBadgeCount = prepModel.pouchSummary.filledSlots;
  const badgeDisplay = pouchBadgeCount > 9 ? '9+' : `${pouchBadgeCount}`;
  const hasReadyPouchItem = prepModel.pouchSummary.stocked;

  const primaryTabs: Array<{ key: PrimaryTabKey; label: string; blurb: string }> = [
    { key: 'buy', label: 'Buy', blurb: 'Instant convenience and shelf stock.' },
    { key: 'brew', label: 'Brew', blurb: 'Turn reagents into reserves more efficiently.' },
    { key: 'pouch', label: 'Medicine Pouch', blurb: 'Set what stays ready for emergencies.' },
  ];

  const buyFilters: Array<{ key: BuyFilterKey; label: string }> = [
    { key: 'all', label: `All (${stock.length})` },
    { key: 'combat', label: `Combat (${combatStock.length})` },
    { key: 'cultivation', label: `Cultivation (${cultivationStock.length})` },
    { key: 'rotating', label: `Quick Picks (${rotatingStock.length})` },
  ];

  const filteredStock =
    buyFilter === 'combat'
      ? combatStock
      : buyFilter === 'cultivation'
        ? cultivationStock
        : buyFilter === 'rotating'
          ? rotatingStock
          : stock;

  const handleRouteIntent = (routeIntent: ApothecaryRouteIntent) => {
    if (routeIntent.kind === 'source_missing_mats') {
      addNotification('info', routeIntent.note, 3500);
      setActiveTab(routeIntent.targetTab);
      return;
    }

    setActiveTab(routeIntent.targetTab);
    addNotification('info', routeIntent.note, 2500);
  };

  const renderStatus = (status?: StatusMessage) =>
    status ? (
      <div
        className={`apothecaryStatus apothecaryStatus--${status.type}`}
        role={status.type === 'error' ? 'alert' : 'status'}
      >
        {status.message}
      </div>
    ) : null;


  const renderFloorSummary = () => (
    <PaperCard className={'apothecarySectionCard'} variant="tray">
      <div className={'apothecarySectionEyebrow'}>Stock Floors</div>
      <div className={'apothecarySectionBody'}>
        Floors show what instant readiness looks like in this city right now. If Buy is capped, Brew covers the honest remainder.
      </div>
      <div className={'apothecarySecondaryList'}>
        {buyReadModel.floorStatuses.map((floor) => (
          <div key={floor.key} className={'apothecarySecondaryItem'}>
            <strong>{floor.label}</strong>
            <span>
              {floor.itemName}: {floor.ownedQty} / {floor.targetQty}
              {floor.met ? ' • Met' : ' • Below floor'}
            </span>
          </div>
        ))}
      </div>
    </PaperCard>
  );

  const renderPackageCoverage = () => {
    const coverage = buyReadModel.packageCoverage;
    if (!coverage) return null;

    return (
      <PaperCard className={'apothecarySectionCard'} variant="tray">
        <div className={'apothecarySectionEyebrow'}>Gate Prep Coverage</div>
        <div className={'apothecarySectionTitle'}>{coverage.packageDef.label}</div>
        <div className={'apothecarySectionBody'}>
          Buy covers speed. Brew covers the honest remainder whenever daily caps start throttling convenience.
        </div>
        <div className={'apothecarySectionMeta'}>
          <span>Instant lines: {coverage.instantBuyCoveredCount} / {coverage.lineCoverage.length}</span>
          <span>Capped lines: {coverage.cappedCount}</span>
          <span>Brew-backed lines: {coverage.brewSupportedCount}</span>
        </div>
        <div className={'apothecarySecondaryList'}>
          {coverage.lineCoverage.map((line) => {
            const itemDef = getItemDef(line.itemId);
            const itemName = itemDef?.name ?? line.itemId;
            const status = line.instantBuyCovered
              ? 'Instant buy-covered'
              : line.dailyLimitCapped
                ? line.visibleLiveBrew
                  ? 'Daily-limit capped • Brew-supported'
                  : 'Daily-limit capped'
                : line.visibleLiveBrew
                  ? 'Brew-supported only'
                  : 'Unavailable';
            return (
              <div key={line.itemId} className={'apothecarySecondaryItem'}>
                <strong>{itemName} ×{line.qty}</strong>
                <span>{status}</span>
              </div>
            );
          })}
          {coverage.supplementCoverage.map((lane) => (
            <div key={lane.key} className={'apothecarySecondaryItem'}>
              <strong>{lane.label}</strong>
              <span>
                {lane.supportedByShop
                  ? 'Has live shelf support'
                  : lane.supportedByBrew
                    ? 'Brew-supported supplement lane'
                    : 'No live support'}
              </span>
            </div>
          ))}
        </div>
      </PaperCard>
    );
  };

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

    const handleUseNow = () => {
      const result = consumeConsumable(stockEntry.itemId);
      setStatusByStock((prev) => ({
        ...prev,
        [stockEntry.id]: { type: result.ok ? 'success' : 'error', message: result.message },
      }));
      addNotification(result.ok ? 'success' : 'error', result.message, 3000);
    };

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
          {itemDef?.usage === 'cultivate_only' ? (
            <button
              className={`apothecaryActionButton${owned > 0 ? ' apothecaryActionButton--active' : ''}`}
              onClick={handleUseNow}
              disabled={owned <= 0}
              title={owned <= 0 ? 'Own at least one to use it now.' : undefined}
            >
              Drink Now
            </button>
          ) : null}
        </div>

        {renderStatus(status)}
      </PaperCard>
    );
  };

  const renderBundleCard = () => {
    if (!cityBundle) return null;

    const bundleBlockedReason = buyReadModel.bundleState.disableReason;

    const handlePurchase = () => {
      GameEvents.emit({
        type: 'apothecary/item_selected',
        payload: { shopId: apothecary.id, itemId: cityBundle.items[0]?.itemId ?? cityBundle.id, qty: 1 },
      });

      const blocked = cityBundle.items.find((item) => {
        const result = canBuy(apothecary.id, item.stockId, item.qty);
        return !result.ok;
      });
      if (blocked) {
        const failure = canBuy(apothecary.id, blocked.stockId, blocked.qty);
        setBundleStatus({ type: 'error', message: failure.error || `Cannot buy ${blocked.itemName} today.` });
        GameEvents.emit({ type: 'apothecary/bundle_buy', payload: { bundleId: cityBundle.id, ok: false } });
        return;
      }

      const purchasedItems: string[] = [];
      for (const item of cityBundle.items) {
        const result = buy(apothecary.id, item.stockId, item.qty);
        if (!result.ok) {
          setBundleStatus({ type: 'error', message: result.error || `Failed to buy ${item.itemName}.` });
          GameEvents.emit({ type: 'apothecary/bundle_buy', payload: { bundleId: cityBundle.id, ok: false } });
          return;
        }
        purchasedItems.push(`${item.itemName} ×${result.grantedQty ?? item.qty}`);
      }

      setBundleStatus({ type: 'success', message: `Bundle purchased: ${purchasedItems.join(', ')}.` });
      GameEvents.emit({ type: 'apothecary/bundle_buy', payload: { bundleId: cityBundle.id, ok: true } });
    };

    return (
      <PaperCard key={cityBundle.id} className={'apothecaryCard apothecaryCard--bundle'} variant="tray">
        <div className={'apothecaryCardHeader'}>
          <div>
            <div className={'apothecaryCardTitle'}>{cityBundle.name}</div>
            <div className={'apothecaryCardSubtitle'}>{cityBundle.description}</div>
          </div>
          <div className={'apothecaryTag'}>Convenience</div>
        </div>

        <div className={'apothecaryCardBody'}>
          <div className={'apothecaryBundlePrice'}>Total: {formatPrice(cityBundle.cost) || 'Free'}</div>
          <div className={'apothecaryBundleIncludesLabel'}>Includes</div>
          <ul className={'apothecaryBundleList'}>
            {cityBundle.items.map((item) => {
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
            className={`apothecaryActionButton${!bundleBlockedReason ? ' apothecaryActionButton--active' : ''}`}
            onClick={handlePurchase}
            disabled={Boolean(bundleBlockedReason)}
            title={bundleBlockedReason ?? undefined}
          >
            Buy Bundle
          </button>
        </div>

        {renderStatus(bundleStatus ?? (bundleBlockedReason ? { type: 'error', message: bundleBlockedReason } : undefined))}
      </PaperCard>
    );
  };

  const renderRecommendedPackageCard = (entry: ApothecaryRecommendedPackageEntry) => (
    <div key={entry.key} className={'apothecaryPackageEntry'}>
      <div>
        <div className={'apothecaryPackageLabel'}>{entry.label}</div>
        <div className={'apothecaryPackageName'}>{entry.itemName}</div>
        <div className={'apothecaryPackageMeta'}>
          Owned {entry.ownedQty} / Target {entry.targetQty}
          {entry.missingQty > 0 ? ` • Missing ${entry.missingQty}` : ' • Reserve met'}
        </div>
      </div>
      <button
        type="button"
        className={'apothecaryActionButton apothecaryActionButton--active'}
        onClick={() => handleRouteIntent(entry.routeIntent)}
      >
        {entry.routeIntent.label}
      </button>
    </div>
  );

  const renderBuySurface = () => (
    <>
      <PaperCard className={'apothecarySectionCard apothecarySectionCard--intro'} variant="tray">
        <div className={'apothecarySectionEyebrow'}>Buy</div>
        <div className={'apothecarySectionTitle'}>Instant convenience for missing prep.</div>
        <div className={'apothecarySectionBody'}>
          Buy is the fast answer: immediate shelf stock, visible prices, and honest daily limits for today’s city pressure.
        </div>
        <div className={'apothecarySectionMeta'}>
          <span>Stocked lines: {prepModel.buySummary.stockCount}</span>
          <span>Limited today: {prepModel.buySummary.limitedCount}</span>
          <span>Still available today: {prepModel.buySummary.availableTodayCount}</span>
        </div>
      </PaperCard>

      {renderFloorSummary()}

      {renderPackageCoverage()}

      <PaperCard className={'apothecarySectionCard'} variant="tray">
        <div className={'apothecarySubTabs'}>
          {buyFilters.map((option) => (
            <PaperChip
              key={option.key}
              className={`apothecaryShelfTab${buyFilter === option.key ? ' apothecaryShelfTab--active' : ''}`}
              text={option.label}
              onClick={() => setBuyFilter(option.key)}
            />
          ))}
        </div>

        {filteredStock.length > 0 ? (
          <div className={'apothecaryGrid'}>{filteredStock.map((entry) => renderStockCard(entry.id))}</div>
        ) : (
          <div className={'apothecaryEmpty'}>
            <div className={'apothecaryEmptyTitle'}>Nothing on this shelf right now.</div>
            <div className={'apothecaryEmptyBody'}>Switch filters or brew what the shelf cannot supply today.</div>
          </div>
        )}
      </PaperCard>

      <PaperCard className={'apothecarySectionCard'} variant="tray">
        <div className={'apothecarySectionEyebrow'}>Convenience Bundles</div>
          <div className={'apothecarySectionBody'}>
            Bundles live inside Buy as the fast path. Daily caps throttle convenience, but Brew keeps the prep contract honest when shelf stock runs thin.
          </div>
          <div className={'apothecarySectionMeta'}>
            <span>Buyable now: {buyReadModel.bundleState.buyableNow ? 'Yes' : 'No'}</span>
            <span>Remaining today: {buyReadModel.bundleState.remainingPurchasesToday}</span>
            <span>{buyReadModel.bundleImprovesBiggestShortfall ? 'Bundle fixes the biggest shortfall' : 'Bundle is not the main shortfall fix'}</span>
          </div>
          <div className={'apothecaryGrid apothecaryGrid--bundles'}>
            {cityBundle ? renderBundleCard() : null}
          </div>
          {!cityBundle ? renderStatus({ type: 'error', message: buyReadModel.bundleState.disableReason || 'No bundle in this city.' }) : null}
        </PaperCard>

      <PaperCard className={'apothecarySectionCard apothecarySectionCard--secondary'} variant="tray">
        <div className={'apothecarySectionEyebrow'}>Counter Services</div>
        <div className={'apothecarySectionBody'}>
          Services are not a main semester pillar yet. For now, this counter is informational so it does not crowd out readiness prep.
        </div>
        <div className={'apothecarySecondaryList'}>
          {apothecaryServices.map((service) => (
            <div key={service.id} className={'apothecarySecondaryItem'}>
              <strong>{service.name}</strong>
              <span>{service.description}</span>
            </div>
          ))}
        </div>
      </PaperCard>
    </>
  );

  const renderPouchSurface = () => (
    <>
      <PaperCard className={'apothecarySectionCard apothecarySectionCard--intro'} variant="tray">
        <div className={'apothecarySectionEyebrow'}>Medicine Pouch</div>
        <div className={'apothecarySectionTitle'}>Keep emergency consumables ready, not hidden.</div>
        <div className={'apothecarySectionBody'}>
          Your pouch is part of readiness. Equip stocked items here so combat can actually use what you prepared.
        </div>
        <div className={'apothecarySectionMeta'}>
          <span>{prepModel.pouchSummary.readyLabel}</span>
          <span>{prepModel.pouchSummary.triggerSummary}</span>
        </div>
      </PaperCard>

      <MedicinePouchPanel variant="default" />
    </>
  );

  if (!shopId) {
    return renderPlaceholder('No Apothecary here', 'This city does not host an apothecary.');
  }

  if (!apothecary) {
    return renderPlaceholder('Apothecary data missing', `Shop definition not found (id: ${shopId}).`);
  }

  if (stock.length === 0) {
    return renderPlaceholder(apothecary.name ?? 'Apothecary', 'No stock available.');
  }

  return (
    <InkPanel variant="apothecary" watermark className={'apothecaryPanel apothecaryPanel--v2'}>
      <header className={'apothecaryTopRibbon'}>
        <div className={'apothecaryTopLeft'}>
          <div className={'apothecaryHeading'}>{apothecary.name ?? 'Apothecary'}</div>
          <div className={'apothecaryPurpose'}>{prepModel.purposeSentence}</div>
          <div className={'apothecarySubheading'}>
            Buy is speed. Brew is efficiency. Keep the pouch configured so today’s prep actually reaches combat.
          </div>
          <div className={'apothecaryDayKey'}>
            City: {city?.name ?? prepModel.cityName} • Day: {dayKey}
          </div>
          {prepModel.specialtyItemNames.length > 0 && (
            <div className={'apothecarySpecialtyLine'}>
              <strong>{prepModel.specialtyLineLabel}:</strong> {prepModel.specialtyItemNames.join(' • ')}
            </div>
          )}
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

      <div className={'apothecaryOverviewGrid'}>
        <PaperCard className={'apothecaryOverviewCard'} variant="tray">
          <div className={'apothecaryOverviewTitle'}>Prep Warnings</div>
          {prepModel.stockWarnings.length > 0 ? (
            <div className={'apothecaryWarningList'}>
              {prepModel.stockWarnings.map((warning) => (
                <button
                  key={warning.code}
                  type="button"
                  className={'apothecaryWarningCard'}
                  onClick={() => setActiveTab(warning.targetTab)}
                >
                  <div className={'apothecaryWarningTitle'}>{warning.title}</div>
                  <div className={'apothecaryWarningBody'}>{warning.detail}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className={'apothecaryOverviewEmpty'}>No immediate readiness blockers detected.</div>
          )}
        </PaperCard>

        <PaperCard className={'apothecaryOverviewCard'} variant="tray">
          <div className={'apothecaryOverviewTitle'}>Recommended Package</div>
          <div className={'apothecaryOverviewHint'}>
            Small and honest for this semester: top up today’s city line, keep healing reserve, and cover breakthrough prep.
          </div>
          <div className={'apothecaryPackageList'}>
            {prepModel.recommendedPackage.map((entry) => renderRecommendedPackageCard(entry))}
          </div>
        </PaperCard>

        <PaperCard className={'apothecaryOverviewCard'} variant="tray">
          <div className={'apothecaryOverviewTitle'}>Medicine Pouch Summary</div>
          <div className={'apothecaryPouchSummaryState'}>{prepModel.pouchSummary.readyLabel}</div>
          <div className={'apothecaryOverviewHint'}>{prepModel.pouchSummary.triggerSummary}</div>
          <div className={'apothecaryPouchSummaryGrid'}>
            {prepModel.pouchSummary.slotStatuses.map((slot) => (
              <div key={slot.slotKey} className={'apothecaryPouchSummaryRow'}>
                <strong>{slot.slotKey}</strong>
                <span>{slot.itemName}</span>
                <span>{slot.enabled ? slot.trigger : 'Disabled'}</span>
              </div>
            ))}
          </div>
          <div className={'apothecaryActions'}>
            <button
              type="button"
              className={'apothecaryActionButton apothecaryActionButton--active'}
              onClick={() => setActiveTab('pouch')}
            >
              Review Pouch
            </button>
            <button
              type="button"
              className={'apothecaryActionButton'}
              onClick={() => setPouchOpen(true)}
            >
              Open Editor
            </button>
          </div>
        </PaperCard>
      </div>

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
              <GameIcon icon="herbBundle" size={18} decorative />
            </span>
            {pouchBadgeCount > 0 && (
              <span className="apothecaryPouchBadge" aria-label={`${pouchBadgeCount} items`}>
                {badgeDisplay}
              </span>
            )}
            {hasReadyPouchItem && <span className="apothecaryPouchReadyDot" aria-hidden="true" />}
          </button>
        </div>

        <div className={'apothecarySafeZone'}>
          <PaperCard className={'apothecaryStoreFrame'} variant="tray">
            <div className={'apothecaryPrimaryTabs'}>
              {primaryTabs.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`apothecaryPrimaryTab${activeTab === option.key ? ' apothecaryPrimaryTab--active' : ''}`}
                  onClick={() => setActiveTab(option.key)}
                >
                  <span className={'apothecaryPrimaryTabLabel'}>{option.label}</span>
                  <span className={'apothecaryPrimaryTabBlurb'}>{option.blurb}</span>
                </button>
              ))}
            </div>

            {activeTab === 'buy' && renderBuySurface()}
            {activeTab === 'brew' && <ApothecaryBrewPanel cityId={apothecary.cityId} summary={prepModel.brewSummary} />}
            {activeTab === 'pouch' && renderPouchSurface()}
          </PaperCard>
        </div>
        <div className={'apothecaryAmbientZone'} aria-hidden="true" />
      </div>

      <MedicinePouchModal open={pouchOpen} onClose={() => setPouchOpen(false)} anchorRef={pouchButtonRef} />
    </InkPanel>
  );
}
