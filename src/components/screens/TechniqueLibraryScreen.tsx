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
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { normalizeTechniqueEffects, summarizeEffects } from '../../systems/techniques/effects';
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
const SOUL_INK_REROLL_ITEM_ID = 'reagent_soul_ink_t0';

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
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockTraitIndex, setLockTraitIndex] = useState<number | null>(null);
  const [runeSelections, setRuneSelections] = useState<Record<number, string>>({});

  // Select stable slices individually to avoid recreating snapshots (React 19 external-store loop safeguard).
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const equipTechnique = useTechniqueStore((state) => state.equipTechnique);
  const getSlotProgressionSnapshot = useTechniqueStore((state) => state.getSlotProgressionSnapshot);
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const toggleFavorite = useTechCollectionStore((state) => state.toggleFavorite);
  const getTraitSlotBreakdown = useTechCollectionStore((state) => state.getTraitSlotBreakdown);
  const getEffectiveTraitSlots = useTechCollectionStore((state) => state.getEffectiveTraitSlots);
  const ensureTraits = useTechCollectionStore((state) => state.ensureTraits);
  const rerollTraits = useTechCollectionStore((state) => state.rerollTraits);
  const getTraitDefinition = useTechCollectionStore((state) => state.getTraitDefinition);
  const getTraitRollRangeLabel = useTechCollectionStore((state) => state.getTraitRollRangeLabel);
  const getTraitQualityPct = useTechCollectionStore((state) => state.getTraitQualityPct);
  const getEffectiveRuneSlots = useTechCollectionStore((state) => state.getEffectiveRuneSlots);
  const ensureRunes = useTechCollectionStore((state) => state.ensureRunes);
  const socketRune = useTechCollectionStore((state) => state.socketRune);
  const unsocketRune = useTechCollectionStore((state) => state.unsocketRune);
  const getNextRankCost = useTechCollectionStore((state) => state.getNextRankCost);
  const getRankCap = useTechCollectionStore((state) => state.getRankCap);
  const fragments = useTechCollectionStore((state) => state.fragments);
  const getMasteryCooldownReductionPct = useTechCollectionStore((state) => state.getMasteryCooldownReductionPct);
  const getMasteryCostReductionPct = useTechCollectionStore((state) => state.getMasteryCostReductionPct);
  const getNextMasteryMilestoneHelper = useTechCollectionStore((state) => state.getNextMasteryMilestone);
  const getMasteryMilestoneEffectsHelper = useTechCollectionStore((state) => state.getMasteryMilestoneEffects);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const runesById = useContentStore((state) => state.maps.runesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const heavenBonus = useContentStore(
    (state) => state.raw?.economy?.manualSystem?.grades?.heaven?.mastery75PotencyBonus,
  );
  const realmIndex = useGameStore((state) => state.realm.index);
  const techniqueLibraryIntent = useUIStore((state) => state.techniqueLibraryIntent);
  const clearTechniqueLibraryIntent = useUIStore((state) => state.clearTechniqueLibraryIntent);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const inventoryItems = useInventoryStore((state) => state.items);

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

  const availableRunes = useMemo(() => {
    return Object.keys(runesById).map((id) => ({
      id,
      name: itemsById[id]?.name ?? id,
      qty: inventoryItems[id] ?? 0,
    }));
  }, [inventoryItems, itemsById, runesById]);

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
    if (!selectedTechniqueId) return;
    ensureTraits(selectedTechniqueId);
    ensureRunes(selectedTechniqueId);
    setLockTraitIndex(null);
    setLockEnabled(false);
    setRuneSelections({});
  }, [ensureRunes, ensureTraits, selectedTechniqueId]);

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

  const handleRerollTraits = useCallback(() => {
    if (!selectedTechniqueId) return;
    const result = rerollTraits(selectedTechniqueId, {
      lockEnabled,
      lockIndex: lockTraitIndex ?? undefined,
    });

    if (result.ok) {
      const lockedText = result.lockedIndex !== undefined ? ` (kept trait ${result.lockedIndex + 1})` : '';
      setInlineMessage({ type: 'success', text: `Traits rerolled${lockedText}.` });
    } else {
      const baseMessage = result.reason === 'invalid_lock'
        ? 'Select a valid trait to lock before rerolling.'
        : result.reason === 'insufficient_items'
          ? 'Not enough Soul Ink to reroll traits.'
          : result.reason ?? 'Unable to reroll traits.';
      setInlineMessage({ type: 'error', text: baseMessage });
    }
  }, [lockEnabled, lockTraitIndex, rerollTraits, selectedTechniqueId]);

  const handleSocketRune = useCallback(
    (slotIndex: number) => {
      if (!selectedTechniqueId) return;
      const selection = runeSelections[slotIndex] ?? availableRunes.find((entry) => entry.qty > 0)?.id;
      if (!selection) {
        setInlineMessage({ type: 'error', text: 'No runes available to socket.' });
        return;
      }

      const result = socketRune(selectedTechniqueId, slotIndex, selection);
      if (result.ok) {
        setInlineMessage({ type: 'success', text: `Socketed rune into slot ${slotIndex + 1}.` });
      } else {
        setInlineMessage({ type: 'error', text: result.reason ?? 'Unable to socket rune.' });
      }
    },
    [availableRunes, runeSelections, selectedTechniqueId, socketRune],
  );

  const handleUnsocketRune = useCallback(
    (slotIndex: number) => {
      if (!selectedTechniqueId) return;
      const result = unsocketRune(selectedTechniqueId, slotIndex);
      if (result.ok) {
        setInlineMessage({ type: 'info', text: `Removed rune from slot ${slotIndex + 1}.` });
      } else {
        setInlineMessage({ type: 'error', text: result.reason ?? 'Unable to remove rune.' });
      }
    },
    [selectedTechniqueId, unsocketRune],
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
  const effectText = selectedTechDef
    ? String(selectedTechDef.effect ?? 'No effect description available.')
    : 'No effect description available.';
  const selectedEntry = selectedTechniqueId ? unlockedTechs[selectedTechniqueId] : undefined;
  const masteryLevel = selectedOwned?.masteryLevel ?? masteryLevelFromXp(selectedEntry?.masteryXp ?? 0);
  const masteryCdr = selectedTechniqueId ? getMasteryCooldownReductionPct(selectedTechniqueId) : 0;
  const masteryCostReduction = selectedTechniqueId ? getMasteryCostReductionPct(selectedTechniqueId) : 0;
  const masteryMilestoneEffects = getMasteryMilestoneEffectsHelper(masteryLevel);
  const nextMilestoneDetail = getNextMasteryMilestoneHelper(masteryLevel);
  const rankCapSelected = selectedTechniqueId ? getRankCap(selectedTechniqueId) : 0;
  const nextRankInfo = selectedTechniqueId ? getNextRankCost(selectedTechniqueId) : null;
  const fragmentsOwnedSelected = selectedTechniqueId ? fragments[selectedTechniqueId] ?? 0 : 0;
  const traitInfoSelected = selectedTechniqueId
    ? getTraitSlotBreakdown(selectedTechniqueId)
    : { raritySlots: 0, gradeCap: 0, effectiveSlots: 0, rarity: 'common', grade: 'mortal' as const };
  const selectedTraits = selectedEntry?.traits ?? [];
  const rerollCostQty = lockEnabled && lockTraitIndex !== null ? 2 : 1;
  const rerollItemName = itemsById[SOUL_INK_REROLL_ITEM_ID]?.name ?? 'Soul Ink';
  const runeSlots = selectedTechniqueId ? getEffectiveRuneSlots(selectedTechniqueId) : 0;
  const runeDisplay = useMemo(
    () => Array.from({ length: runeSlots }, (_, idx) => selectedEntry?.runes?.[idx] ?? null),
    [runeSlots, selectedEntry?.runes],
  );
  const primaryEffects = useMemo(
    () => (selectedTechDef ? normalizeTechniqueEffects(selectedTechDef, { includeSecondary: false }) : []),
    [selectedTechDef],
  );
  const secondaryEffects = useMemo(
    () =>
      selectedTechDef
        ? normalizeTechniqueEffects(selectedTechDef, { includeSecondary: true }).filter((effect) => effect.source === 'secondary')
        : [],
    [selectedTechDef],
  );
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
              filteredTechniques.map((tech) => {
                const type = techniqueType(tech.def);
                const entry = unlockedTechs[tech.id];
                const isSelected = selectedTechniqueId === tech.id;
                const masteryValue = Math.min(100, Math.max(0, tech.masteryPct * 100));
                const nextMilestone = getNextMasteryMilestoneHelper(tech.masteryLevel);
                const rankCap = getRankCap(tech.id);
                const nextRank = getNextRankCost(tech.id);
                const fragmentsOwned = fragments[tech.id] ?? 0;
                const fragmentsNeeded = nextRank?.cost.fragmentsRequired ?? 0;
                const traitInfo = getTraitSlotBreakdown(tech.id);
                const traitCount = entry?.traits?.length ?? 0;
                const displayTraitSlots = Math.max(traitInfo.raritySlots, traitInfo.gradeCap);
                const unlockedEmpty = Math.max(traitInfo.effectiveSlots - traitCount, 0);
                const lockedSlots = Math.max(displayTraitSlots - traitInfo.effectiveSlots, 0);
                const rerollItemName = itemsById[SOUL_INK_REROLL_ITEM_ID]?.name ?? 'Soul Ink';
                const equippedLabels = equippedInfo.map[tech.id];
                const canUpgradeRank = Boolean(
                  nextRank &&
                    tech.rank < rankCap &&
                    fragmentsOwned >= (fragmentsNeeded ?? 0) &&
                    nextRank.cost.runeDustRequired === 0 &&
                    nextRank.cost.soulInkRequired === 0,
                );

                return (
                  <div
                    key={tech.id}
                    id={`tech-card-${tech.id}`}
                    className={`techniqueLibraryOwnedCard ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedTechniqueId(tech.id);
                      setInlineMessage(null);
                    }}
                  >
                    <div className="techniqueLibraryOwnedHeader">
                      <div className="techniqueLibraryOwnedTitleRow">
                        <div className="techniqueLibraryOwnedName">{tech.name}</div>
                        {tech.favorite && <span className="techniqueLibraryFavorite">★</span>}
                      </div>
                      <div className="techniqueLibraryOwnedBadges">
                        <span className={`techniqueLibraryTypeBadge type-${type}`}>
                          {tech.typeLabel}
                        </span>
                        {tech.path && <span className="techniqueLibraryBadge">{tech.path}</span>}
                        {tech.role && <span className="techniqueLibraryBadge">{tech.role}</span>}
                        <span className={`techniqueLibraryBadge rarity-${tech.rarity}`}>{rarityLabel(tech.rarity)}</span>
                        <span className={`techniqueLibraryBadge grade-${tech.grade}`}>{gradeLabel(tech.grade)}</span>
                        <span className="techniqueLibraryBadge rankBadge">{formatRankLabel(tech.rank)}</span>
                        {equippedLabels && (
                          <span
                            className="techniqueLibraryBadge equippedBadge"
                            title={
                              loadoutLabels
                                .filter((label) => equippedLabels.includes(label.label))
                                .map((label) => `${label.label}: ${label.name}`)
                                .join(', ')
                            }
                          >
                            Equipped: {equippedLabels.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="techniqueLibraryTrack">
                      <div className="techniqueLibraryTrackHeader">
                        <span>Mastery: {tech.masteryLevel}/100</span>
                        {nextMilestone ? (
                          <span className="techniqueLibraryTrackHint">Next: {nextMilestone.effectsSummary.join(', ')}</span>
                        ) : (
                          <span className="techniqueLibraryTrackHint">Maxed</span>
                        )}
                      </div>
                      <div className="techniqueLibraryProgressBar">
                        <div className="techniqueLibraryProgressFill" style={{ width: `${masteryValue}%` }} />
                        {[25, 50, 75, 100].map((mark) => (
                          <div
                            key={mark}
                            className={`techniqueLibraryProgressTick ${masteryValue >= mark ? 'is-reached' : ''}`}
                            style={{ left: `${mark}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="techniqueLibraryTrack">
                      <div className="techniqueLibraryTrackHeader">
                        <span>
                          Rank {tech.rank}/{rankCap}
                        </span>
                        <span className="techniqueLibraryTrackHint">
                          Fragments: {fragmentsOwned}/{fragmentsNeeded ?? '—'}
                        </span>
                      </div>
                      <div className="techniqueLibraryRankRow">
                        <div className="techniqueLibraryRankPips">
                          {Array.from({ length: rankCap }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`techniqueLibraryRankPip ${idx < tech.rank ? 'is-filled' : ''}`}
                            />
                          ))}
                        </div>
                        {canUpgradeRank && <span className="techniqueLibraryUpgradeHint">Upgrade ready</span>}
                      </div>
                    </div>

                    <div className="techniqueLibraryTrack">
                      <div className="techniqueLibraryTrackHeader">
                        <span>
                          Sub-Insights: {traitCount}/{traitInfo.effectiveSlots}
                        </span>
                        <span className="techniqueLibraryTrackHint">Reroll: 1× {rerollItemName}</span>
                      </div>
                      <div className="techniqueLibraryTraitPips">
                        {Array.from({ length: traitCount }).map((_, idx) => (
                          <div key={`trait-filled-${idx}`} className="techniqueLibraryTraitPip is-filled" />
                        ))}
                        {Array.from({ length: unlockedEmpty }).map((_, idx) => (
                          <div key={`trait-empty-${idx}`} className="techniqueLibraryTraitPip" />
                        ))}
                        {Array.from({ length: lockedSlots }).map((_, idx) => (
                          <div key={`trait-locked-${idx}`} className="techniqueLibraryTraitPip is-locked" />
                        ))}
                      </div>
                      <div className="techniqueLibraryTraitHint">
                        Rarity slots: {traitInfo.raritySlots} · Grade cap: {traitInfo.gradeCap} → {traitInfo.effectiveSlots}
                      </div>
                    </div>
                  </div>
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
                  {selectedTechDef?.path && <span className="techniqueLibraryBadge">{selectedTechDef.path}</span>}
                  {selectedTechDef?.role && <span className="techniqueLibraryBadge">{selectedTechDef.role}</span>}
                  <span className="techniqueLibraryRank">{formatRankLabel(selectedOwned?.rank ?? 1)}</span>
                </div>

                <div className="techniqueLibraryProgressGrid">
                  <div className="techniqueLibraryProgressCard">
                    <div className="techniqueLibraryProgressHeader">
                      <span>Mastery Track</span>
                      {masteryMilestoneEffects.cosmeticTitle && masteryLevel >= 100 && (
                        <span className="techniqueLibraryTrackHint">Title: {masteryMilestoneEffects.cosmeticTitle}</span>
                      )}
                    </div>
                    <div className="techniqueLibraryProgressBar">
                      <div
                        className="techniqueLibraryProgressFill"
                        style={{ width: `${Math.min(100, Math.max(0, (selectedOwned?.masteryPct ?? 0) * 100))}%` }}
                      />
                      {[25, 50, 75, 100].map((mark) => (
                        <div
                          key={mark}
                          className={`techniqueLibraryProgressTick ${masteryLevel >= mark ? 'is-reached' : ''}`}
                          style={{ left: `${mark}%` }}
                        />
                      ))}
                    </div>
                    <div className="techniqueLibraryProgressLabel">
                      Mastery {masteryLevel}/100 · Cooldown reduction: {(masteryCdr * 100).toFixed(1)}% · Cost reduction:
                      {(masteryCostReduction * 100).toFixed(1)}%
                    </div>
                    {nextMilestoneDetail && (
                      <div className="techniqueLibraryTrackHint">Next unlock: {nextMilestoneDetail.effectsSummary.join(', ')}</div>
                    )}
                  </div>

                  <div className="techniqueLibraryProgressCard">
                    <div className="techniqueLibraryProgressHeader">
                      <span>Rank Progress</span>
                      <span className="techniqueLibraryTrackHint">Cap: {rankCapSelected}</span>
                    </div>
                    <div className="techniqueLibraryRankRow">
                      <div className="techniqueLibraryRankPips">
                        {Array.from({ length: rankCapSelected || 1 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`techniqueLibraryRankPip ${idx < (selectedOwned?.rank ?? 1) ? 'is-filled' : ''}`}
                          />
                        ))}
                      </div>
                      {nextRankInfo ? (
                        <div className="techniqueLibraryTrackHint">
                          Next rank ({nextRankInfo.nextRank}): {nextRankInfo.cost.fragmentsRequired} fragments ·
                          {nextRankInfo.cost.runeDustRequired} rune dust · {nextRankInfo.cost.soulInkRequired} soul ink
                        </div>
                      ) : (
                        <div className="techniqueLibraryTrackHint">Rank cap reached for current grade.</div>
                      )}
                    </div>
                    <div className="techniqueLibraryTrackHint">
                      Fragments owned: {fragmentsOwnedSelected}/{nextRankInfo?.cost.fragmentsRequired ?? '—'}
                    </div>
                  </div>

                  <div className="techniqueLibraryProgressCard">
                    <div className="techniqueLibraryProgressHeader">
                      <span>Sub-Insights</span>
                      <span className="techniqueLibraryTrackHint">
                        Slots = min(Rarity {traitInfoSelected.raritySlots}, Grade cap {traitInfoSelected.gradeCap})
                      </span>
                    </div>
                    <div className="techniqueLibraryTraitPips">
                      {selectedTraits.map((_, idx) => (
                        <div key={`trait-detail-filled-${idx}`} className="techniqueLibraryTraitPip is-filled" />
                      ))}
                      {Array.from({ length: Math.max(traitInfoSelected.effectiveSlots - selectedTraits.length, 0) }).map(
                        (_, idx) => (
                          <div key={`trait-detail-empty-${idx}`} className="techniqueLibraryTraitPip" />
                        ),
                      )}
                      {Array.from({ length: Math.max(traitInfoSelected.raritySlots - traitInfoSelected.effectiveSlots, 0) }).map(
                        (_, idx) => (
                          <div key={`trait-detail-locked-${idx}`} className="techniqueLibraryTraitPip is-locked" />
                        ),
                      )}
                    </div>
                    <div className="techniqueLibraryTrackHint">
                      Rarity slots: {traitInfoSelected.raritySlots} · Grade cap: {traitInfoSelected.gradeCap} →
                      {traitInfoSelected.effectiveSlots}
                    </div>
                  </div>
                </div>

                <div className="techniqueLibraryDetailSection">
                  <h4>Core Art Effect</h4>
                  {primaryEffects.length ? (
                    <ul className="techniqueLibraryEffectList">
                      {summarizeEffects(primaryEffects).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{effectText}</p>
                  )}
                </div>

                <div className="techniqueLibraryDetailSection">
                  <h4>Secondary Effect</h4>
                  {masteryLevel >= 75 ? (
                    secondaryEffects.length ? (
                      <ul className="techniqueLibraryEffectList">
                        {summarizeEffects(secondaryEffects).map((line) => (
                          <li key={line}>
                            <em>(Secondary)</em> {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No secondary effects defined.</p>
                    )
                  ) : (
                    <p>Secondary effect locked until Mastery 75.</p>
                  )}
                  {selectedOwned?.grade === 'heaven' && masteryLevel >= 75 && (
                    <div className="techniqueLibraryTrackHint">
                      Heaven bonus: Secondary potency +{(((heavenBonus as number | undefined) ?? 0.25) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                <div className="techniqueLibraryDetailSection">
                  <h4>Sub-Insights (Traits)</h4>
                  {selectedTraits.length === 0 ? <p>No traits yet.</p> : null}
                  {selectedTraits.map((trait, idx) => {
                    const def = getTraitDefinition(trait.id);
                    const range = getTraitRollRangeLabel(trait.id);
                    const quality = getTraitQualityPct(trait);
                    const label = def?.name || def?.label || trait.id;
                    const valuePct = trait.value ?? trait.valuePct ?? 0;
                    return (
                      <div key={`${trait.id}-${idx}`} className="techniqueLibraryTraitRow">
                        <div className="techniqueLibraryTraitMain">
                          <div className="techniqueLibraryTraitName">{label}</div>
                          <div className="techniqueLibraryTraitValue">{(valuePct * 100).toFixed(1)}%</div>
                          <div className="techniqueLibraryTraitRange">{range}</div>
                        </div>
                        <div className="techniqueLibraryTraitQuality">
                          <div className="techniqueLibraryTraitQualityBar">
                            <div className="techniqueLibraryTraitQualityFill" style={{ width: `${quality * 100}%` }} />
                          </div>
                          <label className="techniqueLibraryTraitLock">
                            <input
                              type="radio"
                              name="traitLock"
                              checked={lockTraitIndex === idx}
                              onChange={() => {
                                setLockTraitIndex(idx);
                                setLockEnabled(true);
                              }}
                            />
                            Lock this trait
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  <div className="techniqueLibraryTraitActions">
                    <label className="techniqueLibraryToggle">
                      <input
                        type="checkbox"
                        checked={lockEnabled}
                        onChange={(e) => setLockEnabled(e.target.checked)}
                        disabled={selectedTraits.length === 0}
                      />
                      Lock 1 trait (+1 {rerollItemName})
                    </label>
                    <button className="techniqueLibraryPrimaryButton" onClick={handleRerollTraits} disabled={!selectedTraits.length}>
                      Reroll Sub-Insights (Cost: {rerollCostQty}× {rerollItemName})
                    </button>
                  </div>
                </div>

                <div className="techniqueLibraryDetailSection">
                  <h4>Runes</h4>
                  <div className="techniqueLibraryRuneSockets">
                    {runeDisplay.map((runeId, idx) => (
                      <div key={`rune-${idx}`} className="techniqueLibraryRuneRow">
                        <div className="techniqueLibraryRuneSlotLabel">Socket {idx + 1}</div>
                        <div className={`techniqueLibraryRunePill ${runeId ? 'is-filled' : ''}`}>
                          {runeId ? itemsById[runeId]?.name ?? runeId : 'Empty'}
                        </div>
                        <select
                          value={runeSelections[idx] ?? ''}
                          onChange={(e) => setRuneSelections((prev) => ({ ...prev, [idx]: e.target.value }))}
                        >
                          <option value="">Select Rune</option>
                          {availableRunes.map((rune) => (
                            <option key={rune.id} value={rune.id} disabled={rune.qty <= 0}>
                              {rune.name} ({rune.qty})
                            </option>
                          ))}
                        </select>
                        <button className="techniqueLibrarySecondaryButton" onClick={() => handleSocketRune(idx)}>
                          Socket
                        </button>
                        {runeId && (
                          <button className="techniqueLibraryLinkButton" onClick={() => handleUnsocketRune(idx)}>
                            Unsocket
                          </button>
                        )}
                      </div>
                    ))}
                    {runeSlots === 0 && <div className="techniqueLibraryTrackHint">No rune sockets for this grade.</div>}
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
