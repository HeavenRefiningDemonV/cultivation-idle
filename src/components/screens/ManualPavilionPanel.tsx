import { useEffect, useMemo, useState } from 'react';
import './ManualPavilionPanel.scss';
import type { PathId, TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useManualPavilionStore } from '../../stores/manualPavilionStore';
import { useGameStore } from '../../stores/gameStore';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../features/manuals/pavilionStockTypes';
import { formatPrice } from '../../stores/contentStore';

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

function normalizeGradeValue(value?: string | null): ManualGrade {
  if (value && (gradeOrder as string[]).includes(value)) {
    return value as ManualGrade;
  }
  return 'mortal';
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
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

export function ManualPavilionPanel({ pavilionId }: ManualPavilionPanelProps) {
  const pavilion = useContentStore((state) => (pavilionId ? state.maps.pavilionsById[pavilionId] : undefined));
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const manualSystem = useContentStore((state) => state.raw?.economy?.manualSystem as any);
  const ensureStock = useManualPavilionStore((state) => state.ensureStock);
  const refreshStock = useManualPavilionStore((state) => state.refreshStock);
  const stock = useManualPavilionStore((state) => (pavilionId ? state.stockByPavilionId[pavilionId] : null));
  const realmIndex = useGameStore((state) => state.realm.index);

  const [filters, setFilters] = useState<FiltersState>({
    type: 'all',
    path: 'all',
    role: 'all',
    grade: 'all',
    rarity: 'all',
  });
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (pavilionId) {
      ensureStock(pavilionId);
    }
  }, [ensureStock, pavilionId]);

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
  const gradeSold = normalizeGradeValue(pavilion?.gradeSold);
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
    refreshStock(pavilionId);
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
    return (
      <div
        key={slot.slotIndex}
        className={`pavilionCard ${isSelected ? 'pavilionCard--selected' : ''} ${slot.sealed ? 'pavilionCard--sealed' : ''}`}
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
        </div>
        <div className={'pavilionDetailActions'}>
          <button className={'worldScreenModuleButton'} disabled title="Purchasing is implemented in P2">
            Buy Manual
          </button>
          <button className={'worldScreenModuleButton'} disabled title="Study flow is implemented in P3">
            Buy &amp; Study Now
          </button>
        </div>
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
    const ready = remaining === 0;
    return (
      <div className={'pavilionRefreshBar'}>
        <div>
          <div className={'pavilionRefreshLine'}>Next refresh in: {formatDuration(remaining)}</div>
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
          {renderRefreshBar()}
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
