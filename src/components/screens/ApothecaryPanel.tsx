import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useShopStore } from '../../stores/shopStore';
import { useUIStore } from '../../stores/uiStore';
import { RewardService } from '../../services/rewards';
import { apothecaryBundles } from '../../features/apothecary/apothecaryBundles';
import { apothecaryServices } from '../../features/apothecary/apothecaryServices';
import { buildPotionMetaChips } from '../../features/apothecary/potionMetaIcons';
import {
  buildApothecaryPrepReadModel,
  type ApothecaryRecommendedPackageEntry,
  type ApothecaryRouteIntent,
} from '../../features/apothecary/apothecaryPrepReadModel';
import { ApothecaryBrewPanel } from '../../features/apothecary/ApothecaryBrewPanel';
import { GameEvents } from '../../services/events/GameEvents';
import { getConsumableSpec } from '../../systems/consumables/consumableCatalog';
import { ConsumableMetaChips } from '../consumables/ConsumableMetaChips';
import { MedicinePouchPanel } from '../consumables/MedicinePouchPanel';
import { MedicinePouchModal } from '../modals/MedicinePouchModal';
import { InkPanel, PaperCard, PaperChip } from '../../ui/ink';
import { GameIcon } from '../../ui/icons';
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
  const [statusByBundle, setStatusByBundle] = useState<Record<string, StatusMessage>>({});
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
        bundleCount: apothecaryBundles.length,
      }),
    [apothecary, brewQueue, inventoryItems, pouchSlots, purchasedToday, raw],
  );

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
          <div className={'apothecaryTag'}>Convenience</div>
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

      {apothecaryBundles.length > 0 && (
        <PaperCard className={'apothecarySectionCard'} variant="tray">
          <div className={'apothecarySectionEyebrow'}>Convenience Bundles</div>
          <div className={'apothecarySectionBody'}>
            Secondary convenience only. Bundles save clicks, but Buy and Brew remain the real prep loop this semester.
          </div>
          <div className={'apothecaryGrid apothecaryGrid--bundles'}>
            {apothecaryBundles.map((bundle) => renderBundleCard(bundle))}
          </div>
        </PaperCard>
      )}

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
