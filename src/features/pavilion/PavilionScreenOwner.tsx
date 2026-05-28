import { useMemo, useRef } from 'react';

import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useEquipmentStore } from '../../stores/equipmentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore.js';
import { useTechniqueStore } from '../../stores/techniqueStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { usePavilionStore } from '../../stores/pavilionStore.js';
import { buildPavilionSurface } from './buildPavilionSurface.js';
import { getPavilionExactFixtureEntryId, isPavilionExactFixtureRouteEnabled, PAVILION_DEFAULT_ENTRY_ID } from './pavilionPresentation.js';
import { PavilionExactScreen } from './PavilionExactScreen.js';
import { executePavilionRouteAction } from './pavilionRouteActions.js';
import type { PavilionRouteButtonSurface, PavilionRuntimeSnapshot, PavilionSaveState } from './pavilionTypes.js';
import { PERF_LABELS, time } from '../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../services/performance/perfReact.js';
import './PavilionExactScreen.scss';

function pathLabel(path: string | null): string {
  if (path === 'heaven') return 'Heaven Path';
  if (path === 'earth') return 'Earth Path';
  if (path === 'martial') return 'Martial Path';
  return 'No Path Selected';
}

export function PavilionScreenOwner() {
  useRenderCounter(PERF_LABELS.renderPavilionScreenOwner);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const rawContent = useContentStore((state) => state.raw);
  const contentVersion = useContentStore((state) => state.contentVersion);
  const maps = useContentStore((state) => state.maps);
  const citiesSorted = useContentStore((state) => state.citiesSorted);
  const realm = useGameStore((state) => state.realm);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const cityModules = useCityStore((state) => {
    const cityId = state.currentCityId;
    return cityId ? useContentStore.getState().maps.citiesById[cityId]?.modules ?? [] : [];
  });
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const pouchVersion = useMedicinePouchStore((state) => state.pouchVersion);
  const medicineWeak = useMedicinePouchStore((state) =>
    !Object.values(state.slots).some((slot) => slot.equippedItemId),
  );
  const equipmentVersion = useEquipmentStore((state) => state.equipmentVersion);
  const weaponFloorClose = useEquipmentStore((state) => Boolean(state.equippedWeaponId));
  const selectedEntryId = usePavilionStore((state) => state.selectedEntryId);
  const selectedCategoryId = usePavilionStore((state) => state.selectedCategoryId);
  const searchQuery = usePavilionStore((state) => state.searchQuery);
  const activeFilters = usePavilionStore((state) => state.activeFilters);
  const stateByEntryId = usePavilionStore((state) => state.stateByEntryId);
  const seenEntryIds = usePavilionStore((state) => state.seenEntryIds);
  const recordedEntryIds = usePavilionStore((state) => state.recordedEntryIds);
  const studiedEntryIds = usePavilionStore((state) => state.studiedEntryIds);
  const masteredEntryIds = usePavilionStore((state) => state.masteredEntryIds);
  const pinnedEntryIds = usePavilionStore((state) => state.pinnedEntryIds);
  const recentEntryIds = usePavilionStore((state) => state.recentEntryIds);
  const dismissedGuidanceIds = usePavilionStore((state) => state.dismissedGuidanceIds);
  const priorLifeAnnotations = usePavilionStore((state) => state.priorLifeAnnotations);
  const entryUnlockVersion = usePavilionStore((state) => state.entryUnlockVersion);
  const jadeSlipEntryId = usePavilionStore((state) => state.jadeSlipEntryId);
  const selectEntry = usePavilionStore((state) => state.selectEntry);
  const selectCategory = usePavilionStore((state) => state.selectCategory);
  const setSearchQuery = usePavilionStore((state) => state.setSearchQuery);
  const toggleFilter = usePavilionStore((state) => state.toggleFilter);
  const openJadeSlip = usePavilionStore((state) => state.openJadeSlip);
  const closeJadeSlip = usePavilionStore((state) => state.closeJadeSlip);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const addNotification = useUIStore((state) => state.addNotification);
  const mode = isPavilionExactFixtureRouteEnabled() ? 'fixture' : 'live';
  const fixtureEntryId = mode === 'fixture' ? getPavilionExactFixtureEntryId() : null;

  const pavilionSave = useMemo<PavilionSaveState>(() => ({
    selectedEntryId: fixtureEntryId ?? selectedEntryId,
    selectedCategoryId,
    searchQuery,
    activeFilters,
    stateByEntryId,
    seenEntryIds,
    recordedEntryIds,
    studiedEntryIds,
    masteredEntryIds,
    pinnedEntryIds,
    recentEntryIds,
    dismissedGuidanceIds,
    priorLifeAnnotations,
    entryUnlockVersion,
  }), [
    activeFilters,
    dismissedGuidanceIds,
    entryUnlockVersion,
    fixtureEntryId,
    masteredEntryIds,
    pinnedEntryIds,
    priorLifeAnnotations,
    recentEntryIds,
    recordedEntryIds,
    searchQuery,
    seenEntryIds,
    selectedCategoryId,
    selectedEntryId,
    stateByEntryId,
    studiedEntryIds,
  ]);

  const runtime = useMemo<PavilionRuntimeSnapshot>(() => {
    const city = currentCityId ? maps.citiesById[currentCityId] : citiesSorted[0] ?? null;
    const heartLaw = selectedHeartLawId ? maps.heartLawsById[selectedHeartLawId] : null;
    const loadoutComplete = Boolean(selectedLoadoutId);
    const milestone = realm.name === 'Qi Condensation' && realm.substage >= 4
      ? 'Prepare Foundation Gate'
      : 'Open Current Milestone';

    return {
      realm: realm.name,
      path: pathLabel(selectedPath),
      heartLaw: heartLaw?.name ?? 'No Heart Law Selected',
      city: city?.name ?? 'No City Available',
      milestone,
      currentCityId: city?.id ?? null,
      cityModules,
      recommendedEntryIds: [PAVILION_DEFAULT_ENTRY_ID],
      medicineWeak,
      weaponFloorClose,
      loadoutComplete,
      priorLifeNotes: pavilionSave.priorLifeAnnotations,
      missingRuntimeData: [
        ...(heartLaw ? [] : ['Heart Law not selected.']),
        ...(city ? [] : ['Current city unavailable.']),
      ],
    };
  }, [
    cityModules,
    citiesSorted,
    currentCityId,
    equipmentVersion,
    maps.citiesById,
    maps.heartLawsById,
    medicineWeak,
    pavilionSave.priorLifeAnnotations,
    pouchVersion,
    realm.name,
    realm.substage,
    selectedHeartLawId,
    selectedLoadoutId,
    selectedPath,
    weaponFloorClose,
  ]);

  const manifest = rawContent?.pavilion_records ?? null;
  const surface = useMemo(() => {
    if (!manifest) return null;
    return time(PERF_LABELS.surfacePavilion, () => buildPavilionSurface({
      mode,
      manifest,
      content: rawContent,
      pavilionState: pavilionSave,
      runtime,
      contentVersion,
      jadeSlipEntryId,
    }));
  }, [contentVersion, jadeSlipEntryId, manifest, mode, pavilionSave, rawContent, runtime]);

  if (!surface) {
    return (
      <PerfProfiler id={PERF_LABELS.renderPavilionScreenOwner}>
      <section className="pavilionExact pavilionExact--loading" data-testid="pavilion-exact-page">
        <div className="pavilionExact__loading">Consulting the Records...</div>
      </section>
      </PerfProfiler>
    );
  }

  const routeContext = {
    currentCityId: runtime.currentCityId,
    cityModules: runtime.cityModules,
    setActiveTab,
    openWorldBuildingModal,
    focusSearch: () => searchRef.current?.focus(),
    selectEntry,
    targetEntryId: runtime.recommendedEntryIds[0] ?? PAVILION_DEFAULT_ENTRY_ID,
  };

  const handleRoute = (button: PavilionRouteButtonSurface) => {
    const result = executePavilionRouteAction(button, routeContext);
    if (!result.ok) {
      addNotification('warning', result.reason ?? 'Route unavailable.');
    }
  };

  return (
    <PerfProfiler id={PERF_LABELS.renderPavilionScreenOwner}>
    <PavilionExactScreen
      surface={surface}
      searchInputRef={searchRef}
      onSelectCategory={selectCategory}
      onSelectEntry={selectEntry}
      onSearchChange={setSearchQuery}
      onToggleFilter={toggleFilter}
      onRoute={handleRoute}
      onOpenJadeSlip={openJadeSlip}
      onCloseJadeSlip={closeJadeSlip}
    />
    </PerfProfiler>
  );
}
