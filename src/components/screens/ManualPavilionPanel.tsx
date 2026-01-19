import { useEffect, useMemo, useState } from 'react';
import type { FocusEvent, MouseEvent } from 'react';
import './ManualPavilionPanel.scss';
import type { TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useManualPavilionStore } from '../../stores/manualPavilionStore';
import { useGameStore } from '../../stores/gameStore';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../features/manuals/pavilionStockTypes';
import { formatPrice } from '../../stores/contentStore';
import { formatDurationHMS } from '../../utils/timeFormat';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useUIStore } from '../../stores/uiStore';
import { ManualDetailModal } from '../modals/ManualDetailModal';

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

type SpineState = 'placeholder' | 'available' | 'sealed' | 'notSold' | 'sold';

function getRoleBadge(role?: string): { icon: string; short: string; label: string; key: string } {
  switch (role) {
    case 'offense':
      return { icon: '⚔', short: 'ATK', label: 'Offense', key: 'offense' };
    case 'defense':
      return { icon: '🛡', short: 'DEF', label: 'Defense', key: 'defense' };
    case 'utility':
      return { icon: '🧿', short: 'UTIL', label: 'Utility', key: 'utility' };
    default:
      return { icon: '◎', short: 'GEN', label: 'General', key: 'general' };
  }
}

function gradeAbbrev(grade: ManualGrade): string {
  switch (grade) {
    case 'earth':
      return 'E';
    case 'heaven':
      return 'H';
    case 'mystic':
      return 'Y';
    case 'mortal':
    default:
      return 'M';
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
  onSelect: () => void;
  onHover: (slotIndex: number, rect: DOMRect) => void;
  onClearHover: () => void;
}

function BookSpineSlot({ slot, technique, isSelected, onSelect, onHover, onClearHover }: BookSpineSlotProps) {
  const state = resolveSpineState(slot);
  const path = normalizePath(technique?.path);
  const roleBadge = getRoleBadge(technique?.role);
  const roleKey = roleBadge.key;

  if (!slot) {
    return (
      <div
        className={'pavilionSpine pavilionSpine--placeholder'}
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
      className={`pavilionSpine ${isSelected ? 'pavilionSpine--selected' : ''}`}
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
          onSelect();
        }
      }}
      title={titleParts.join(' • ')}
    >
      <div className="pavilionSpineTop">
        <span className="pavilionSpineGradeMark">{gradeAbbrev(slot.grade)}</span>
      </div>
      <div className="pavilionSpineName">{technique?.name ?? slot.techniqueId}</div>
      <div className="pavilionSpineBottom">
        <span className="pavilionSpineRoleIcon">{roleBadge.icon}</span>
        <span className="pavilionSpineRoleText">{roleBadge.short}</span>
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
  const realmIndex = useGameStore((state) => state.realm.index);
  const openManualSatchel = useUIStore((state) => state.openManualSatchel);
  const satchelCount = useManualSatchelStore((state) => state.manuals.length + (state.activeStudy ? 1 : 0));

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedManualSlotId, setSelectedManualSlotId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [hovered, setHovered] = useState<{ slotIndex: number; rect: DOMRect } | null>(null);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (selectedManualSlotId == null) return;
    const onKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setSelectedManualSlotId(null);
    };
    window.addEventListener('keydown', onKeyDownCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDownCapture, { capture: true } as EventListenerOptions);
    };
  }, [selectedManualSlotId]);

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

  const handleSelect = (slot: PavilionStockSlot) => {
    setSelectedSlotId(slot.slotIndex);
    setSelectedManualSlotId(slot.slotIndex);
  };

  const closeDetail = () => setSelectedManualSlotId(null);
  const clearHover = () => setHovered(null);

  const handleRefresh = () => {
    if (!pavilionId) return;
    refreshStock(pavilionId, Date.now());
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
          <div className={'pavilionShelfRowTitle'}>{title}</div>
          {hint && <div className={'pavilionShelfRowHint'}>{hint}</div>}
        </div>
        <div className={'pavilionShelfRowRail'}>
          <div className={'pavilionShelfRowSpines'} role="list">
            {spineEntries.map((entry) => (
              <BookSpineSlot
                key={entry.key}
                slot={entry.slot}
                technique={entry.technique}
                isSelected={entry.slot?.slotIndex === selectedSlot?.slotIndex}
                onSelect={() => entry.slot && handleSelect(entry.slot)}
                onHover={(slotIndex, rect) => setHovered({ slotIndex, rect })}
                onClearHover={clearHover}
              />
            ))}
          </div>
        </div>
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

  const pavilionTitle = pavilion.id.replace(/_/g, ' ') || 'Manual Pavilion';
  const hoveredSlot = hovered ? stock.slots.find((slot) => slot.slotIndex === hovered.slotIndex) : undefined;
  const hoveredTechnique = hoveredSlot ? techniquesById[hoveredSlot.techniqueId] : undefined;
  const hoveredRole = getRoleBadge(hoveredTechnique?.role);
  const hoveredPath = hoveredTechnique?.path ? hoveredTechnique.path.toString() : 'Unknown';
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

  return (
    <div className={'manualPavilionPanel manualPavilionPanel--v2'}>
      <div className={'pavilionTopRibbon'}>
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
      </div>
      <div className={'pavilionShelfWall'}>
        {renderShelfRow('Common Shelf', 'common', shelves.common, 14, 'Heaven/Earth/Martial manuals')}
        {renderShelfRow('Advanced Shelf', 'advanced', shelves.advanced, 12, 'Refined techniques')}
        {renderShelfRow('Rare Shelf', 'rare', shelves.rare, 10, 'Uncommon paths')}
        {renderShelfRow('Featured Shelf', 'featured', shelves.featured, 8, 'Limited highlights')}
      </div>
      <div className={'pavilionBottomStrip'}>{renderHistoryCollapsible()}</div>
      {selectedManualSlot && (
        <ManualDetailModal
          title={techniquesById[selectedManualSlot.techniqueId]?.name ?? selectedManualSlot.techniqueId}
          subtitle={selectedManualSlot.techniqueId}
          onClose={closeDetail}
        />
      )}
      {hovered && hoveredSlot && (
        <div className="pavilionSpineTooltipLayer" aria-hidden="true">
          <div
            className="pavilionSpineTooltip"
            style={{ left: computedTooltipLeft, top: tooltipTop, transform: tooltipTransform }}
          >
            <div className="pavilionSpineTooltipTitle">
              {hoveredTechnique?.name ?? hoveredSlot.techniqueId}
            </div>
            <div className="pavilionSpineTooltipBadges">
              <span>{rarityLabel(hoveredSlot.rarity)}</span>
              <span>{gradeLabel(hoveredSlot.grade)}</span>
              <span>{hoveredPath}</span>
              <span>{hoveredRole.label}</span>
              <span>{hoveredTechnique?.type ?? 'unknown'}</span>
            </div>
            <div className="pavilionSpineTooltipLine">{hoveredPriceLine}</div>
            {hoveredState !== 'available' && (
              <div className="pavilionSpineTooltipLine">Status: {hoveredState}</div>
            )}
            <div className="pavilionSpineTooltipMicro">Buy → Satchel → Study → Techniques</div>
          </div>
        </div>
      )}
    </div>
  );
}
