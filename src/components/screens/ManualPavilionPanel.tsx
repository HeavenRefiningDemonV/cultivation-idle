import { useEffect, useMemo, useState } from 'react';
import './ManualPavilionPanel.scss';
import type { PathId, TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useManualPavilionStore } from '../../stores/manualPavilionStore';
import { useGameStore } from '../../stores/gameStore';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../features/manuals/pavilionStockTypes';
import { formatPrice } from '../../stores/contentStore';
import { formatDurationHMS } from '../../utils/timeFormat';
import { useInventoryStore } from '../../stores/inventoryStore';
import type { ManualPurchaseResult } from '../../stores/manualPavilionStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useUIStore } from '../../stores/uiStore';

interface ManualPavilionPanelProps {
  pavilionId: string | null;
}

type FilterValue<T> = T | 'all';

interface FiltersState {
  type: FilterValue<TechniqueDef['type']>;
  path: FilterValue<PathId>;
  role: FilterValue<string>;
  grade: FilterValue<ManualGrade>;
  rarity: FilterValue<ManualRarity>;
}

const gradeOrder: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const rarityOrder: ManualRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const purchaseErrorCopy: Record<string, string> = {
  insufficient_funds: 'Not enough currency for this purchase.',
  already_sold: 'This manual has already been purchased.',
  not_sold_here: 'This manual is not sold in this pavilion.',
  sealed: 'This manual is sealed behind a higher grade.',
  invalid_cost: 'Invalid price for this manual.',
  stock_missing: 'Pavilion stock missing. Try refreshing.',
  slot_missing: 'Manual slot missing. Try refreshing.',
  purchase_in_progress: 'Another purchase is already in progress.',
  spend_failed: 'Unable to spend currency for this purchase.',
  content_loading: 'Content is still loading.',
};

function normalizeGradeValue(value?: string | null): ManualGrade {
  if (value && (gradeOrder as string[]).includes(value)) {
    return value as ManualGrade;
  }
  return 'mortal';
}

function getTechniqueMeta(techniqueId: string, techniquesById: Record<string, TechniqueDef | undefined>) {
  return techniquesById[techniqueId];
}

function synthesizeCombatSummary(technique?: TechniqueDef) {
  if (!technique) return 'No data available yet. Auto-used in combat when equipped.';
  const parts: string[] = [];
  const typeLabel = technique.type ? technique.type.toUpperCase() : 'UNKNOWN';
  const role = technique.role ? `${technique.role} role` : 'general role';
  parts.push(`An ${typeLabel} ${role} technique.`);
  parts.push('Auto-used in combat when equipped.');
  if (technique.tags && technique.tags.length > 0) {
    parts.push(`Tags: ${technique.tags.join(', ')}`);
  }
  if (technique.cooldownSec != null) {
    parts.push(`Cooldown: ${technique.cooldownSec}s.`);
  }
  if (technique.resourceModel && technique.resourceCost != null) {
    parts.push(`Resource: ${technique.resourceCost} ${technique.resourceModel}.`);
  }
  return parts.join(' ');
}

function gradeIsHigher(a: ManualGrade, b: ManualGrade) {
  return gradeOrder.indexOf(a) > gradeOrder.indexOf(b);
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

function isSlotMatchingFilters(
  slot: PavilionStockSlot,
  technique: TechniqueDef | undefined,
  filters: FiltersState,
) {
  if (filters.type !== 'all' && technique?.type !== filters.type) return false;
  if (filters.path !== 'all' && technique?.path !== filters.path) return false;
  if (filters.role !== 'all' && technique?.role !== filters.role) return false;
  if (filters.grade !== 'all' && slot.grade !== filters.grade) return false;
  if (filters.rarity !== 'all' && slot.rarity !== filters.rarity) return false;
  return true;
}

function formatPurchaseError(reason?: string | null) {
  if (!reason) return null;
  return purchaseErrorCopy[reason] ?? reason;
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
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));

  const [filters, setFilters] = useState<FiltersState>({
    type: 'all',
    path: 'all',
    role: 'all',
    grade: 'all',
    rarity: 'all',
  });
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [purchaseResult, setPurchaseResult] = useState<(ManualPurchaseResult & { studied?: boolean }) | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

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

  const gradeCap = deriveGradeCap(realmIndex);
  const gradeSold = normalizeGradeValue(
    pavilion?.gradeSold ?? manualSystem?.pavilions?.manualPricesByCityIndex?.[pavilion?.cityIndex ?? 0]?.grade,
  );
  const pityEpicMax = manualSystem?.pavilions?.pity?.featuredEpicPityToGuarantee ?? 10;
  const pityLegendaryMax = manualSystem?.pavilions?.pity?.featuredLegendaryPityToGuarantee ?? 30;

  const filteredSlots = useMemo(() => {
    if (!stock) return [] as PavilionStockSlot[];
    return stock.slots.filter((slot) => isSlotMatchingFilters(slot, techniquesById[slot.techniqueId], filters));
  }, [filters, stock, techniquesById]);

  const selectedSlot = useMemo(() => {
    const direct = stock?.slots.find((slot) => slot.slotIndex === selectedSlotId);
    if (direct) return direct;
    return filteredSlots[0];
  }, [filteredSlots, selectedSlotId, stock]);

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    Object.values(techniquesById).forEach((tech) => {
      if (tech?.role) roles.add(tech.role);
    });
    return Array.from(roles).sort();
  }, [techniquesById]);

  const shelves = useMemo(() => {
    const grouped: Record<string, PavilionStockSlot[]> = {
      common: [],
      advanced: [],
      rare: [],
      featured: [],
    };
    (filteredSlots.length ? filteredSlots : stock?.slots ?? []).forEach((slot) => {
      const shelf = slot.shelf === 'filler' ? 'common' : slot.shelf;
      grouped[shelf] = grouped[shelf] || [];
      grouped[shelf].push(slot);
    });
    return grouped;
  }, [filteredSlots, stock]);

  const handleSelect = (slot: PavilionStockSlot) => setSelectedSlotId(slot.slotIndex);

  const handleRefresh = () => {
    if (!pavilionId) return;
    refreshStock(pavilionId, Date.now());
  };

  const handlePurchase = (mode: 'buy' | 'buyAndStudy') => {
    if (!pavilionId || !selectedSlot) return;
    const result = buyManual({ pavilionId, stockId: selectedSlot.slotIndex, mode });
    if (!result.ok) {
      setPurchaseError(result.reason || 'purchase_failed');
      setPurchaseResult(null);
      return;
    }

    let finalResult: ManualPurchaseResult & { studied?: boolean } = result;
    if (mode === 'buyAndStudy' && result.outcome === 'manualGranted') {
      const satchel = useManualSatchelStore.getState();
      const manualId =
        result.manualInstanceId ||
        satchel.manuals.find(
          (manual) =>
            manual.techId === result.techId && manual.grade === result.grade && manual.rarity === result.rarity,
        )?.id;
      if (manualId) {
        const studyResult = satchel.startStudy(manualId);
        if (studyResult.ok) {
          finalResult = { ...result, studied: true };
        }
      }
    }

    setPurchaseError(null);
    setPurchaseResult(finalResult);
  };

  const handleUpgradeNow = (techId: string) => {
    setActiveTab('techniques');
    requestTechniqueFocus(techId, 'upgradeRank');
  };

  const renderFilters = () => {
    const gradeOptions: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
    const typeOptions: Array<TechniqueDef['type']> = ['active', 'passive', 'ultimate'];
    const pathOptions: PathId[] = ['heaven', 'earth', 'martial'];

    const gradeDisabled = (grade: ManualGrade) => gradeIsHigher(grade, gradeSold as ManualGrade) || gradeIsHigher(grade, gradeCap);

    return (
      <div className={'pavilionFilters'}>
        <div className={'pavilionMicrocopy'}>Buy Manual → Study Manual → Equip Technique → Auto-used in combat</div>
        <div className={'pavilionFilterGroup'}>
          <label>
            Type
            <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as FiltersState['type'] }))}>
              <option value="all">All</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Path
            <select value={filters.path} onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value as FiltersState['path'] }))}>
              <option value="all">All</option>
              {pathOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value as FiltersState['role'] }))}>
              <option value="all">All</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Grade
            <select
              value={filters.grade}
              onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value as FiltersState['grade'] }))}
            >
              <option value="all">All</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade} disabled={gradeDisabled(grade)}>
                  {gradeLabel(grade)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rarity
            <select
              value={filters.rarity}
              onChange={(e) => setFilters((prev) => ({ ...prev, rarity: e.target.value as FiltersState['rarity'] }))}
            >
              <option value="all">All</option>
              {rarityOrder.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarityLabel(rarity)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  const renderCard = (slot: PavilionStockSlot) => {
    const technique = getTechniqueMeta(slot.techniqueId, techniquesById);
    const isSelected = selectedSlot?.slotIndex === slot.slotIndex;
    const sold = Boolean(slot.sold);
    return (
      <div
        key={slot.slotIndex}
        className={`pavilionCard ${isSelected ? 'pavilionCard--selected' : ''} ${slot.sealed ? 'pavilionCard--sealed' : ''} ${
          sold ? 'pavilionCard--sold' : ''
        }`}
        onClick={() => handleSelect(slot)}
      >
        <div className={'pavilionCardHeader'}>
          <div className={'pavilionCardTitle'}>{technique?.name ?? slot.techniqueId}</div>
          <div className={'pavilionCardMeta'}>
            <span className={`pavilionBadge rarity-${slot.rarity}`}>{rarityLabel(slot.rarity)}</span>
            <span className={'pavilionBadge'}>{gradeLabel(slot.grade)}</span>
            <span className={'pavilionBadge typeBadge'}>{technique?.type ?? 'unknown'}</span>
          </div>
        </div>
        <div className={'pavilionCardBody'}>
          <div className={'pavilionCardLine'}>Path: {(technique?.path ?? 'Unknown').toString()}</div>
          <div className={'pavilionCardLine'}>Role: {technique?.role ?? '—'}</div>
          {slot.notSold ? (
            <div className={'pavilionCardLine pavilionCardNotSold'}>Not sold here</div>
          ) : (
            <div className={'pavilionCardLine'}>Price: {formatPrice(slot.price) || 'Free'}</div>
          )}
          {sold && <div className={'pavilionCardLine pavilionCardSold'}>Sold out</div>}
          {slot.sealed && <div className={'pavilionCardLine pavilionCardNotSold'}>Sealed (grade locked)</div>}
        </div>
      </div>
    );
  };

  const renderShelf = (title: string, slots: PavilionStockSlot[]) => {
    if (!slots || slots.length === 0) return null;
    return (
      <div className={'pavilionShelf'}>
        <div className={'pavilionShelfHeader'}>{title}</div>
        <div className={'pavilionShelfGrid'}>{slots.map((slot) => renderCard(slot))}</div>
      </div>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedSlot) {
      return <div className={'pavilionDetailEmpty'}>Select a manual to see details.</div>;
    }
    const technique = getTechniqueMeta(selectedSlot.techniqueId, techniquesById);
    const costLabel = formatPrice(selectedSlot.price) || 'Free';
    const canAfford = selectedSlot.price ? canAffordCurrency(selectedSlot.price) : true;
    const purchaseDisabledReason = selectedSlot.sold
      ? 'Already purchased'
      : selectedSlot.notSold
        ? 'Not sold here'
        : selectedSlot.sealed
          ? 'Sealed (grade locked)'
          : !canAfford
            ? 'Not enough currency'
            : isPurchasing
              ? 'Purchase in progress'
              : undefined;
    const studyDisabledReason =
      purchaseDisabledReason ?? 'Buy & Study Now performs an instant study in this milestone.';
    const errorMessage = formatPurchaseError(purchaseError || lastPurchaseError);
    return (
      <div className={'pavilionDetail'}>
        <div className={'pavilionDetailHeader'}>
          <div>
            <div className={'pavilionDetailName'}>{technique?.name ?? selectedSlot.techniqueId}</div>
            <div className={'pavilionDetailId'}>{selectedSlot.techniqueId}</div>
          </div>
          <div className={'pavilionDetailBadges'}>
            <span className={`pavilionBadge rarity-${selectedSlot.rarity}`}>{rarityLabel(selectedSlot.rarity)}</span>
            <span className={'pavilionBadge'}>{gradeLabel(selectedSlot.grade)}</span>
          </div>
        </div>
        <div className={'pavilionDetailBody'}>
          <div className={'pavilionDetailLine'}>{synthesizeCombatSummary(technique)}</div>
          {technique?.cooldownSec != null && (
            <div className={'pavilionDetailLine'}>Cooldown: {technique.cooldownSec}s</div>
          )}
          {technique?.resourceModel && technique.resourceCost != null && (
            <div className={'pavilionDetailLine'}>
              Resource Cost: {technique.resourceCost} {technique.resourceModel}
            </div>
          )}
          <div className={'pavilionDetailLine'}>Tags: {technique?.tags?.join(', ') || 'None'}</div>
          <div className={'pavilionDetailLine pavilionDetailPlaceholder'}>Traits appear after studying.</div>
          {selectedSlot.notSold && (
            <div className={'pavilionDetailLine pavilionCardNotSold'}>Not sold here in this city tier.</div>
          )}
          {selectedSlot.sold && <div className={'pavilionDetailLine pavilionCardSold'}>Sold out.</div>}
          <div className={'pavilionDetailLine'}>Price: {costLabel}</div>
        </div>
        <div className={'pavilionDetailActions'}>
          <button
            className={'worldScreenModuleButton'}
            disabled={Boolean(purchaseDisabledReason)}
            title={purchaseDisabledReason}
            onClick={() => handlePurchase('buy')}
          >
            Buy Manual
          </button>
          <button
            className={'worldScreenModuleButton'}
            disabled={Boolean(studyDisabledReason)}
            title={studyDisabledReason}
            onClick={() => handlePurchase('buyAndStudy')}
          >
            Buy &amp; Study Now
          </button>
        </div>
        {errorMessage && <div className={'pavilionPurchaseError'}>Purchase failed: {errorMessage}</div>}
        {renderPurchaseResult()}
      </div>
    );
  };

  const renderPurchaseResult = () => {
    if (!purchaseResult) return null;
    if (!purchaseResult.ok) {
      return (
        <div className={'pavilionPurchaseResult pavilionPurchaseResult--error'}>
          Purchase failed: {purchaseResult.reason}
        </div>
      );
    }

    const costText = formatPrice(purchaseResult.cost) || 'Free';

    if (purchaseResult.outcome === 'manualGranted') {
      return (
        <div className={'pavilionPurchaseResult'}>
          <div className={'pavilionResultTitle'}>Manual Purchased</div>
          <div>
            Added to Manual Satchel
            {typeof purchaseResult.satchelCount === 'number'
              ? ` (${purchaseResult.satchelCount} owned in this grade/rarity).`
              : '.'}
          </div>
          {purchaseResult.studied && <div>Technique Learned (studied instantly).</div>}
          <div>
            {purchaseResult.manualName} • {gradeLabel(purchaseResult.grade)} • {rarityLabel(purchaseResult.rarity)}
          </div>
          <div>Cost: {costText}</div>
        </div>
      );
    }

    const progressLine = purchaseResult.nextRankCostFragments
      ? `Progress: ${purchaseResult.fragmentsAfter}/${purchaseResult.nextRankCostFragments} toward Rank ${purchaseResult.nextRank}`
      : 'Rank cap reached for current grade.';

    return (
      <div className={'pavilionPurchaseResult pavilionPurchaseResult--duplicate'}>
        <div className={'pavilionResultTitle'}>Duplicate Manual → Converted</div>
        <div>
          +{purchaseResult.fragmentsGained} Technique Fragments ({rarityLabel(purchaseResult.rarity)})
        </div>
        <div>{progressLine}</div>
        <button className={'worldScreenModuleButton'} onClick={() => handleUpgradeNow(purchaseResult.techId)}>
          Upgrade now
        </button>
      </div>
    );
  };

  const renderHistory = () => {
    if (!stock) return null;
    const entries = stock.history.slice(-3).reverse();
    return (
      <div className={'pavilionHistory'}>
        <div className={'pavilionHistoryTitle'}>Recent refreshes</div>
        {entries.length === 0 && <div className={'pavilionHistoryLine'}>No refreshes yet.</div>}
        {entries.map((entry, idx) => {
          const featuredName = entry.featured
            ? techniquesById[entry.featured.techniqueId]?.name ?? entry.featured.techniqueId
            : '—';
          const rareSummary = entry.rares?.map((rare) => techniquesById[rare.techniqueId]?.name ?? rare.techniqueId).join(', ');
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
    );
  };

  const renderRefreshBar = () => {
    if (!stock) return null;
    const remaining = Math.max(0, stock.nextRefreshAt - now);
    const ready = now >= stock.nextRefreshAt;
    return (
      <div className={'pavilionRefreshBar'}>
        <div>
          <div className={'pavilionRefreshLine'}>Next refresh in: {formatDurationHMS(remaining)}</div>
          <div className={'pavilionPityLine'}>
            <span title="Featured shelf rolls improve over time. If you haven’t seen an Epic in Y rolls, the next roll is guaranteed Epic. Legendary has a separate counter.">
              Pity: {stock.pity.featuredEpic}/{pityEpicMax} → Epic guaranteed
            </span>
            <span>
              Legendary pity: {stock.pity.featuredLegendary}/{pityLegendaryMax}
            </span>
          </div>
        </div>
        <button className={'worldScreenModuleButton'} onClick={handleRefresh} disabled={!ready}>
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

  return (
    <div className={'manualPavilionPanel'}>
      <div className={'pavilionLeft'}>{renderFilters()}</div>
      <div className={'pavilionCenter'}>
        <div className={'pavilionHeader'}>
          <div>
            <div className={'pavilionTitle'}>{pavilion.id.replace(/_/g, ' ') || 'Manual Pavilion'}</div>
            <div className={'pavilionSubtitle'}>
              Grade sold: {gradeLabel(gradeSold as ManualGrade)} • Grade cap: {gradeLabel(gradeCap)}
            </div>
          </div>
          <div className={'pavilionHeaderActions'}>
            <button className={'worldScreenModuleButton'} onClick={openManualSatchel}>
              Manual Satchel ({satchelCount})
            </button>
            {renderRefreshBar()}
          </div>
        </div>
        <div className={'pavilionShelves'}>
          {renderShelf('Common Shelf', shelves.common)}
          {renderShelf('Advanced Shelf', shelves.advanced)}
          {renderShelf('Rare Shelf', shelves.rare)}
          {renderShelf('Featured Shelf', shelves.featured)}
        </div>
        {renderHistory()}
      </div>
      <div className={'pavilionRight'}>{renderDetailPanel()}</div>
    </div>
  );
}
