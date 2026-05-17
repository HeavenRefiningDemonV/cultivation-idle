import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TechniqueDetailModal } from '../../components/modals/TechniqueDetailModal.js';
import {
  TechniqueFilterDrawer,
  type GradeFilter,
  type SortKey,
  type TypeFilter,
} from '../../components/modals/TechniqueFilterDrawer.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useTechniqueStore, type SlotType } from '../../stores/techniqueStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type {
  TechniquesExactDetailIntent,
  TechniquesExactFeedback,
  TechniquesExactFilterId,
} from './techniquesExactTypes.js';
import { buildTechniquesExactSurfaceFromStores } from './buildTechniquesExactSurface.js';
import { TechniquesExactScreen } from './TechniquesExactScreen.js';
import { useTechniquesExactActionController } from './useTechniquesExactActionController.js';

export interface TechniquesScreenOwnerProps {
  forceFixture?: boolean;
}

const slotFromKey = (slotKey: string | null): { type: SlotType; index: number } => {
  if (!slotKey) return { type: 'active', index: 0 };
  const [type, indexRaw] = slotKey.split('-');
  if (type === 'passive' || type === 'ultimate' || type === 'active') {
    return { type, index: Math.max(0, Number.parseInt(indexRaw ?? '0', 10) || 0) };
  }
  return { type: 'active', index: 0 };
};

export function TechniquesScreenOwner({ forceFixture = false }: TechniquesScreenOwnerProps) {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<TechniquesExactFilterId>('all');
  const [feedback, setFeedback] = useState<TechniquesExactFeedback>({ tone: 'idle', message: null });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInitialAction, setDetailInitialAction] = useState<TechniquesExactDetailIntent>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ type: SlotType; index: number }>({ type: 'active', index: 0 });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('power');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pathFilter, setPathFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const loadoutSignature = useTechniqueStore((state) => [
    state.selectedLoadoutId,
    state.activeSlots,
    state.passiveSlots,
    state.loadouts.map((loadout) => [
      loadout.id,
      loadout.name,
      loadout.aiProfile,
      loadout.castingPolicy,
      loadout.slots.active.join(','),
      loadout.slots.passive.join(','),
      loadout.slots.ultimate ?? '',
    ].join(':')).join('|'),
  ].join('||'));
  const collectionSignature = useTechCollectionStore((state) => Object.entries(state.unlockedTechs)
    .map(([techId, entry]) => [
      techId,
      entry.unlocked ? '1' : '0',
      Math.floor(entry.masteryXp),
      entry.rank,
      entry.manualGrade,
      entry.rarity,
      entry.runes.join(','),
      entry.traits.map((trait) => `${trait.id}:${trait.value}`).join(','),
    ].join(':'))
    .sort()
    .join('|'));
  const contentSignature = useContentStore((state) => `${state.isLoaded ? '1' : '0'}:${Object.keys(state.maps.techniquesById).length}:${Object.keys(state.maps.citiesById).length}`);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const realmIndex = useGameStore((state) => state.realm.index);
  const techniqueLibraryIntent = useUIStore((state) => state.techniqueLibraryIntent);
  const techniqueFocusRequest = useUIStore((state) => state.techniqueFocusRequest);
  const clearTechniqueLibraryIntent = useUIStore((state) => state.clearTechniqueLibraryIntent);
  const clearTechniqueFocusRequest = useUIStore((state) => state.clearTechniqueFocusRequest);

  const surface = useMemo(() => buildTechniquesExactSurfaceFromStores({
    mode: forceFixture ? 'fixture' : 'live',
    selectedTechniqueId,
    selectedSlotKey,
    selectedFilter,
    feedback,
  }), [
    collectionSignature,
    contentSignature,
    feedback,
    forceFixture,
    loadoutSignature,
    realmIndex,
    selectedFilter,
    selectedPath,
    selectedSlotKey,
    selectedTechniqueId,
  ]);

  useEffect(() => {
    if (selectedTechniqueId !== null || !surface.meta.selectedTechniqueId) return;
    setSelectedTechniqueId(surface.meta.selectedTechniqueId);
  }, [selectedTechniqueId, surface.meta.selectedTechniqueId]);

  useEffect(() => {
    if (selectedSlotKey !== null || !surface.meta.selectedSlotKey) return;
    setSelectedSlotKey(surface.meta.selectedSlotKey);
    setSelectedSlot(slotFromKey(surface.meta.selectedSlotKey));
  }, [selectedSlotKey, surface.meta.selectedSlotKey]);

  useEffect(() => {
    if (!techniqueLibraryIntent) return;
    if (techniqueLibraryIntent.type === 'equip') {
      setSelectedTechniqueId(techniqueLibraryIntent.techniqueId);
      const preferred = surface.altar.slots.find((slot) => (
        slot.slotType === techniqueLibraryIntent.preferredSlotType &&
        slot.isUnlocked
      )) ?? surface.altar.slots.find((slot) => slot.isUnlocked);
      if (preferred) {
        setSelectedSlotKey(preferred.key);
        setSelectedSlot({ type: preferred.slotType, index: preferred.slotIndex });
      }
    }
    clearTechniqueLibraryIntent();
  }, [clearTechniqueLibraryIntent, surface.altar.slots, techniqueLibraryIntent]);

  useEffect(() => {
    if (!techniqueFocusRequest) return;
    setSelectedTechniqueId(techniqueFocusRequest.techId);
    if (techniqueFocusRequest.action === 'open' || techniqueFocusRequest.action === 'upgradeRank' || techniqueFocusRequest.action === 'rerollTraits') {
      setDetailInitialAction(techniqueFocusRequest.action === 'open' ? null : techniqueFocusRequest.action);
      setDetailOpen(true);
    }
    clearTechniqueFocusRequest();
  }, [clearTechniqueFocusRequest, techniqueFocusRequest]);

  const openDetails = useCallback((techId: string, intent?: TechniquesExactDetailIntent) => {
    setSelectedTechniqueId(techId);
    setDetailInitialAction(intent === 'open' ? null : intent ?? null);
    setDetailOpen(true);
  }, []);

  const controller = useTechniquesExactActionController({
    surface,
    selectedTechniqueId,
    selectedSlotKey,
    setSelectedTechniqueId,
    setSelectedSlotKey: (slotKey) => {
      setSelectedSlotKey(slotKey);
      setSelectedSlot(slotFromKey(slotKey));
    },
    setSelectedFilter,
    setFeedback: (nextFeedback) => setFeedback(nextFeedback),
    openDetails,
  });

  const uniquePaths = useMemo(() => Array.from(new Set(surface.ownedLibrary.rows.map((row) => row.pathLabel))).sort(), [surface.ownedLibrary.rows]);
  const uniqueRoles = useMemo(() => Array.from(new Set(surface.ownedLibrary.rows.map((row) => row.roleLabel))).sort(), [surface.ownedLibrary.rows]);

  return (
    <>
      <TechniquesExactScreen
        surface={surface}
        onSelectLoadout={controller.selectLoadout}
        onSelectAiProfile={controller.selectAiProfile}
        onSelectCastingPolicy={controller.selectCastingPolicy}
        onSelectOwnedTechnique={controller.selectOwnedTechnique}
        onSelectFilter={controller.selectFilter}
        onSelectSlot={(slotKey, slotType, slotIndex) => {
          controller.selectSlot(slotKey, slotType, slotIndex);
          setSelectedSlot({ type: slotType, index: slotIndex });
        }}
        onRequestEquip={controller.requestEquip}
        onRequestUnequip={controller.requestUnequip}
        onOpenDetails={(techId) => controller.openDetails(techId)}
        onApplyLoadout={controller.applyLoadout}
        onGoToManualPavilion={controller.goToManualPavilion}
        onOpenAdvancedFilters={() => setFilterDrawerOpen(true)}
      />
      <TechniqueDetailModal
        open={detailOpen}
        techniqueId={selectedTechniqueId}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        initialAction={detailInitialAction === 'open' ? null : detailInitialAction}
        onInitialActionHandled={() => setDetailInitialAction(null)}
        onClose={() => setDetailOpen(false)}
      />
      <button
        ref={filterButtonRef}
        type="button"
        className="techniquesExactHiddenFilterTrigger"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => setFilterDrawerOpen(true)}
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
        onReset={() => {
          setSortKey('power');
          setTypeFilter('all');
          setPathFilter('all');
          setRoleFilter('all');
          setGradeFilter('all');
          setFavoritesOnly(false);
        }}
        onClose={() => setFilterDrawerOpen(false)}
        triggerRef={filterButtonRef}
      />
    </>
  );
}
