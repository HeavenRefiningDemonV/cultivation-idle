import { useEffect, useMemo, useState } from 'react';
import './ManualPavilionPanel.scss';
import type { TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useManualPavilionStore } from '../../stores/manualPavilionStore';
import { useGameStore } from '../../stores/gameStore';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../features/manuals/pavilionStockTypes';
import { formatPrice } from '../../stores/contentStore';
import { formatDurationHMS } from '../../utils/timeFormat';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useUIStore } from '../../stores/uiStore';

interface ManualPavilionPanelProps {
  pavilionId: string | null;
}

const gradeOrder: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];

function normalizeGradeValue(value?: string | null): ManualGrade {
  if (value && (gradeOrder as string[]).includes(value)) {
    return value as ManualGrade;
  }
  return 'mortal';
}

function getTechniqueMeta(techniqueId: string, techniquesById: Record<string, TechniqueDef | undefined>) {
  return techniquesById[techniqueId];
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

export function ManualPavilionPanel({ pavilionId }: ManualPavilionPanelProps) {
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const isContentLoading = useContentStore((state) => state.isLoading);
  const pavilion = useContentStore((state) => (pavilionId ? state.maps.pavilionsById[pavilionId] : undefined));
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const manualSystem = useContentStore((state) => state.raw?.economy?.manualSystem as any);
  const ensureStock = useManualPavilionStore((state) => state.ensureStock);
  const refreshStock = useManualPavilionStore((state) => state.refreshStock);
  const stock = useManualPavilionStore((state) => (pavilionId ? state.stockByPavilionId[pavilionId] : null));
  const realmIndex = useGameStore((state) => state.realm.index);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));
  const currencies = useInventoryStore((state) => state.currencies);

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

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

  const selectedSlot = useMemo(() => {
    if (!stock || stock.slots.length === 0) return null;
    if (selectedSlotId == null) return stock.slots[0] ?? null;
    return stock.slots.find((slot) => slot.slotIndex === selectedSlotId) ?? stock.slots[0] ?? null;
  }, [selectedSlotId, stock]);

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

  const handleSelect = (slot: PavilionStockSlot) => {
    setSelectedSlotId(slot.slotIndex);
  };

  const handleRefresh = () => {
    if (!pavilionId) return;
    refreshStock(pavilionId, Date.now());
  };

  const renderShelfItemCard = (slot: PavilionStockSlot) => {
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

  const renderShelfRow = (title: string, slots: PavilionStockSlot[]) => {
    if (!slots || slots.length === 0) return null;
    return (
      <div className={'pavilionShelfRow'}>
        <div className={'pavilionShelfRowHeader'}>
          <div className={'pavilionShelfRowTitle'}>{title}</div>
          <div className={'pavilionShelfRowCount'}>{slots.length} manuals</div>
        </div>
        <div className={'pavilionShelfRowContent'}>{slots.map((slot) => renderShelfItemCard(slot))}</div>
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
    const refreshLabel = ready ? 'Ready' : `Restock in: ${formatDurationHMS(remaining)}`;
    return (
      <div className={'pavilionRefreshBar pavilionRefreshBar--inline'}>
        <div className={'pavilionRefreshMeta'}>
          <div className={'pavilionRefreshLine'}>{refreshLabel}</div>
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

  const renderCurrencyChips = () => {
    const entries = [
      { label: 'Gold', value: currencies.gold },
      { label: 'Spirit', value: currencies.spiritStones },
      { label: 'Merit', value: currencies.merit },
    ];
    return (
      <div className={'pavilionCurrencyChips'}>
        {entries.map((entry) => (
          <div key={entry.label} className={'pavilionCurrencyChip'}>
            <span className={'pavilionCurrencyLabel'}>{entry.label}</span>
            <span className={'pavilionCurrencyValue'}>{entry.value}</span>
          </div>
        ))}
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

  return (
    <div className={'manualPavilionPanel manualPavilionPanel--v2'}>
      <div className={'pavilionTopRibbon'}>
        <div className={'pavilionTopLeft'}>
          <div className={'pavilionTitle'}>{pavilionTitle}</div>
          <div className={'pavilionSubtitle'}>
            Grade sold: {gradeLabel(gradeSold as ManualGrade)} • Grade cap: {gradeLabel(gradeCap)}
          </div>
          <div className={'pavilionLoopHint'}>Buy → Satchel → Study → Techniques</div>
        </div>
        <div className={'pavilionTopCenter'}>{renderRefreshBarInline()}</div>
        <div className={'pavilionTopRight'}>
          <div className={'pavilionCurrencyStrip'}>{renderCurrencyChips()}</div>
          <button className={'worldScreenModuleButton pavilionSatchelButton'} onClick={openManualSatchel}>
            Satchel ({satchelCount})
          </button>
        </div>
      </div>
      <div className={'pavilionShelfWall'}>
        {renderShelfRow('Common Shelf', shelves.common)}
        {renderShelfRow('Advanced Shelf', shelves.advanced)}
        {renderShelfRow('Rare Shelf', shelves.rare)}
        {renderShelfRow('Featured Shelf', shelves.featured)}
      </div>
      <div className={'pavilionBottomStrip'}>{renderHistoryCollapsible()}</div>
      {/* Detail modal will be implemented in Part 2 */}
    </div>
  );
}
