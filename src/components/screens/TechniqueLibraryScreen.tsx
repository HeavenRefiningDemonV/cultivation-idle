import { useEffect, useMemo, useState, useCallback } from 'react';
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
import type { SlotType } from '../../stores/techniqueStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useUIStore } from '../../stores/uiStore';
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

const formatRankLabel = (rank: number) => `Rank ${rank}`;

const formatResourceCost = (resourceModel?: string, resourceCost?: number | string) => {
  if (!resourceModel) return 'N/A';
  if (resourceCost === undefined || resourceCost === null || resourceCost === '') return resourceModel;
  return `${resourceCost} ${resourceModel}`;
};

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

  const {
    loadouts,
    selectedLoadoutId,
    setSelectedLoadout,
    equipTechnique,
    getSlotProgressionSnapshot,
  } = useTechniqueStore((state) => ({
    loadouts: state.loadouts,
    selectedLoadoutId: state.selectedLoadoutId,
    setSelectedLoadout: state.setSelectedLoadout,
    equipTechnique: state.equipTechnique,
    getSlotProgressionSnapshot: state.getSlotProgressionSnapshot,
  }));
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const toggleFavorite = useTechCollectionStore((state) => state.toggleFavorite);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const realmIndex = useGameStore((state) => state.realm.index);
  const { techniqueLibraryIntent, clearTechniqueLibraryIntent, setHeaderTitles } = useUIStore((state) => ({
    techniqueLibraryIntent: state.techniqueLibraryIntent,
    clearTechniqueLibraryIntent: state.clearTechniqueLibraryIntent,
    setHeaderTitles: state.setHeaderTitles,
  }));

  const progression = useMemo(
    () => getSlotProgressionSnapshot(realmIndex),
    [getSlotProgressionSnapshot, realmIndex],
  );

  const selectedLoadout = useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? loadouts[0],
    [loadouts, selectedLoadoutId],
  );

  const loadoutLabels = useMemo(
    () => loadouts.map((loadout, idx) => ({ id: loadout.id, label: String.fromCharCode(65 + idx), name: loadout.name })),
    [loadouts],
  );

  const equippedInfo = useMemo(() => {
    const ids = new Set<string>();
    const map: Record<string, string[]> = {};

    loadouts.forEach((loadout, idx) => {
      const label = String.fromCharCode(65 + idx);
      const add = (id?: string | null) => {
        if (!id) return;
        ids.add(id);
        map[id] = map[id] ? [...new Set([...map[id], label])] : [label];
      };

      loadout.slots.active.forEach(add);
      loadout.slots.passive.forEach(add);
      add(loadout.slots.ultimate);
    });

    return { ids, map };
  }, [loadouts]);

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
    setHeaderTitles('Technique Library', 'Equip techniques, view mastery, and manage loadouts');
  }, [setHeaderTitles]);

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
        return;
      }

      setSelectedSlot(slot);
      setInlineMessage(null);
    },
    [progression.unlockRequirements, progression.unlocked],
  );

  const handleEquip = useCallback(() => {
    if (!selectedTechniqueId || !selectedLoadout) return;

    const result = equipTechnique(selectedSlot.type, selectedSlot.index, selectedTechniqueId, selectedLoadout.id);

    if (result.ok) {
      setInlineMessage({
        type: 'success',
        text: `Equipped to ${slotLabel(selectedSlot)} on ${selectedLoadout.name}.`,
      });
    } else {
      const unlockText = result.unlockAt ? ` Unlocks at: ${result.unlockAt.realmName}.` : '';
      setInlineMessage({ type: 'error', text: `${result.message}${unlockText}` });
    }
  }, [equipTechnique, selectedLoadout, selectedSlot, selectedTechniqueId]);

  const handleFavoriteToggle = useCallback(() => {
    if (!selectedTechniqueId) return;
    const willFavorite = !(selectedOwned?.favorite ?? false);
    toggleFavorite(selectedTechniqueId);
    setInlineMessage({
      type: 'info',
      text: willFavorite ? 'Added to favorites.' : 'Removed from favorites.',
    });
  }, [selectedOwned?.favorite, selectedTechniqueId, toggleFavorite]);

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
  const effectText = selectedTechDef
    ? String(selectedTechDef.effect ?? 'No effect description available.')
    : 'No effect description available.';
  const mastery75Text = selectedTechDef?.secondaryAtMastery75
    ? String(selectedTechDef.secondaryAtMastery75)
    : null;
  const selectedSlotTechId = selectedLoadout
    ? selectedSlot.type === 'ultimate'
      ? selectedLoadout.slots.ultimate
      : selectedLoadout.slots[selectedSlot.type]?.[selectedSlot.index]
    : '';

  const equipButtonLabel = selectedSlotTechId && selectedSlotTechId !== selectedTechniqueId ? 'Swap' : 'Equip';
  const equipDisabled = !selectedTechniqueId || !selectedLoadout;

  return (
    <div className="techniqueLibraryRoot">
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
                <div className="techniqueLibraryLoadoutMeta">AI: {loadout.aiProfile}</div>
              </button>
            ))}
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
      </div>

      <div className="techniqueLibraryColumn techniqueLibraryColumn--center">
        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Owned Techniques</div>
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
          <div className="techniqueLibraryOwnedList">
            {ownedTechniques.length === 0 ? (
              <div className="techniqueLibraryEmptyState">
                No techniques learned yet. Buy a Manual in the Manual Pavilion, then Study it to learn the Technique.
              </div>
            ) : filteredTechniques.length === 0 ? (
              <div className="techniqueLibraryEmptyState">No techniques match the current filters.</div>
            ) : (
              filteredTechniques.map((tech) => {
                const type = techniqueType(tech.def);
                const equippedLabels = equippedInfo.map[tech.id];
                return (
                  <button
                    key={tech.id}
                    className={`techniqueLibraryOwnedRow ${selectedTechniqueId === tech.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedTechniqueId(tech.id);
                      setInlineMessage(null);
                    }}
                  >
                    <div className="techniqueLibraryOwnedRowLeft">
                      <div className={`techniqueLibraryIcon type-${type}`}>{typeIcon(type)}</div>
                      <div>
                        <div className="techniqueLibraryOwnedName">{tech.name}</div>
                        <div className="techniqueLibraryOwnedBadges">
                          <span className={`techniqueLibraryTypeBadge type-${type}`}>
                            {tech.typeLabel}
                          </span>
                          <span className={`techniqueLibraryBadge rarity-${tech.rarity}`}>{rarityLabel(tech.rarity)}</span>
                          <span className={`techniqueLibraryBadge grade-${tech.grade}`}>{gradeLabel(tech.grade)}</span>
                          {tech.favorite && <span className="techniqueLibraryFavorite">★</span>}
                        </div>
                      </div>
                    </div>
                    <div className="techniqueLibraryOwnedRowRight">
                      <div className="techniqueLibraryRank">{formatRankLabel(tech.rank)}</div>
                      <div className="techniqueLibraryMasteryBar">
                        <div
                          className="techniqueLibraryMasteryFill"
                          style={{ width: `${Math.min(100, Math.max(0, tech.masteryPct * 100))}%` }}
                        />
                      </div>
                      <div className="techniqueLibraryMasteryLabel">Mastery {tech.masteryLevel}/100</div>
                      {equippedLabels && (
                        <div className="techniqueLibraryEquippedBadge" title={
                          loadoutLabels
                            .filter((label) => equippedLabels.includes(label.label))
                            .map((label) => `${label.label}: ${label.name}`)
                            .join(', ')
                        }>
                          Equipped: {equippedLabels.join(', ')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="techniqueLibraryColumn techniqueLibraryColumn--right">
        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Technique Details</div>
          <div className="techniqueLibraryDetail">
            {selectedTechniqueId ? (
              <>
                <div className="techniqueLibraryDetailTitleRow">
                  <h3 className="techniqueLibraryDetailTitle">{selectedTechDef?.name || selectedTechniqueId}</h3>
                  {selectedOwned?.favorite && <span className="techniqueLibraryFavorite">★</span>}
                </div>
                <div className="techniqueLibraryDetailBadges">
                  <span className={`techniqueLibraryTypeBadge type-${selectedType}`}>
                    {selectedType === 'ultimate'
                      ? 'Ultimate'
                      : selectedType === 'passive'
                        ? 'Passive'
                        : 'Active'}
                  </span>
                  <span className={`techniqueLibraryBadge rarity-${selectedOwned?.rarity ?? 'common'}`}>
                    {rarityLabel(selectedOwned?.rarity)}
                  </span>
                  <span className={`techniqueLibraryBadge grade-${selectedOwned?.grade ?? 'mortal'}`}>
                    {gradeLabel(selectedOwned?.grade)}
                  </span>
                  <span className="techniqueLibraryRank">{formatRankLabel(selectedOwned?.rank ?? 1)}</span>
                </div>
                <div className="techniqueLibraryDetailSection">
                  <div className="techniqueLibraryDetailLine">
                    <strong>In combat:</strong> {effectText}
                  </div>
                  {mastery75Text && (
                    <div className="techniqueLibraryDetailLine">
                      <strong>At Mastery 75:</strong> {mastery75Text}
                    </div>
                  )}
                </div>

                <div className="techniqueLibraryDetailStats">
                  <div>
                    <div className="techniqueLibraryStatLabel">Cooldown</div>
                    <div className="techniqueLibraryStatValue">
                      {selectedTechDef?.cooldownSec !== undefined ? `${selectedTechDef.cooldownSec}s` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="techniqueLibraryStatLabel">Resource</div>
                    <div className="techniqueLibraryStatValue">
                      {formatResourceCost(selectedTechDef?.resourceModel as string, selectedTechDef?.resourceCost)}
                    </div>
                  </div>
                  {selectedTechDef?.path && (
                    <div>
                      <div className="techniqueLibraryStatLabel">Path</div>
                      <div className="techniqueLibraryStatValue">{selectedTechDef.path}</div>
                    </div>
                  )}
                  {selectedTechDef?.role && (
                    <div>
                      <div className="techniqueLibraryStatLabel">Role</div>
                      <div className="techniqueLibraryStatValue">{selectedTechDef.role}</div>
                    </div>
                  )}
                  {selectedTechDef?.tags?.length ? (
                    <div className="techniqueLibraryTags">
                      {selectedTechDef.tags.map((tag) => (
                        <span key={tag} className="techniqueLibraryTag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="techniqueLibraryProgressSection">
                  <div className="techniqueLibraryProgressHeader">
                    <span>Progress</span>
                    <span>{formatRankLabel(selectedOwned?.rank ?? 1)}</span>
                  </div>
                  <div className="techniqueLibraryProgressBar">
                    <div
                      className="techniqueLibraryProgressFill"
                      style={{ width: `${Math.min(100, Math.max(0, (selectedOwned?.masteryPct ?? 0) * 100))}%` }}
                    />
                    {[25, 50, 75, 100].map((mark) => (
                      <div key={mark} className="techniqueLibraryProgressTick" style={{ left: `${mark}%` }} />
                    ))}
                  </div>
                  <div className="techniqueLibraryProgressLabel">
                    Mastery {selectedOwned?.masteryLevel ?? 1}/100
                  </div>
                </div>

                <div className="techniqueLibraryButtons">
                  <button
                    className="techniqueLibraryPrimaryButton"
                    disabled={equipDisabled}
                    onClick={handleEquip}
                  >
                    {equipButtonLabel}
                  </button>
                  <button className="techniqueLibrarySecondaryButton" onClick={handleFavoriteToggle}>
                    {selectedOwned?.favorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Upgrade Rank
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Reroll Traits
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Socket Rune
                  </button>
                </div>
              </>
            ) : (
              <div className="techniqueLibraryEmptyDetail">Select a technique to see details and equip it.</div>
            )}
          </div>
        </div>

        {inlineMessage && (
          <div className={`techniqueLibraryInlineMessage inline-${inlineMessage.type}`}>
            {inlineMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
