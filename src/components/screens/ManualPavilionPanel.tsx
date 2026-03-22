import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, MouseEvent } from 'react';
import './ManualPavilionPanel.scss';
import type { TechniqueDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useManualPavilionStore } from '../../stores/manualPavilionStore.js';
import type { ManualPurchaseResult } from '../../stores/manualPavilionStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../features/manuals/pavilionStockTypes.js';
import { formatPrice } from '../../stores/contentStore.js';
import { formatDurationHMS } from '../../utils/timeFormat.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getManualTierIcon, getManualPathIcon, getManualRoleIcon } from '../../features/manuals/manualIconMap.js';
import { ManualDetailModal, type ManualDetailData, type ManualPurchaseState } from '../modals/ManualDetailModal.js';
import { PaperCard } from '../../ui/ink/index.js';
import { GameIcon } from '../../ui/icons/index.js';

interface ManualPavilionPanelProps {
  pavilionId: string | null;
}

const gradeOrder: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const purchaseErrorCopy: Record<string, string> = {
  insufficient_funds: 'Not enough currency.',
  sealed: 'This manual is sealed by grade.',
  already_sold: 'Already purchased.',
  not_sold_here: 'Not sold in this pavilion.',
  spend_failed: 'Unable to spend currency (try again).',
  content_missing: 'Content missing (reload).',
  content_loading: 'Content is still loading.',
  purchase_in_progress: 'Purchase already in progress.',
  invalid_cost: 'Invalid price for this manual.',
  stock_missing: 'Pavilion stock missing. Try refreshing.',
  slot_missing: 'Manual slot missing. Try refreshing.',
};

function normalizeGradeValue(value?: string | null): ManualGrade {
  if (value && (gradeOrder as string[]).includes(value)) {
    return value as ManualGrade;
  }
  return 'mortal';
}

function rarityLabel(value: ManualRarity) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function gradeLabel(value: ManualGrade) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function deriveGradeCap(realmIndex: number): ManualGrade {
  if (realmIndex >= 6) return 'mystic';
  if (realmIndex >= 4) return 'heaven';
  if (realmIndex >= 2) return 'earth';
  return 'mortal';
}

function formatPurchaseError(reason?: string | null) {
  if (!reason) return null;
  return purchaseErrorCopy[reason] ?? reason.replace(/_/g, ' ');
}

type SpineState = 'placeholder' | 'available' | 'sealed' | 'notSold' | 'sold';

function getRoleBadge(role?: string): { short: string; label: string; key: string } {
  switch (role) {
    case 'offense':
      return { short: 'ATK', label: 'Offense', key: 'offense' };
    case 'defense':
      return { short: 'DEF', label: 'Defense', key: 'defense' };
    case 'utility':
      return { short: 'UTIL', label: 'Utility', key: 'utility' };
    default:
      return { short: 'GEN', label: 'General', key: 'general' };
  }
}

function normalizePath(path?: string) {
  if (path === 'heaven' || path === 'earth' || path === 'martial') {
    return path;
  }
  return 'unknown';
}

function resolveSpineState(slot: PavilionStockSlot | null): SpineState {
  if (!slot) return 'placeholder';
  if (slot.sold) return 'sold';
  if (slot.sealed) return 'sealed';
  if (slot.notSold) return 'notSold';
  return 'available';
}

interface BookSpineSlotProps {
  slot: PavilionStockSlot | null;
  technique?: TechniqueDef;
  isSelected: boolean;
  isJustPurchased: boolean;
  onSelect: (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => void;
  onHover: (slotIndex: number, rect: DOMRect) => void;
  onClearHover: () => void;
}

function BookSpineSlot({
  slot,
  technique,
  isSelected,
  isJustPurchased,
  onSelect,
  onHover,
  onClearHover,
}: BookSpineSlotProps) {
  const state = resolveSpineState(slot);
  const path = normalizePath(technique?.path);
  const roleBadge = getRoleBadge(technique?.role);
  const roleKey = roleBadge.key;
  const tierIcon = slot ? getManualTierIcon(slot.grade) : null;
  const pathIcon = getManualPathIcon(technique?.path);
  const typeIcon = getManualRoleIcon(technique?.role);

  if (!slot) {
    return (
      <div
        className={'pavilionSpine pavilionSpine--placeholder uiNoShift'}
        data-state="placeholder"
        data-path="unknown"
        data-rarity="common"
        data-role="general"
        aria-hidden="true"
      />
    );
  }

  const titleParts = [
    technique?.name ?? slot.techniqueId,
    `${gradeLabel(slot.grade)} ${rarityLabel(slot.rarity)}`,
    state !== 'available' ? state : 'Available',
  ];

  const handleHover = (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onHover(slot.slotIndex, rect);
  };

  return (
    <button
      type="button"
      className={`pavilionSpine uiNoShift ${isSelected ? 'pavilionSpine--selected is-selected' : ''} ${
        isJustPurchased ? 'pavilionSpine--justPurchased' : ''
      }`}
      data-state={state}
      data-path={path}
      data-rarity={slot.rarity}
      data-role={roleKey}
      onClick={onSelect}
      onMouseEnter={handleHover}
      onMouseLeave={onClearHover}
      onFocus={handleHover}
      onBlur={onClearHover}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(event);
        }
      }}
      title={titleParts.join(' • ')}
    >
      <div className="pavilionSpineName">{technique?.name ?? slot.techniqueId}</div>
      <div className="pavilionSpineMeta" aria-label="Manual metadata">
        {tierIcon && (
          <span className="pavilionSpineMetaIcon" role="img" aria-label={tierIcon.label} title={tierIcon.label}>
            {tierIcon.iconText ?? '◎'}
          </span>
        )}
        {pathIcon.iconId ? (
          <span className="pavilionSpineMetaIcon" role="img" aria-label={pathIcon.label} title={pathIcon.label}>
            <GameIcon icon={pathIcon.iconId} size={14} decorative />
          </span>
        ) : null}
        {typeIcon.iconId ? (
          <span className="pavilionSpineMetaIcon" role="img" aria-label={typeIcon.label} title={typeIcon.label}>
            <GameIcon icon={typeIcon.iconId} size={14} decorative />
          </span>
        ) : null}
      </div>
      {state !== 'available' && <div className={`pavilionSpineOverlay pavilionSpineOverlay--${state}`} />}
    </button>
  );
}

export function ManualPavilionPanel({ pavilionId }: ManualPavilionPanelProps) {
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const isContentLoading = useContentStore((state) => state.isLoading);
  const pavilion = useContentStore((state) => (pavilionId ? state.maps.pavilionsById[pavilionId] : undefined));
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const manualSystem = useContentStore((state) => state.raw?.economy?.manualSystem as any);
  const ensureStock = useManualPavilionStore((state) => state.ensureStock);
  const refreshStock = useManualPavilionStore((state) => state.refreshStock);
  const stock = useManualPavilionStore((state) => (pavilionId ? state.stockByPavilionId[pavilionId] : null));
  const buyManual = useManualPavilionStore((state) => state.buyManual);
  const isPurchasing = useManualPavilionStore((state) => state.isPurchasing);
  const lastPurchaseError = useManualPavilionStore((state) => state.lastError);
  const realmIndex = useGameStore((state) => state.realm.index);
  const canAffordCurrency = useInventoryStore((state) => state.canAffordCurrency);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const requestTechniqueFocus = useUIStore((state) => state.requestTechniqueFocus);
  const addNotification = useUIStore((state) => state.addNotification);
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));
  const activeStudy = useManualSatchelStore((state) => state.activeStudy);

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedManualSlotId, setSelectedManualSlotId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hovered, setHovered] = useState<{ slotIndex: number; rect: DOMRect } | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<(ManualPurchaseResult & { studied?: boolean }) | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [refreshFlash, setRefreshFlash] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [justPurchasedSlotId, setJustPurchasedSlotId] = useState<number | null>(null);
  const purchasePulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    setPurchaseResult(null);
    setPurchaseError(null);
  }, [selectedSlotId, stock?.generatedAt]);

  useEffect(() => {
    if (pavilionId && isContentLoaded && pavilion) {
      ensureStock(pavilionId);
    }
  }, [ensureStock, isContentLoaded, pavilion, pavilionId]);

  useEffect(() => {
    if (!stock || stock.slots.length === 0) return;
    if (selectedSlotId == null) {
      setSelectedSlotId(stock.slots[0]?.slotIndex ?? null);
      return;
    }
    const exists = stock.slots.some((slot) => slot.slotIndex === selectedSlotId);
    if (!exists) {
      setSelectedSlotId(stock.slots[0]?.slotIndex ?? null);
    }
  }, [selectedSlotId, stock]);

  useEffect(() => {
    if (!stock || selectedManualSlotId == null) return;
    const exists = stock.slots.some((slot) => slot.slotIndex === selectedManualSlotId);
    if (!exists) {
      setSelectedManualSlotId(null);
    }
  }, [selectedManualSlotId, stock]);

  useEffect(() => {
    if (!stock) return;
    setHovered(null);
    setSelectedManualSlotId((prev) => (prev != null ? null : prev));
    setJustPurchasedSlotId(null);
    if (purchasePulseTimeoutRef.current) {
      window.clearTimeout(purchasePulseTimeoutRef.current);
      purchasePulseTimeoutRef.current = null;
    }
  }, [stock?.generatedAt, stock]);

  useEffect(() => {
    return () => {
      if (purchasePulseTimeoutRef.current) {
        window.clearTimeout(purchasePulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (refreshFlash === 0) return;
    setFlashOn(true);
    const timeout = window.setTimeout(() => setFlashOn(false), 450);
    return () => window.clearTimeout(timeout);
  }, [refreshFlash]);

  const gradeCap = deriveGradeCap(realmIndex);
  const gradeSold = normalizeGradeValue(
    pavilion?.gradeSold ?? manualSystem?.pavilions?.manualPricesByCityIndex?.[pavilion?.cityIndex ?? 0]?.grade,
  );
  const pityEpicMax = manualSystem?.pavilions?.pity?.featuredEpicPityToGuarantee ?? 10;
  const pityLegendaryMax = manualSystem?.pavilions?.pity?.featuredLegendaryPityToGuarantee ?? 30;

  const selectedSlot = useMemo(() => {
    const direct = stock?.slots.find((slot) => slot.slotIndex === selectedSlotId);
    if (direct) return direct;
    return stock?.slots[0];
  }, [selectedSlotId, stock]);

  const selectedManualSlot = useMemo(() => {
    if (!stock || selectedManualSlotId == null) return null;
    return stock.slots.find((slot) => slot.slotIndex === selectedManualSlotId) ?? null;
  }, [selectedManualSlotId, stock]);

  const shelves = useMemo(() => {
    const grouped: Record<string, PavilionStockSlot[]> = {
      common: [],
      advanced: [],
      rare: [],
      featured: [],
    };
    (stock?.slots ?? []).forEach((slot) => {
      const shelf = slot.shelf === 'filler' ? 'common' : slot.shelf;
      grouped[shelf] = grouped[shelf] || [];
      grouped[shelf].push(slot);
    });
    return grouped;
  }, [stock]);

  const handleSelect = (
    slot: PavilionStockSlot,
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
  ) => {
    setSelectedSlotId(slot.slotIndex);
    setSelectedManualSlotId(slot.slotIndex);
    if (event.type === 'click') {
      (event.currentTarget as HTMLButtonElement)?.focus();
    }
  };

  const closeDetail = () => {
    setSelectedManualSlotId(null);
    setPurchaseResult(null);
    setPurchaseError(null);
  };
  const clearHover = () => setHovered(null);

  const handleRefresh = () => {
    if (!pavilionId) return;
    const timestamp = Date.now();
    const remainingMs = stock ? Math.max(0, stock.nextRefreshAt - timestamp) : 0;
    const ready = stock ? timestamp >= stock.nextRefreshAt : false;

    if (stock && !ready) {
      const remainingLabel = formatDurationHMS(remainingMs);
      addNotification('info', `Restock not ready — ${remainingLabel} remaining.`, 2500);
      return;
    }

    const result = refreshStock(pavilionId, timestamp);
    if (!result.ok) {
      let reasonMessage = `Refresh failed: ${result.reason ?? 'Unknown error'}`;
      switch (result.reason) {
        case 'not_ready':
          reasonMessage = 'Restock not ready yet.';
          break;
        case 'content_missing':
          reasonMessage = 'Pavilion data missing.';
          break;
        case 'stock_missing':
          reasonMessage = 'Stock missing — reopen pavilion.';
          break;
        case 'pavilion_missing':
          reasonMessage = 'No pavilion in this city.';
          break;
        case 'content_loading':
          reasonMessage = 'Content still loading.';
          break;
        default:
          break;
      }
      addNotification('warning', reasonMessage, 2500);
      return;
    }

    const updatedStock = useManualPavilionStore.getState().stockByPavilionId[pavilionId];
    let message = 'Pavilion restocked.';
    const latestHistory = updatedStock?.history?.[updatedStock.history.length - 1];
    if (latestHistory?.featured) {
      const featuredName =
        techniquesById[latestHistory.featured.techniqueId]?.name ?? latestHistory.featured.techniqueId;
      message = `Restocked — Featured: ${featuredName} (${rarityLabel(latestHistory.featured.rarity)})`;
    } else if (selectedManualSlotId != null) {
      message = 'Pavilion restocked — select a manual.';
    }

    if (selectedManualSlotId != null) {
      setSelectedManualSlotId(null);
      setSelectedSlotId(null);
    }
    setHovered(null);
    setRefreshFlash((prev) => prev + 1);
    addNotification('success', message, 2500);
  };

  const handlePurchase = (mode: 'buy' | 'buyAndStudy') => {
    if (!pavilionId || !selectedManualSlot) return;
    setPurchaseResult(null);
    setPurchaseError(null);
    const result = buyManual({ pavilionId, stockId: selectedManualSlot.slotIndex, mode });
    if (!result.ok) {
      const reason = result.reason || 'purchase_failed';
      setPurchaseError(reason);
      const friendly = formatPurchaseError(reason);
      addNotification('error', friendly ? `Purchase failed: ${friendly}` : 'Purchase failed.', 3000);
      setPurchaseResult(null);
      return;
    }

    let finalResult: ManualPurchaseResult & { studied?: boolean } = result;
    if (mode === 'buyAndStudy' && result.outcome === 'manualGranted') {
      if (result.manualInstanceId) {
        const studyResult = useManualSatchelStore.getState().startStudy(result.manualInstanceId);
        if (studyResult.ok) {
          finalResult = { ...result, studied: true };
          addNotification('success', 'Study started.', 2500);
        } else {
          addNotification(
            'info',
            `Purchased, but could not start study${studyResult.reason ? ` (${studyResult.reason}).` : '.'}`,
            3000,
          );
        }
      } else {
        addNotification('info', 'Purchased, but could not start study (missing manual instance).', 3000);
      }
    }

    setPurchaseError(null);
    setPurchaseResult(finalResult);
    if (finalResult.outcome === 'manualGranted') {
      const manualName =
        (selectedManualSlot ? techniquesById[selectedManualSlot.techniqueId]?.name : undefined) ??
        finalResult.manualName ??
        finalResult.techId ??
        'manual';
      addNotification('success', `Purchased "${manualName}".`, 2500);
    } else if (finalResult.outcome === 'duplicateConverted') {
      addNotification('info', `Duplicate converted (+${finalResult.fragmentsGained} fragments).`, 2500);
    }

    setJustPurchasedSlotId(selectedManualSlot.slotIndex);
    if (purchasePulseTimeoutRef.current) {
      window.clearTimeout(purchasePulseTimeoutRef.current);
    }
    purchasePulseTimeoutRef.current = window.setTimeout(() => setJustPurchasedSlotId(null), 700);
  };

  const handleUpgradeNow = (techId: string) => {
    setActiveTab('techniques');
    requestTechniqueFocus(techId, 'upgradeRank');
  };

  const renderShelfRow = (
    title: string,
    shelfKey: string,
    slots: PavilionStockSlot[],
    desiredCapacity: number,
    hint?: string,
  ) => {
    const desired = Math.max(desiredCapacity, slots.length);
    const placeholdersNeeded = Math.max(0, desired - slots.length);
    const spineEntries: Array<{ key: string; slot: PavilionStockSlot | null; technique?: TechniqueDef }> = [
      ...slots.map((slot) => ({
        key: `slot-${slot.slotIndex}`,
        slot,
        technique: techniquesById[slot.techniqueId],
      })),
      ...Array.from({ length: placeholdersNeeded }, (_, index) => ({
        key: `ph-${shelfKey}-${index}`,
        slot: null,
      })),
    ];

    return (
      <div className={`pavilionShelfRow pavilionShelfRow--${shelfKey}`}>
        <div className={'pavilionShelfRowHeader'}>
          <PaperCard variant="label" className={'pavilionShelfRowTitle'}>
            {title}
          </PaperCard>
          {hint && <div className={'pavilionShelfRowHint'}>{hint}</div>}
        </div>
        <PaperCard variant="tray" className={'pavilionShelfRowRail'}>
          <div className={'pavilionShelfRowSpines'} role="list">
            {spineEntries.map((entry) => (
              <BookSpineSlot
                key={entry.key}
                slot={entry.slot}
                technique={entry.technique}
                isSelected={entry.slot?.slotIndex === selectedSlot?.slotIndex}
                isJustPurchased={entry.slot?.slotIndex === justPurchasedSlotId}
                onSelect={(event) => entry.slot && handleSelect(entry.slot, event)}
                onHover={(slotIndex, rect) => setHovered({ slotIndex, rect })}
                onClearHover={clearHover}
              />
            ))}
          </div>
        </PaperCard>
      </div>
    );
  };

  const renderHistoryCollapsible = () => {
    if (!stock) return null;
    const entries = stock.history.slice(-3).reverse();
    return (
      <div className={'pavilionHistory'}>
        <div className={'pavilionHistoryHeader'}>
          <div className={'pavilionHistoryTitle'}>Recent refreshes</div>
          <button
            className={'pavilionHistoryToggle'}
            onClick={() => setHistoryOpen((prev) => !prev)}
            type="button"
          >
            {historyOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        {historyOpen && (
          <div className={'pavilionHistoryBody'}>
            {entries.length === 0 && <div className={'pavilionHistoryLine'}>No refreshes yet.</div>}
            {entries.map((entry, idx) => {
              const featuredName = entry.featured
                ? techniquesById[entry.featured.techniqueId]?.name ?? entry.featured.techniqueId
                : '—';
              const rareSummary = entry.rares
                ?.map((rare) => techniquesById[rare.techniqueId]?.name ?? rare.techniqueId)
                .join(', ');
              const timeLabel = new Date(entry.at).toLocaleTimeString();
              const agoMs = now - entry.at;
              const agoMinutes = Math.floor(agoMs / 60000);
              const relativeLabel = agoMinutes >= 1 ? `${agoMinutes}m ago` : 'just now';
              return (
                <div key={idx} className={'pavilionHistoryLine'}>
                  <div>
                    <div className={'pavilionHistoryTime'}>
                      {timeLabel} ({relativeLabel})
                    </div>
                    <div className={'pavilionHistoryEntry'}>
                      Featured: {featuredName} {entry.featured ? `(${rarityLabel(entry.featured.rarity)})` : ''}
                    </div>
                    {entry.rares && entry.rares.length > 0 && (
                      <div className={'pavilionHistoryEntry'}>Rares: {rareSummary}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderRefreshBarInline = () => {
    if (!stock) return null;
    const remaining = Math.max(0, stock.nextRefreshAt - now);
    const ready = now >= stock.nextRefreshAt;
    return (
      <div className={'pavilionRefreshBar pavilionRefreshBar--inline'}>
        <div className={'pavilionRefreshMeta'}>
          <div className={'pavilionRefreshLine'}>
            <span>Next refresh: {ready ? 'Ready' : formatDurationHMS(remaining)}</span>
            {ready && <span className="pavilionRefreshBadge">Ready</span>}
          </div>
          <div className={'pavilionPityLine'}>
            <span title="Featured shelf rolls improve over time. If you haven’t seen an Epic in Y rolls, the next roll is guaranteed Epic. Legendary has a separate counter.">
              Pity: {stock.pity.featuredEpic}/{pityEpicMax} → Epic guaranteed
            </span>
            <span>Legendary pity: {stock.pity.featuredLegendary}/{pityLegendaryMax}</span>
          </div>
        </div>
        <button
          className={`worldScreenModuleButton pavilionRefreshButton${ready ? ' pavilionRefreshButton--ready' : ''}`}
          onClick={handleRefresh}
          title={
            ready
              ? 'Refresh pavilion stock.'
              : `Restock not ready. ${formatDurationHMS(remaining)} remaining.`
          }
          type="button"
        >
          Refresh
        </button>
      </div>
    );
  };

  if (!pavilionId) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No pavilion in this city.</div>
          <div className={'worldScreenPlaceholderKey'}>manualPavilion</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Visit another city to access a manual pavilion.</div>
      </div>
    );
  }

  if (!isContentLoaded) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Loading content…</div>
          <div className={'worldScreenPlaceholderKey'}>{pavilionId}</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          {isContentLoading ? 'Loading manuals and pavilion data.' : 'Content not ready yet.'}
        </div>
      </div>
    );
  }

  if (!pavilion) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Pavilion data missing</div>
          <div className={'worldScreenPlaceholderKey'}>{pavilionId}</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Pavilion definition not found.</div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Loading pavilion stock…</div>
          <div className={'worldScreenPlaceholderKey'}>{pavilionId}</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Generating visible stock for this pavilion.</div>
      </div>
    );
  }

  const pavilionTitle = pavilion.id.replace(/_/g, ' ') || 'Manual Pavilion';
  const hoveredSlot = hovered ? stock.slots.find((slot) => slot.slotIndex === hovered.slotIndex) : undefined;
  const hoveredTechnique = hoveredSlot ? techniquesById[hoveredSlot.techniqueId] : undefined;
  const hoveredPath = getManualPathIcon(hoveredTechnique?.path).label;
  const hoveredType = getManualRoleIcon(hoveredTechnique?.role).label;
  const hoveredState = hoveredSlot ? resolveSpineState(hoveredSlot) : 'placeholder';
  const tooltipAnchorLeft = hovered ? hovered.rect.left + hovered.rect.width / 2 : 0;
  const windowWidth = typeof window === 'undefined' ? null : window.innerWidth;
  const maxTooltipLeft = windowWidth ? windowWidth - 12 : tooltipAnchorLeft;
  const computedTooltipLeft = Math.min(maxTooltipLeft, Math.max(12, tooltipAnchorLeft));
  const shouldFlipTooltip = hovered ? hovered.rect.top < 120 : false;
  const tooltipTop = hovered ? (shouldFlipTooltip ? hovered.rect.bottom + 10 : hovered.rect.top - 10) : 0;
  const tooltipTransform = shouldFlipTooltip ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
  const hoveredPriceLine = hoveredSlot
    ? hoveredSlot.notSold
      ? 'Not sold here'
      : hoveredSlot.sold
        ? 'Sold out (refresh to restock)'
        : hoveredSlot.sealed
          ? 'Sealed (grade locked)'
          : `Price: ${formatPrice(hoveredSlot.price) || 'Free'}`
    : '';

  const selectedTechnique = selectedManualSlot ? techniquesById[selectedManualSlot.techniqueId] : undefined;
  const manualDetailData: ManualDetailData | null = selectedManualSlot
    ? {
        slot: selectedManualSlot,
        technique: selectedTechnique,
      }
    : null;

  const canAfford = selectedManualSlot?.price ? canAffordCurrency(selectedManualSlot.price) : true;
  const purchaseDisabledReason = selectedManualSlot?.sold
    ? 'Already purchased'
    : selectedManualSlot?.notSold
      ? 'Not sold in this city'
      : selectedManualSlot?.sealed
        ? 'Sealed (higher grade required)'
        : !canAfford
          ? 'Not enough currency'
          : isPurchasing
            ? 'Purchase in progress'
            : undefined;
  const studyDisabledReason = purchaseDisabledReason
    ? purchaseDisabledReason
    : activeStudy
      ? 'Already studying a manual'
      : undefined;
  const errorMessage = formatPurchaseError(purchaseError || lastPurchaseError);

  const purchaseState: ManualPurchaseState = {
    errorMessage,
    purchaseDisabledReason,
    studyDisabledReason,
    purchaseResult: purchaseResult ?? undefined,
  };

  return (
    <div className={'manualPavilionPanel manualPavilionPanel--v2'}>
      <PaperCard variant="tray" className={'pavilionTopRibbon'}>
        <div className={'pavilionTopLeft'}>
          <div className={'pavilionTitle'}>{pavilionTitle}</div>
          <div className={'pavilionSubtitle'}>
            Grade sold: {gradeLabel(gradeSold as ManualGrade)} • Grade cap: {gradeLabel(gradeCap)}
          </div>
          <div className={'pavilionMicrocopyInline'}>
            Buy Manual → Study Manual → Equip Technique → Auto-used in combat
          </div>
        </div>
        <div className={'pavilionTopCenter'}>{renderRefreshBarInline()}</div>
        <div className={'pavilionTopRight'}>
          <button className={'worldScreenModuleButton pavilionSatchelButton'} onClick={openManualSatchel}>
            Satchel ({satchelCount})
          </button>
        </div>
      </PaperCard>
      <div className={`pavilionShelfWall${flashOn ? ' pavilionShelfWall--flash' : ''}`}>
        {renderShelfRow('Common Shelf', 'common', shelves.common, 14, 'Heaven/Earth/Martial manuals')}
        {renderShelfRow('Advanced Shelf', 'advanced', shelves.advanced, 12, 'Refined techniques')}
        {renderShelfRow('Rare Shelf', 'rare', shelves.rare, 10, 'Uncommon paths')}
        {renderShelfRow('Featured Shelf', 'featured', shelves.featured, 8, 'Limited highlights')}
      </div>
      <div className={'pavilionBottomStrip'}>{renderHistoryCollapsible()}</div>
      <ManualDetailModal
        open={Boolean(selectedManualSlot)}
        manual={manualDetailData}
        onClose={closeDetail}
        onPurchase={handlePurchase}
        onUpgradeNow={handleUpgradeNow}
        onOpenSatchel={openManualSatchel}
        purchaseState={purchaseState}
      />
      {hovered && hoveredSlot && (
        <div className="pavilionSpineTooltipLayer" aria-hidden="true">
          <div
            className="pavilionSpineTooltip"
            style={{ left: computedTooltipLeft, top: tooltipTop, transform: tooltipTransform }}
          >
            <div className="pavilionSpineTooltipTitle">{hoveredTechnique?.name ?? hoveredSlot.techniqueId}</div>
            <div className="pavilionSpineTooltipBadges">
              <span>{rarityLabel(hoveredSlot.rarity)}</span>
              <span>{gradeLabel(hoveredSlot.grade)}</span>
              <span>{hoveredPath}</span>
              <span>{hoveredType}</span>
            </div>
            <div className="pavilionSpineTooltipLine">{hoveredPriceLine}</div>
            {hoveredState !== 'available' && <div className="pavilionSpineTooltipLine">Status: {hoveredState}</div>}
            <div className="pavilionSpineTooltipMicro">Buy → Satchel → Study → Techniques</div>
          </div>
        </div>
      )}
    </div>
  );
}
