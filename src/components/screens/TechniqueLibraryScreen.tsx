import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { REALMS } from '../../constants';
import { useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import {
  masteryLevelFromXp,
  masteryMultiplier,
  normalizeGrade,
  normalizeRarity,
  rankMultiplier,
  useTechCollectionStore,
} from '../../stores/techCollectionStore';
import type { CastingPolicy, SlotType } from '../../stores/techniqueStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useCombatStore } from '../../stores/combatStore';
import { useUIStore } from '../../stores/uiStore';
import { TechniqueDetailModal } from '../modals/TechniqueDetailModal';
import { GameEvents } from '../../services/events/GameEvents';
import { getPathIcon, getTierIcon, getTypeIcon, resolveTechniqueType } from '../../features/manuals/manualIconMap';
import { TechniqueSpine } from '../techniques/TechniqueSpine';
import './TechniqueLibraryScreen.scss';

type InlineMessage = { type: 'error' | 'info' | 'success'; text: string } | null;

type SlotSelection = { type: SlotType; index: number };

type SortKey = 'power' | 'recent' | 'used' | 'rarity';
type TypeFilter = 'all' | 'active' | 'passive' | 'ultimate';
type GradeFilter = 'all' | 'mortal' | 'earth' | 'heaven' | 'mystic';

type OwnedTechniqueView = {
  id: string;
  name: string;
  def?: ReturnType<typeof useContentStore.getState>['maps']['techniquesById'][string];
  typeLabel: 'Active' | 'Passive' | 'Ultimate';
  path?: string;
  role?: string;
  rarity: string;
  grade: string;
  rank: number;
  masteryXp: number;
  masteryLevel: number;
  masteryPct: number;
  unlockedAt: number;
  lastCastAt: number;
  favorite: boolean;
  powerScore: number;
};

type EquipmentProofRow = {
  slotType: SlotType;
  slotIndex: number;
  slotLabel: string;
  techId: string;
  name: string;
  def?: ReturnType<typeof useContentStore.getState>['maps']['techniquesById'][string];
  lastCastAt: number | null;
  effectiveCooldownSec: number | null;
  castsPerHour: number | null;
  masteryPerHour: number | null;
  icon?: string | null;
};

const rarityWeight: Record<string, number> = {
  common: 1,
  uncommon: 1.05,
  rare: 1.1,
  epic: 1.2,
  legendary: 1.35,
};

const gradeWeight: Record<string, number> = {
  mortal: 1,
  earth: 1.05,
  heaven: 1.1,
  mystic: 1.2,
};

const castingPolicyLabels: Record<CastingPolicy, string> = {
  aggressive: 'Aggressive',
  balanced: 'Balanced',
  defensive: 'Defensive',
};

const castingPolicyHelp: Record<CastingPolicy, string> = {
  aggressive: 'Prioritize damage; cast on cooldown.',
  balanced: 'Conserve resources; prefer debuffs.',
  defensive: 'Prioritize shields/heals; burst only when safe.',
};

const techniqueType = (technique: { type?: string; tags?: string[] } | undefined): SlotType => {
  if (!technique) return 'active';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  return 'active';
};

const slotLabel = (slot: SlotSelection) => {
  if (slot.type === 'ultimate') return 'Ultimate';
  return `${slot.type === 'active' ? 'Active' : 'Passive'} ${slot.index + 1}`;
};

const typeIcon = (type: SlotType) => {
  if (type === 'ultimate') return '☄';
  if (type === 'passive') return '⛩';
  return '⚔';
};

const rarityLabel = (value?: string) => {
  const safe = value ?? 'common';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};
const gradeLabel = (value?: string) => {
  const safe = value ?? 'mortal';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};

const gradeOrder: string[] = ['mortal', 'earth', 'heaven', 'mystic'];
const rarityOrder: string[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const castingPolicies: CastingPolicy[] = ['aggressive', 'balanced', 'defensive'];

const formatRankLabel = (rank: number) => `Rank ${rank}`;

export function TechniqueLibraryScreen() {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection>({ type: 'active', index: 0 });
  const [inlineMessage, setInlineMessage] = useState<InlineMessage>(null);
  const [sortKey, setSortKey] = useState<SortKey>('power');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pathFilter, setPathFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIntent, setDetailIntent] = useState<'upgradeRank' | 'rerollTraits' | null>(null);
  const detailCloseRef = useRef<HTMLButtonElement | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Select stable slices individually to avoid recreating snapshots (React 19 external-store loop safeguard).
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const setCastingPolicy = useTechniqueStore((state) => state.setCastingPolicy);
  const getSlotProgressionSnapshot = useTechniqueStore((state) => state.getSlotProgressionSnapshot);
  const getCombatEquippedTechIds = useTechniqueStore((state) => state.getCombatEquippedTechIds);
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const getTraitModifiers = useTechCollectionStore((state) => state.getTraitModifiers);
  const getRuneModifiers = useTechCollectionStore((state) => state.getRuneModifiers);
  const getMasteryCooldownReductionPct = useTechCollectionStore((state) => state.getMasteryCooldownReductionPct);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const isContentLoading = useContentStore((state) => state.isLoading);
  const realmIndex = useGameStore((state) => state.realm.index);
  const techniqueLibraryIntent = useUIStore((state) => state.techniqueLibraryIntent);
  const techniqueFocusRequest = useUIStore((state) => state.techniqueFocusRequest);
  const clearTechniqueLibraryIntent = useUIStore((state) => state.clearTechniqueLibraryIntent);
  const clearTechniqueFocusRequest = useUIStore((state) => state.clearTechniqueFocusRequest);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const isBossFlag = useCombatStore((state) => state.isBoss);
  const combatContextType = useCombatStore((state) => state.combatContext?.type);

  const progression = useMemo(
    () => getSlotProgressionSnapshot(realmIndex),
    [getSlotProgressionSnapshot, realmIndex],
  );

  const selectedLoadout = useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? loadouts[0],
    [loadouts, selectedLoadoutId],
  );

  const selectedCastingPolicy: CastingPolicy = selectedLoadout?.castingPolicy ?? 'balanced';

  const isBossFight = isBossFlag || combatContextType === 'trial';

  const activeCap = progression.unlocked.active;
  const passiveCap = progression.unlocked.passive;
  const ultimateCap = progression.unlocked.ultimate ? 1 : 0;
  const activeEquipped = selectedLoadout?.slots.active.filter(Boolean).length ?? 0;
  const passiveEquipped = selectedLoadout?.slots.passive.filter(Boolean).length ?? 0;
  const ultimateEquipped = selectedLoadout?.slots.ultimate ? 1 : 0;
  const equippedCount = activeEquipped + passiveEquipped + ultimateEquipped;
  const equippedCap = activeCap + passiveCap + ultimateCap;
  const equippedSummary = selectedLoadout
    ? `Equipped: ${equippedCount}/${equippedCap} • Active: ${activeEquipped}/${activeCap} • Passive: ${passiveEquipped}/${passiveCap}`
    : 'Equipped: —';

  const activeLoadoutEquipped = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedLoadout) return ids;
    selectedLoadout.slots.active.forEach((id) => id && ids.add(id));
    selectedLoadout.slots.passive.forEach((id) => id && ids.add(id));
    if (selectedLoadout.slots.ultimate) ids.add(selectedLoadout.slots.ultimate);
    return ids;
  }, [selectedLoadout]);

  const equipmentProofRows = useMemo<EquipmentProofRow[]>(() => {
    if (!selectedLoadout) return [];

    const rows: EquipmentProofRow[] = [];
    const combatEquipped = getCombatEquippedTechIds(selectedLoadout.id);

    const addRow = (slotType: SlotType, slotIndex: number, techId: string | null | undefined) => {
      if (!techId) return;
      if (
        (slotType === 'active' && !combatEquipped.active.includes(techId)) ||
        (slotType === 'passive' && !combatEquipped.passive.includes(techId)) ||
        (slotType === 'ultimate' && combatEquipped.ultimate !== techId)
      ) {
        return;
      }
      const def = techniquesById[techId];
      const meta = unlockedTechs[techId];
      const traitMods = getTraitModifiers(techId, isBossFight);
      const runeMods = getRuneModifiers(techId, def);
      const masteryCdrPct = getMasteryCooldownReductionPct(techId);
      const totalCooldownReductionPct = Math.min(
        0.3,
        (traitMods?.cooldownReductionPct ?? 0) + (runeMods?.cooldownReductionPct ?? 0) + (masteryCdrPct ?? 0),
      );
      const baseCooldown = def?.cooldownSec ?? 0;
      const effectiveCooldownSec = baseCooldown > 0 ? Math.max(0.5, baseCooldown * (1 - totalCooldownReductionPct)) : null;
      const castsPerHour = effectiveCooldownSec ? 3600 / effectiveCooldownSec : null;
      const masteryGainPct = traitMods?.masteryGainPct ?? 0;
      const masteryPerHour = slotType === 'passive' ? null : castsPerHour ? castsPerHour * (1 + masteryGainPct) : null;

      rows.push({
        slotType,
        slotIndex,
        slotLabel: slotLabel({ type: slotType, index: slotIndex }),
        techId,
        name: def?.name ?? techId,
        def,
        lastCastAt: meta?.lastCastAt ?? null,
        effectiveCooldownSec,
        castsPerHour,
        masteryPerHour,
        icon: (def as { icon?: string | null } | undefined)?.icon ?? null,
      });
    };

    selectedLoadout.slots.active.forEach((id, idx) => addRow('active', idx, id));
    selectedLoadout.slots.passive.forEach((id, idx) => addRow('passive', idx, id));

    if (selectedLoadout.slots.ultimate) {
      addRow('ultimate', 0, selectedLoadout.slots.ultimate);
    }

    return rows;
  }, [
    getMasteryCooldownReductionPct,
    getRuneModifiers,
    getTraitModifiers,
    getCombatEquippedTechIds,
    isBossFight,
    selectedLoadout,
    techniquesById,
    unlockedTechs,
  ]);

  const ownedTechniques = useMemo<OwnedTechniqueView[]>(() => {
    return Object.entries(unlockedTechs)
      .filter(([, meta]) => meta?.unlocked)
      .map(([id, meta]) => {
        const def = techniquesById[id];
        const name = def?.name || id;
        const type = techniqueType(def);
        const typeLabel: OwnedTechniqueView['typeLabel'] =
          type === 'ultimate' ? 'Ultimate' : type === 'passive' ? 'Passive' : 'Active';
        const rarity = normalizeRarity(meta?.rarity ?? def?.rarity);
        const grade = normalizeGrade(meta?.manualGrade ?? def?.tier);
        const rank = meta?.rank ?? 1;
        const masteryXp = meta?.masteryXp ?? 0;
        const masteryLevel = masteryLevelFromXp(masteryXp);
        const masteryPct = masteryLevel / 100;
        const rarityBias = rarityWeight[rarity] ?? 1;
        const gradeBias = gradeWeight[grade] ?? 1;
        const powerScore = rankMultiplier(rank) * masteryMultiplier(masteryLevel) * rarityBias * gradeBias;

        return {
          id,
          name,
          def,
          typeLabel,
          path: def?.path,
          role: def?.role,
          rarity,
          grade,
          rank,
          masteryXp,
          masteryLevel,
          masteryPct,
          unlockedAt: meta?.unlockedAt ?? 0,
          lastCastAt: meta?.lastCastAt ?? 0,
          favorite: Boolean(meta?.favorite),
          powerScore,
        } satisfies OwnedTechniqueView;
      });
  }, [techniquesById, unlockedTechs]);

  const uniquePaths = useMemo(() => {
    const paths = new Set<string>();
    ownedTechniques.forEach((tech) => {
      if (tech.path) paths.add(tech.path);
    });
    return Array.from(paths).sort();
  }, [ownedTechniques]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    ownedTechniques.forEach((tech) => {
      if (tech.role) roles.add(tech.role);
    });
    return Array.from(roles).sort();
  }, [ownedTechniques]);

  const filteredTechniques = useMemo(() => {
    let list = [...ownedTechniques];

    list = list.filter((tech) => {
      const matchesType = typeFilter === 'all' || tech.typeLabel.toLowerCase() === typeFilter;
      const matchesPath = pathFilter === 'all' || tech.path === pathFilter;
      const matchesRole = roleFilter === 'all' || tech.role === roleFilter;
      const matchesGrade = gradeFilter === 'all' || tech.grade === gradeFilter;
      const matchesFavorite = !favoritesOnly || tech.favorite;
      return matchesType && matchesPath && matchesRole && matchesGrade && matchesFavorite;
    });

    list.sort((a, b) => {
      if (sortKey === 'power') {
        if (b.powerScore !== a.powerScore) return b.powerScore - a.powerScore;
      } else if (sortKey === 'recent') {
        if (b.unlockedAt !== a.unlockedAt) return (b.unlockedAt || 0) - (a.unlockedAt || 0);
      } else if (sortKey === 'used') {
        if (b.masteryXp !== a.masteryXp) return b.masteryXp - a.masteryXp;
        if (b.lastCastAt !== a.lastCastAt) return (b.lastCastAt || 0) - (a.lastCastAt || 0);
      } else if (sortKey === 'rarity') {
        const rarityCompare = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        if (rarityCompare !== 0) return rarityCompare;
        const gradeCompare = gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade);
        if (gradeCompare !== 0) return gradeCompare;
      }

      return a.name.localeCompare(b.name);
    });

    return list;
  }, [favoritesOnly, gradeFilter, ownedTechniques, pathFilter, roleFilter, sortKey, typeFilter]);

  const visibleTechniques = useMemo(() => filteredTechniques, [filteredTechniques]);

  const selectedOwned = useMemo(
    () => ownedTechniques.find((tech) => tech.id === selectedTechniqueId),
    [ownedTechniques, selectedTechniqueId],
  );

  const resetFilters = useCallback(() => {
    setSortKey('power');
    setTypeFilter('all');
    setPathFilter('all');
    setRoleFilter('all');
    setGradeFilter('all');
    setFavoritesOnly(false);
  }, []);

  useEffect(() => {
    if (visibleTechniques.length === 0) {
      if (selectedTechniqueId !== null) {
        setSelectedTechniqueId(null);
      }
      return;
    }

    const hasSelection = selectedTechniqueId
      ? visibleTechniques.some((tech) => tech.id === selectedTechniqueId)
      : false;

    if (!hasSelection) {
      setSelectedTechniqueId(visibleTechniques[0].id);
    }
  }, [selectedTechniqueId, visibleTechniques]);

  useEffect(() => {
    setHeaderTitles('Technique Library', 'Equip techniques, view mastery, and manage loadouts');
  }, [setHeaderTitles]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedTechniqueId && detailOpen) {
      setDetailOpen(false);
      setDetailIntent(null);
    }
  }, [detailOpen, selectedTechniqueId]);

  useEffect(() => {
    if (techniqueLibraryIntent?.type !== 'equip') return;

    const { techniqueId, preferredSlotType } = techniqueLibraryIntent;
    const def = techniquesById[techniqueId];
    const preferred = preferredSlotType ?? techniqueType(def);
    const defaultSelection: SlotSelection = { type: preferred, index: 0 };
    const unlockedCounts = progression.unlocked;

    if (preferred === 'ultimate' && !unlockedCounts.ultimate) {
      const realmName = progression.unlockRequirements.ultimate?.realmName || REALMS[3]?.name || 'later realms';
      setInlineMessage({
        type: 'error',
        text: `You learned an Ultimate technique, but the Ultimate slot is locked until ${realmName}.`,
      });
    } else if (preferred === 'active' && unlockedCounts.active <= 0) {
      const realmName = progression.unlockRequirements.active[0]?.realmName || REALMS[1]?.name || 'later realms';
      setInlineMessage({ type: 'error', text: `No active slots are available yet. Unlocks at: ${realmName}.` });
    } else if (preferred === 'passive' && unlockedCounts.passive <= 0) {
      const realmName = progression.unlockRequirements.passive[0]?.realmName || REALMS[2]?.name || 'later realms';
      setInlineMessage({ type: 'error', text: `No passive slots are available yet. Unlocks at: ${realmName}.` });
    } else {
      setSelectedSlot(defaultSelection);
    }

    setSelectedTechniqueId(techniqueId);
    clearTechniqueLibraryIntent();
  }, [
    clearTechniqueLibraryIntent,
    progression.unlocked,
    techniqueLibraryIntent,
    techniquesById,
  ]);

  useEffect(() => {
    if (!techniqueFocusRequest) return;
    const { techId, action } = techniqueFocusRequest;
    setSelectedTechniqueId(techId);

    window.requestAnimationFrame(() => {
      const el = document.getElementById(`tech-card-${techId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('techniqueCardHighlight');
        window.setTimeout(() => el.classList.remove('techniqueCardHighlight'), 2000);
      }

      if (action === 'upgradeRank') {
        setDetailIntent('upgradeRank');
        setDetailOpen(true);
      } else if (action === 'rerollTraits') {
        setDetailIntent('rerollTraits');
        setDetailOpen(true);
      } else {
        setDetailOpen(true);
      }
    });

    clearTechniqueFocusRequest();
  }, [clearTechniqueFocusRequest, techniqueFocusRequest]);

  useEffect(() => {
    const { type, index } = selectedSlot;
    if (type === 'ultimate' && !progression.unlocked.ultimate) {
      setSelectedSlot({ type: 'active', index: 0 });
    } else if (type !== 'ultimate') {
      const unlockedCount = type === 'active' ? progression.unlocked.active : progression.unlocked.passive;
      if (index >= unlockedCount) {
        setSelectedSlot({ type, index: Math.max(0, unlockedCount - 1) });
      }
    }
  }, [progression.unlocked, selectedSlot]);

  const handleSlotClick = useCallback(
    (slot: SlotSelection) => {
      const isUnlocked =
        slot.type === 'ultimate'
          ? progression.unlocked.ultimate
          : slot.index < (slot.type === 'active' ? progression.unlocked.active : progression.unlocked.passive);

      if (!isUnlocked) {
        const requirement =
          slot.type === 'ultimate'
            ? progression.unlockRequirements.ultimate
            : progression.unlockRequirements[slot.type][slot.index];

        const realmName = requirement?.realmName || 'a higher realm';
        setInlineMessage({ type: 'error', text: `That slot is locked. Unlocks at: ${realmName}.` });
        GameEvents.emit({ type: 'techniques/slot_locked', payload: { slotType: slot.type, slotIndex: slot.index } });
        return;
      }

      setSelectedSlot(slot);
      GameEvents.emit({ type: 'techniques/slot_selected', payload: { slotType: slot.type, slotIndex: slot.index } });
      setInlineMessage(null);
    },
    [progression.unlockRequirements, progression.unlocked],
  );

  const handleManualPavilionNavigation = useCallback(() => {
    setActiveTab('adventure');
  }, [setActiveTab]);

  const renderSlotRow = (slot: SlotSelection, techId: string | null | undefined) => {
    const isSelected = selectedSlot.type === slot.type && selectedSlot.index === slot.index;
    const isUnlocked =
      slot.type === 'ultimate'
        ? progression.unlocked.ultimate
        : slot.index < (slot.type === 'active' ? progression.unlocked.active : progression.unlocked.passive);
    const requirement =
      slot.type === 'ultimate'
        ? progression.unlockRequirements.ultimate
        : progression.unlockRequirements[slot.type][slot.index];
    const techName = techId ? techniquesById[techId]?.name || techId : '';

    return (
      <div
        key={`${slot.type}-${slot.index}`}
        className={`techniqueLibrarySlotRow ${isSelected ? 'is-selected' : ''} ${isUnlocked ? '' : 'is-locked'}`}
        onClick={() => handleSlotClick(slot)}
        title={!isUnlocked ? 'Breakthrough to unlock this meridian.' : undefined}
      >
        <div className="techniqueLibrarySlotLabel">{slotLabel(slot)}</div>
        <div className="techniqueLibrarySlotContent">
          {isUnlocked ? (
            techName ? (
              <span className="techniqueLibrarySlotTechName">{techName}</span>
            ) : (
              <span className="techniqueLibrarySlotEmpty">(Empty)</span>
            )
          ) : (
            <div className="techniqueLibrarySlotLocked">
              <div>(Locked)</div>
              {requirement?.realmName && (
                <div className="techniqueLibrarySlotSubtext">Unlocks at: {requirement.realmName}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedTechDef = selectedTechniqueId ? techniquesById[selectedTechniqueId] : undefined;
  const selectedType = techniqueType(selectedTechDef);
  const selectedRank = selectedOwned?.rank ?? 1;
  const selectedTier = normalizeGrade(selectedTechDef?.tier ?? selectedOwned?.grade);
  const selectedRarity = normalizeRarity(selectedOwned?.rarity ?? selectedTechDef?.rarity);
  const summaryCooldown = selectedTechDef?.cooldownSec ? `${selectedTechDef.cooldownSec}s cooldown` : 'No cooldown';
  const summaryRole = selectedTechDef?.role ? `${selectedTechDef.role} role` : `${selectedType} technique`;
  const summaryLine = selectedTechDef ? `Rank ${selectedRank} • ${summaryCooldown} • ${summaryRole}` : '';
  const selectedTierIcon = getTierIcon(selectedTier);
  const selectedPathIcon = getPathIcon(selectedTechDef?.path ?? 'unknown');
  const selectedTypeIcon = getTypeIcon(resolveTechniqueType(selectedTechDef));
  const formatCastRate = (row: EquipmentProofRow) => {
    if (row.slotType === 'passive') return 'Cast rate: Passive (always on)';
    if (row.effectiveCooldownSec) {
      const perHour = row.castsPerHour != null ? row.castsPerHour.toFixed(0) : '—';
      return `Cast rate (est.): ≈ 1 / ${row.effectiveCooldownSec.toFixed(1)}s (≈ ${perHour}/hr)`;
    }
    return 'Cast rate (est.): —';
  };

  const formatMasteryRate = (row: EquipmentProofRow) => {
    if (row.slotType === 'passive') return 'Mastery: Passive (no xp)';
    if (row.masteryPerHour != null) return `Mastery (est.): ≈ ${row.masteryPerHour.toFixed(0)} xp/hr`;
    return 'Mastery (est.): —';
  };

  const formatLastCast = (lastCastAt: number | null) => {
    if (!lastCastAt) return 'Last cast: Never';
    // `now` exists purely to refresh the relative time every second.
    void now;
    return `Last cast: ${formatDistanceToNowStrict(lastCastAt, { addSuffix: true })}`;
  };

  const filterControls = (
    <div className="techniqueLibraryFilters">
      <div className="techniqueLibraryFilter">
        <label htmlFor="techSort">Sort</label>
        <select
          id="techSort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="power">Power</option>
          <option value="recent">Recently Learned</option>
          <option value="used">Most Used</option>
          <option value="rarity">Rarity</option>
        </select>
      </div>
      <div className="techniqueLibraryFilter">
        <label htmlFor="techType">Type</label>
        <select
          id="techType"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="passive">Passive</option>
          <option value="ultimate">Ultimate</option>
        </select>
      </div>
      <div className="techniqueLibraryFilter">
        <label htmlFor="techPath">Path</label>
        <select
          id="techPath"
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
        >
          <option value="all">All</option>
          {uniquePaths.map((path) => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
      </div>
      <div className="techniqueLibraryFilter">
        <label htmlFor="techRole">Role</label>
        <select
          id="techRole"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All</option>
          {uniqueRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <div className="techniqueLibraryFilter">
        <label htmlFor="techGrade">Grade</label>
        <select
          id="techGrade"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
        >
          <option value="all">All</option>
          <option value="mortal">Mortal</option>
          <option value="earth">Earth</option>
          <option value="heaven">Heaven</option>
          <option value="mystic">Mystic</option>
        </select>
      </div>
      <div className="techniqueLibraryFilter techniqueLibraryFilter--checkbox">
        <label htmlFor="techFavorites">Favorites only</label>
        <input
          id="techFavorites"
          type="checkbox"
          checked={favoritesOnly}
          onChange={(e) => setFavoritesOnly(e.target.checked)}
        />
      </div>
      <button className="techniqueLibraryReset" onClick={resetFilters} type="button">
        Reset filters
      </button>
    </div>
  );

  const groupedShelves = useMemo(() => {
    const active: OwnedTechniqueView[] = [];
    const passive: OwnedTechniqueView[] = [];
    const ultimate: OwnedTechniqueView[] = [];
    const other: OwnedTechniqueView[] = [];

    visibleTechniques.forEach((tech) => {
      const typeKey = resolveTechniqueType(tech.def);
      if (typeKey === 'ultimate') {
        ultimate.push(tech);
      } else if (typeKey === 'passive') {
        passive.push(tech);
      } else if (typeKey === 'active') {
        active.push(tech);
      } else {
        other.push(tech);
      }
    });

    return { active, passive, ultimate, other };
  }, [visibleTechniques]);

  const renderTechShelfRow = (
    title: string,
    entries: OwnedTechniqueView[],
    capacity: number,
  ) => {
    const slotsToRender = Math.max(capacity, entries.length);
    const placeholders = Math.max(0, slotsToRender - entries.length);

    return (
      <div className="techShelfRow">
        <div className="techShelfRowHeader">
          <div className="techShelfRowTitle">{title}</div>
          <div className="techShelfRowCount">{entries.length}</div>
        </div>
        <div className="techShelfRowRail">
          <div className="techShelfRowSpines">
            {entries.map((tech) => {
              const displayName = tech.name || tech.id;
              const tierKey = normalizeGrade(tech.def?.tier ?? tech.def?.tier);
              const pathKey = tech.def?.path ?? 'unknown';
              const typeKey = resolveTechniqueType(tech.def);
              return (
                <div key={tech.id} id={`tech-card-${tech.id}`} className="techShelfRowSpine">
                  <TechniqueSpine
                    id={tech.id}
                    title={displayName}
                    rarity={tech.rarity}
                    tierKey={tierKey}
                    pathKey={pathKey}
                    typeKey={typeKey}
                    rank={tech.rank}
                    mastery={tech.masteryLevel}
                    equipped={activeLoadoutEquipped.has(tech.id)}
                    selected={selectedTechniqueId === tech.id}
                    onSelect={() => {
                      setSelectedTechniqueId(tech.id);
                      setInlineMessage(null);
                      setDetailOpen(true);
                      setDetailIntent(null);
                    }}
                  />
                </div>
              );
            })}
            {Array.from({ length: placeholders }).map((_, index) => (
              <div
                key={`${title}-placeholder-${index}`}
                className="techShelfRowSpine techShelfRowSpine--placeholder"
                aria-hidden="true"
              >
                <div className="techSpine techSpine--placeholder" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="techniquesPanel techniquesPanel--v2">
      <header className="techTopRibbon">
        <div className="techTopLeft">
          <div className="techTitle">Techniques</div>
          <div className="techSubtitle">{equippedSummary}</div>
        </div>
        <div className="techTopCenter">{filterControls}</div>
        <div className="techTopRight">
          <div className="techTopLoadout">
            <label htmlFor="techLoadoutSelect">Loadout</label>
            <select
              id="techLoadoutSelect"
              value={selectedLoadoutId}
              onChange={(event) => setSelectedLoadout(event.target.value)}
            >
              {loadouts.map((loadout) => (
                <option key={loadout.id} value={loadout.id}>
                  {loadout.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="techStage">
        <section className="techLoadoutBoard">
          <div className="techniqueLibraryColumn techniqueLibraryColumn--left">
            <div className="techniqueLibraryPanel">
              <div className="techniqueLibraryPanelHeader">Loadouts</div>
              <div className="techniqueLibraryLoadouts">
                {loadouts.map((loadout) => (
                  <button
                    key={loadout.id}
                    className={`techniqueLibraryLoadout ${loadout.id === selectedLoadout?.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedLoadout(loadout.id)}
                  >
                    <div className="techniqueLibraryLoadoutName">{loadout.name}</div>
                    <div className="techniqueLibraryLoadoutMeta">
                      Casting: {castingPolicyLabels[loadout.castingPolicy]}
                    </div>
                  </button>
                ))}
              </div>

              <div className="techniqueLibraryCastingPolicy">
                <div className="techniqueLibraryCastingPolicyLabel">Casting Policy</div>
                <div className="techniqueLibraryCastingPolicyButtons">
                  {castingPolicies.map((policy) => {
                    const active = selectedCastingPolicy === policy;
                    return (
                      <button
                        key={policy}
                        type="button"
                        className={`techniqueLibraryCastingPolicyButton ${active ? 'is-active' : ''}`}
                        onClick={() => selectedLoadout && setCastingPolicy(selectedLoadout.id, policy)}
                        title={castingPolicyHelp[policy]}
                        disabled={!selectedLoadout}
                      >
                        {castingPolicyLabels[policy]}
                      </button>
                    );
                  })}
                </div>
                <div className="techniqueLibraryCastingPolicyHelp">
                  {castingPolicyHelp[selectedCastingPolicy]}
                </div>
              </div>
            </div>

            <div className="techniqueLibraryPanel">
              <div className="techniqueLibraryPanelHeader">Slots</div>
              <div className="techniqueLibrarySlots">
                <div className="techniqueLibrarySlotGroupLabel">Active Techniques</div>
                {Array.from({ length: progression.displayed.active }).map((_, idx) =>
                  renderSlotRow({ type: 'active', index: idx }, selectedLoadout?.slots.active[idx]),
                )}

                <div className="techniqueLibrarySlotGroupLabel">Passive Techniques</div>
                {Array.from({ length: progression.displayed.passive }).map((_, idx) =>
                  renderSlotRow({ type: 'passive', index: idx }, selectedLoadout?.slots.passive[idx]),
                )}

                <div className="techniqueLibrarySlotGroupLabel">Ultimate</div>
                {renderSlotRow({ type: 'ultimate', index: 0 }, selectedLoadout?.slots.ultimate)}
              </div>
            </div>

            <div className="techniqueLibraryPanel">
              <div className="techniqueLibraryPanelHeader">Equipment Proof (This Loadout)</div>
              <div className="techniqueLibraryProofList">
                {equipmentProofRows.length === 0 && (
                  <div className="techniqueLibraryEmpty">No techniques equipped in this loadout.</div>
                )}
                {equipmentProofRows.map((row) => (
                  <div
                    key={`${row.slotType}-${row.slotIndex}-${row.techId}`}
                    className="techniqueLibraryProofRow"
                  >
                    <div className="techniqueLibraryProofIcon">{row.icon || typeIcon(row.slotType)}</div>
                    <div className="techniqueLibraryProofBody">
                      <div className="techniqueLibraryProofHeader">
                        <div className="techniqueLibraryProofName">{row.name}</div>
                        <div className="techniqueLibraryProofSlot">{row.slotLabel}</div>
                      </div>
                      <div className="techniqueLibraryProofStats">
                        <div>{formatCastRate(row)}</div>
                        <div>{formatLastCast(row.lastCastAt)}</div>
                        <div>{formatMasteryRate(row)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="techLibraryStage">
          <div className="techniqueLibraryColumn techniqueLibraryColumn--center">
            <div className="techniqueLibraryPanel">
              <div className="techniqueLibraryPanelHeader">Owned Techniques</div>
              <div className="techShelfWall">
                {isContentLoading ? (
                  <div className="techniqueLibraryEmptyState">Loading techniques...</div>
                ) : ownedTechniques.length === 0 ? (
                  <div className="techniqueLibraryEmptyState">
                    <p>
                      No techniques learned yet. Buy a Manual in the Manual Pavilion, then Study it to learn the
                      Technique.
                    </p>
                    <button className="techniqueLibraryLinkButton" onClick={handleManualPavilionNavigation}>
                      Go to Manual Pavilion
                    </button>
                  </div>
                ) : filteredTechniques.length === 0 ? (
                  <div className="techniqueLibraryEmptyState">No techniques match the current filters.</div>
                ) : (
                  <>
                    {renderTechShelfRow('Active Techniques', groupedShelves.active, 14)}
                    {renderTechShelfRow('Passive Techniques', groupedShelves.passive, 12)}
                    {renderTechShelfRow('Ultimate Techniques', groupedShelves.ultimate, 8)}
                    {groupedShelves.other.length > 0 &&
                      renderTechShelfRow('Other Techniques', groupedShelves.other, 8)}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="techInspectorDock">
          <div className="techniqueLibraryColumn techniqueLibraryColumn--right">
            <div className="techniqueLibraryPanel techniqueLibraryPanel--summary">
              <div className="techniqueLibraryPanelHeader">Selected Technique</div>
              <div className="techniqueLibrarySummary">
                {selectedTechniqueId ? (
                  <>
                    <div className="techniqueLibrarySummaryHeader">
                      <div className="techniqueLibrarySummaryTitle">{selectedTechDef?.name || selectedTechniqueId}</div>
                      <div className="techniqueLibrarySummaryIcons" aria-label="Technique metadata">
                        <span
                          className="techniqueLibrarySummaryIcon"
                          role="img"
                          aria-label={selectedTierIcon.label}
                          title={selectedTierIcon.label}
                        >
                          {selectedTierIcon.icon}
                        </span>
                        <span
                          className="techniqueLibrarySummaryIcon"
                          role="img"
                          aria-label={selectedPathIcon.label}
                          title={selectedPathIcon.label}
                        >
                          {selectedPathIcon.icon}
                        </span>
                        <span
                          className="techniqueLibrarySummaryIcon"
                          role="img"
                          aria-label={selectedTypeIcon.label}
                          title={selectedTypeIcon.label}
                        >
                          {selectedTypeIcon.icon}
                        </span>
                      </div>
                    </div>
                    <div className="techniqueLibrarySummaryChips">
                      <span className={`techniqueLibraryTypeBadge type-${selectedType}`}>
                        {selectedType === 'ultimate'
                          ? 'Ultimate'
                          : selectedType === 'passive'
                            ? 'Passive'
                            : 'Active'}
                      </span>
                      <span className={`techniqueLibraryBadge rarity-${selectedRarity}`}>{rarityLabel(selectedRarity)}</span>
                      <span className={`techniqueLibraryBadge grade-${selectedTier}`}>{gradeLabel(selectedTier)}</span>
                      {selectedTechDef?.path && <span className="techniqueLibraryBadge">{selectedTechDef.path}</span>}
                      {selectedTechDef?.role && <span className="techniqueLibraryBadge">{selectedTechDef.role}</span>}
                      <span className="techniqueLibrarySummaryRank">{formatRankLabel(selectedRank)}</span>
                    </div>
                    <div className="techniqueLibrarySummaryLine">{summaryLine}</div>
                    <div className="techniqueLibrarySummaryActions">
                      <button
                        className="techniqueLibraryPrimaryButton"
                        onClick={() => {
                          setDetailIntent(null);
                          setDetailOpen(true);
                        }}
                        type="button"
                      >
                        Open Details
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="techniqueLibraryEmptyDetail">Select a technique to view details.</div>
                )}
              </div>
            </div>

            {inlineMessage && (
              <div className={`techniqueLibraryInlineMessage inline-${inlineMessage.type}`}>
                {inlineMessage.text}
              </div>
            )}
          </div>
        </aside>
      </div>

      <TechniqueDetailModal
        open={detailOpen}
        techniqueId={selectedTechniqueId}
        onClose={() => setDetailOpen(false)}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        initialAction={detailIntent}
        onInitialActionHandled={() => setDetailIntent(null)}
        initialFocusRef={detailCloseRef}
      />
    </div>
  );
}
