import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
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
import type { CastingPolicy, EquipResult, SlotType } from '../../stores/techniqueStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useUIStore } from '../../stores/uiStore';
import { TechniqueDetailModal } from '../modals/TechniqueDetailModal';
import {
  TechniqueFilterDrawer,
  type GradeFilter,
  type SortKey,
  type TypeFilter,
} from '../modals/TechniqueFilterDrawer';
import { getPathIcon, getTierIcon, getTypeIcon, resolveTechniqueType } from '../../features/manuals/manualIconMap';
import { TechniqueSpine } from '../techniques/TechniqueSpine';
import { InnerPalaceEquipAltar, type InnerPalaceFeedback, type InnerPalaceSlot } from '../techniques/InnerPalaceEquipAltar';
import { InkPanel, PaperCard } from '../../ui/ink';
import { GameIcon } from '../../ui/icons';
import './TechniqueLibraryScreen.scss';

type SlotSelection = { type: SlotType; index: number };

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

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const slotLabel = (slot: SlotSelection) => {
  if (slot.type === 'ultimate') return 'Ultimate';
  const numeral = romanNumerals[slot.index] ?? `${slot.index + 1}`;
  return `${slot.type === 'active' ? 'Active' : 'Passive'} ${numeral}`;
};

const rarityLabel = (value?: string) => {
  const safe = value ?? 'unknown';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};
const gradeLabel = (value?: string) => {
  const safe = value ?? 'unknown';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};

const gradeOrder: string[] = ['mortal', 'earth', 'heaven', 'mystic'];
const rarityOrder: string[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const castingPolicies: CastingPolicy[] = ['aggressive', 'balanced', 'defensive'];

const formatRankLabel = (rank: number) => `Rank ${rank}`;

export function TechniqueLibraryScreen() {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection>({ type: 'active', index: 0 });
  const [altarFeedback, setAltarFeedback] = useState<InnerPalaceFeedback | null>(null);
  const [altarFlashSlot, setAltarFlashSlot] = useState<{ key: string; tone: 'equip' | 'unequip' } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('power');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pathFilter, setPathFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIntent, setDetailIntent] = useState<'upgradeRank' | 'rerollTraits' | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const detailCloseRef = useRef<HTMLButtonElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  // Select stable slices individually to avoid recreating snapshots (React 19 external-store loop safeguard).
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const setCastingPolicy = useTechniqueStore((state) => state.setCastingPolicy);
  const equipTechnique = useTechniqueStore((state) => state.equipTechnique);
  const getSlotProgressionSnapshot = useTechniqueStore((state) => state.getSlotProgressionSnapshot);
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const isContentLoading = useContentStore((state) => state.isLoading);
  const realmIndex = useGameStore((state) => state.realm.index);
  const techniqueLibraryIntent = useUIStore((state) => state.techniqueLibraryIntent);
  const techniqueFocusRequest = useUIStore((state) => state.techniqueFocusRequest);
  const clearTechniqueLibraryIntent = useUIStore((state) => state.clearTechniqueLibraryIntent);
  const clearTechniqueFocusRequest = useUIStore((state) => state.clearTechniqueFocusRequest);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const progression = useMemo(
    () => getSlotProgressionSnapshot(realmIndex),
    [getSlotProgressionSnapshot, realmIndex],
  );

  const selectedLoadout = useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? loadouts[0],
    [loadouts, selectedLoadoutId],
  );

  const selectedCastingPolicy: CastingPolicy = selectedLoadout?.castingPolicy ?? 'balanced';

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
      const realmName = progression.unlockRequirements.ultimate?.realmName || getLiveRealmNameByIndex(3);
      setAltarFeedback({
        tone: 'error',
        message: `You learned an Ultimate technique, but the Ultimate slot is locked until ${realmName}.`,
      });
    } else if (preferred === 'active' && unlockedCounts.active <= 0) {
      const realmName = progression.unlockRequirements.active[0]?.realmName || getLiveRealmNameByIndex(1);
      setAltarFeedback({ tone: 'error', message: `No active slots are available yet. Unlocks at: ${realmName}.` });
    } else if (preferred === 'passive' && unlockedCounts.passive <= 0) {
      const realmName = progression.unlockRequirements.passive[0]?.realmName || getLiveRealmNameByIndex(2);
      setAltarFeedback({ tone: 'error', message: `No passive slots are available yet. Unlocks at: ${realmName}.` });
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

  const handleManualPavilionNavigation = useCallback(() => {
    setActiveTab('adventure');
  }, [setActiveTab]);

  const handleEquipTechnique = useCallback(
    (slotType: SlotType, slotIndex: number, techId: string): EquipResult =>
      equipTechnique(slotType, slotIndex, techId, selectedLoadout?.id),
    [equipTechnique, selectedLoadout?.id],
  );

  const handleUnequipTechnique = useCallback(
    (slotType: SlotType, slotIndex: number): EquipResult =>
      equipTechnique(slotType, slotIndex, '', selectedLoadout?.id),
    [equipTechnique, selectedLoadout?.id],
  );

  const slotConfigs = useMemo<InnerPalaceSlot[]>(() => {
    const slots: InnerPalaceSlot[] = [];
    const activeCount = progression.displayed.active;
    const passiveCount = progression.displayed.passive;

    Array.from({ length: activeCount }).forEach((_, index) => {
      const techId = selectedLoadout?.slots.active[index] ?? '';
      const requirement = progression.unlockRequirements.active[index];
      slots.push({
        key: `active-${index}`,
        label: slotLabel({ type: 'active', index }),
        accepts: 'active',
        slotType: 'active',
        slotIndex: index,
        techId: techId || null,
        isUnlocked: index < progression.unlocked.active,
        unlockLabel: requirement?.realmName ? `Unlocks at ${requirement.realmName}` : undefined,
      });
    });

    Array.from({ length: passiveCount }).forEach((_, index) => {
      const techId = selectedLoadout?.slots.passive[index] ?? '';
      const requirement = progression.unlockRequirements.passive[index];
      slots.push({
        key: `passive-${index}`,
        label: slotLabel({ type: 'passive', index }),
        accepts: 'passive',
        slotType: 'passive',
        slotIndex: index,
        techId: techId || null,
        isUnlocked: index < progression.unlocked.passive,
        unlockLabel: requirement?.realmName ? `Unlocks at ${requirement.realmName}` : undefined,
      });
    });

    slots.push({
      key: 'ultimate-0',
      label: 'Ultimate',
      accepts: 'ultimate',
      slotType: 'ultimate',
      slotIndex: 0,
      techId: selectedLoadout?.slots.ultimate ?? null,
      isUnlocked: progression.unlocked.ultimate,
      unlockLabel: progression.unlockRequirements.ultimate?.realmName
        ? `Unlocks at ${progression.unlockRequirements.ultimate.realmName}`
        : undefined,
    });

    return slots;
  }, [
    progression.displayed.active,
    progression.displayed.passive,
    progression.unlockRequirements.active,
    progression.unlockRequirements.passive,
    progression.unlockRequirements.ultimate,
    progression.unlocked.active,
    progression.unlocked.passive,
    progression.unlocked.ultimate,
    selectedLoadout?.slots.active,
    selectedLoadout?.slots.passive,
    selectedLoadout?.slots.ultimate,
  ]);

  const selectedSlotKey = `${selectedSlot.type}-${selectedSlot.index}`;
  const highlightedTechId = detailOpen ? selectedTechniqueId : null;

  const selectedTechDef = selectedTechniqueId ? techniquesById[selectedTechniqueId] : undefined;
  const selectedType = techniqueType(selectedTechDef);
  const selectedRank = selectedOwned?.rank ?? 1;
  const selectedTierValue = selectedTechDef?.tier ?? selectedOwned?.def?.tier ?? null;
  const selectedTier = selectedTierValue ? normalizeGrade(selectedTierValue) : 'unknown';
  const selectedRarityValue = selectedTechDef?.rarity ?? selectedOwned?.def?.rarity ?? null;
  const selectedRarity = selectedRarityValue ? normalizeRarity(selectedRarityValue) : 'unknown';
  const summaryCooldown = selectedTechDef?.cooldownSec ? `${selectedTechDef.cooldownSec}s cooldown` : 'No cooldown';
  const summaryRole = selectedTechDef?.role ? `${selectedTechDef.role} role` : `${selectedType} technique`;
  const summaryLine = selectedTechDef ? `Rank ${selectedRank} • ${summaryCooldown} • ${summaryRole}` : '';
  const selectedTierIcon = selectedTierValue
    ? getTierIcon(selectedTier)
    : { iconText: '◎', label: 'Unknown Tier', key: 'unknown' };
  const selectedPathIcon = getPathIcon(selectedTechDef?.path ?? 'unknown');
  const selectedTypeIcon = getTypeIcon(resolveTechniqueType(selectedTechDef));

  const hasActiveFilters =
    sortKey !== 'power' ||
    typeFilter !== 'all' ||
    pathFilter !== 'all' ||
    roleFilter !== 'all' ||
    gradeFilter !== 'all' ||
    favoritesOnly;

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
        <PaperCard className="techShelfRowRail" variant="tray">
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
                      setDetailIntent(null);
                      setAltarFeedback(null);
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
        </PaperCard>
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
            <InkPanel variant="techniques" className="techniqueLibraryPanel">
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
            </InkPanel>
          </div>
        </section>

        <section className="techLibraryStage">
          <div className="techniqueLibraryColumn techniqueLibraryColumn--center">
            <InkPanel variant="techniques" className="techniqueLibraryPanel techniqueLibraryPanel--owned" watermark>
              <div className="techniqueLibraryPanelHeader techniqueLibraryPanelHeader--row">
                <span>Owned Techniques</span>
                <button
                  ref={filterButtonRef}
                  type="button"
                  className="techniqueLibraryFilterButton"
                  data-active={hasActiveFilters ? 'true' : 'false'}
                  onClick={() => setFilterDrawerOpen(true)}
                >
                  ⌁ Filters
                </button>
              </div>
              <div className="techShelfWall">
                {isContentLoading ? (
                  <PaperCard className="techniqueLibraryEmptyState" variant="tray">
                    <div className="techniqueLibraryEmptyStateIcon" aria-hidden="true">
                      <GameIcon icon="hourglassProgress" size={24} decorative />
                    </div>
                    Loading techniques...
                  </PaperCard>
                ) : ownedTechniques.length === 0 ? (
                  <PaperCard className="techniqueLibraryEmptyState" variant="tray">
                    <div className="techniqueLibraryEmptyStateIcon" aria-hidden="true">
                      <GameIcon icon="bookHeaven" size={24} decorative />
                    </div>
                    <p>
                      No techniques learned yet. Buy a Manual in the Manual Pavilion, then Study it to learn the
                      Technique.
                    </p>
                    <button className="techniqueLibraryLinkButton" onClick={handleManualPavilionNavigation}>
                      Go to Manual Pavilion
                    </button>
                  </PaperCard>
                ) : filteredTechniques.length === 0 ? (
                  <PaperCard className="techniqueLibraryEmptyState" variant="tray">
                    <div className="techniqueLibraryEmptyStateIcon" aria-hidden="true">
                      <GameIcon icon="inkWip" size={24} decorative />
                    </div>
                    No techniques match the current filters.
                  </PaperCard>
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
            </InkPanel>
          </div>
        </section>

        <aside className="techInspectorDock">
          <div className="techniqueLibraryColumn techniqueLibraryColumn--right">
            <InkPanel variant="techniques" className="techniqueLibraryPanel techniqueLibraryPanel--altar">
              <InnerPalaceEquipAltar
                slots={slotConfigs}
                selectedTechId={selectedTechniqueId}
                selectedSlotKey={selectedSlotKey}
                highlightedTechId={highlightedTechId}
                flashSlot={altarFlashSlot}
                techniquesById={techniquesById}
                onRequestViewTech={(techId) => {
                  setSelectedTechniqueId(techId);
                  setDetailIntent(null);
                  setDetailOpen(true);
                }}
                onRequestEquip={handleEquipTechnique}
                onRequestUnequip={handleUnequipTechnique}
                onSelectSlot={(slotType, slotIndex) => setSelectedSlot({ type: slotType, index: slotIndex })}
                onClearSelectedTech={() => setSelectedTechniqueId(null)}
                feedback={altarFeedback}
                onFeedback={setAltarFeedback}
              />
            </InkPanel>
            <PaperCard className="techniqueLibraryPanel techniqueLibraryPanel--summary" variant="tray">
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
                          {selectedTierIcon.iconText ?? '◎'}
                        </span>
                        {selectedPathIcon.iconId ? (
                          <span
                            className="techniqueLibrarySummaryIcon"
                            role="img"
                            aria-label={selectedPathIcon.label}
                            title={selectedPathIcon.label}
                          >
                            <GameIcon icon={selectedPathIcon.iconId} size={14} decorative />
                          </span>
                        ) : null}
                        {selectedTypeIcon.iconId ? (
                          <span
                            className="techniqueLibrarySummaryIcon"
                            role="img"
                            aria-label={selectedTypeIcon.label}
                            title={selectedTypeIcon.label}
                          >
                            <GameIcon icon={selectedTypeIcon.iconId} size={14} decorative />
                          </span>
                        ) : null}
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
            </PaperCard>
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
        onSlotPulse={(slot, action) => {
          const key = `${slot.type}-${slot.index}`;
          setAltarFlashSlot(null);
          window.requestAnimationFrame(() => setAltarFlashSlot({ key, tone: action }));
        }}
      />
      <TechniqueFilterDrawer
        open={filterDrawerOpen}
        sortKey={sortKey}
        typeFilter={typeFilter}
        pathFilter={pathFilter}
        roleFilter={roleFilter}
        gradeFilter={gradeFilter}
        favoritesOnly={favoritesOnly}
        uniquePaths={uniquePaths}
        uniqueRoles={uniqueRoles}
        onSortChange={setSortKey}
        onTypeFilterChange={setTypeFilter}
        onPathFilterChange={setPathFilter}
        onRoleFilterChange={setRoleFilter}
        onGradeFilterChange={setGradeFilter}
        onFavoritesChange={setFavoritesOnly}
        onReset={resetFilters}
        onClose={() => setFilterDrawerOpen(false)}
        triggerRef={filterButtonRef}
      />
    </div>
  );
}
