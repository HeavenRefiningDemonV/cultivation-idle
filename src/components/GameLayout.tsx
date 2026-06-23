import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '../stores/uiStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { useCityStore } from '../stores/cityStore.js';
import { useOnboardingStore } from '../stores/onboardingStore.js';
import { useInventoryStore } from '../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../stores/medicinePouchStore.js';
import { useTechCollectionStore } from '../stores/techCollectionStore.js';
import { CultivateScreen } from './screens/CultivateScreen.js';
import { StatusScreen } from './screens/StatusScreen.js';
import { WorldScreen } from './screens/WorldScreen.js';
import InventoryScreen from './screens/InventoryScreen.js';
import { PrestigeScreen } from './screens/PrestigeScreen.js';
import { OfflineProgressModal } from './modals/OfflineProgressModal.js';
import { ManualSatchelModal } from './modals/ManualSatchelModal.js';
import { TechniqueLearnedModal } from './modals/TechniqueLearnedModal.js';
import { DaoHeartModal } from './modals/DaoHeartModal.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SystemStatusPanelOverlay } from '../app/overlays/SystemStatusPanel.js';
import { CombatPresentationHost } from '../app/overlays/CombatPresentationHost.js';
import { TechniqueLibraryScreen } from './screens/TechniqueLibraryScreen.js';
import { LifeStartWizardModal } from './modals/LifeStartWizardModal.js';
import { NotificationToasts } from './NotificationToasts.js';
import { FxQualityProvider } from '../ui/fx/FxQualityProvider.js';
import { CityArrivalBanner } from './system/CityArrivalBanner.js';
import { BottomTabBar } from './BottomTabBar.js';
import { isApothecaryExactFixtureRouteEnabled } from '../features/apothecary/exact/index.js';
import { isCultivationExactQueryModeEnabled } from '../features/cultivation/exact/cultivationExactPresentation.js';
import { PavilionScreenOwner, isPavilionExactFixtureRouteEnabled } from '../features/pavilion/index.js';
import {
  TechniquesScreenOwner,
  getTechniquesExactQueryMode,
  isTechniquesExactQueryModeEnabled,
} from '../features/techniquesExact/index.js';
import { BuildingModalHost } from './modals/WorldBuildingOverlayEntry.js';
import { AudioBindings } from '../app/AudioBindings.js';
import { GameIcon } from '../ui/icons/index.js';
import { buildLiveEconomicRecommendationEngine } from '../systems/economy/economicRecommendationEngine.js';
import { getNextLiveRealm, isAtSemesterCap } from '../systems/progression/runtime/index.js';
import { useGameStore } from '../stores/gameStore.js';
import { useHeartLawStore } from '../stores/heartLawStore.js';
import { usePrestigeStore } from '../stores/prestigeStore.js';
import { CurrentChapterExhaustedModal } from './modals/CurrentChapterExhaustedModal.js';
import { LifeSummaryModal } from './modals/LifeSummaryModal.js';
import { MigrationIssuesModal } from './modals/MigrationIssuesModal.js';
import { OnboardingPromptHost } from './system/OnboardingPromptHost.js';
import { OnboardingPromptRuntime } from './system/OnboardingPromptRuntime.js';
import { MilestoneScroll } from './system/MilestoneScroll.js';
import { TutorialLedgerDrawer } from './system/TutorialLedgerDrawer.js';
import { UnlockCeremonyHost } from './system/UnlockCeremonyHost.js';
import { SectionCAuditHarness, isSectionCAuditQueryEnabled } from '../dev/sectionCAudit/SectionCAuditHarness.js';
import { Phase0CoreAuditHarness, isPhase0CoreAuditQueryEnabled } from '../dev/phase0CoreAudit/Phase0CoreAuditHarness.js';
import { Phase6CombatAuditHarness, isPhase6CombatAuditQueryEnabled } from '../dev/phase6CombatAudit/Phase6CombatAuditHarness.js';
import { P5CloseoutHarness, getP5CloseoutFixtureId } from '../dev/p5Closeout/P5CloseoutHarness.js';
import { isLifeStartWizardRequired } from '../systems/ui/lifeStart/lifeStartWizardContract.js';
import { StoryCutsceneOverlay } from '../features/story/StoryCutsceneOverlay.js';
import { useStoryStore } from '../features/story/storyStore.js';
import { useStoryTriggers } from '../features/story/useStoryTriggers.js';
import { initRunDeltaEventBridge } from '../systems/runDeltas/initRunDeltaEventBridge.js';
import { initDaoImpressionEventBridge } from '../systems/daoImpressions/index.js';
import { initFailureReflectionEventBridge } from '../systems/failureReflection/index.js';
import { initBreakthroughEchoEventBridge } from '../features/breakthroughEchoes/index.js';
import { initCombatAftermathEventBridge } from '../features/combatAftermath/index.js';
import {
  buildOnboardingTabPolicy,
  buildOnboardingWorldModulePolicy,
  buildOnboardingLedgerSurface,
  buildOnboardingMilestoneSurface,
  buildOnboardingSourceSinkGuards,
  buildOnboardingUnlockCeremonySurface,
  guardOnboardingTabRoute,
  getOnboardingMilestonesFromContent,
  initOnboardingEventBridge,
  isOnboardingExactFixtureOrCaptureModeEnabled,
  resolveOnboardingUnlocksThroughMilestone,
} from '../systems/onboarding/index.js';
import { performOnboardingRouteAction } from '../systems/onboarding/onboardingRouteActions.js';
import type { OnboardingMilestoneActionSurface } from '../systems/onboarding/onboardingMilestoneSurface.js';
import type { OnboardingUnlockCeremonySurface } from '../systems/onboarding/onboardingUnlockCeremony.js';
import { DEFERRED_WORLD_MODULES } from '../systems/world/liveWorldSchema.js';
import { PERF_LABELS } from '../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../services/performance/perfReact.js';
import './GameLayout.scss';

const EMPTY_CURRENT_CITY_MODULES: readonly string[] = Object.freeze([]);

/**
 * Placeholder content for tabs
 */
function PlaceholderContent({ tabName }: { tabName: string }) {
  return (
    <div className={'gameLayoutPlaceholder'}>
      <div className={'gameLayoutPlaceholderCard'}>
        <div className={'gameLayoutPlaceholderIcon'}>
          <GameIcon icon="inkWip" size={56} decorative />
        </div>
        <h2 className={'gameLayoutPlaceholderTitle'}>{tabName}</h2>
        <p className={'gameLayoutPlaceholderText'}>This surface is not available in the current semester.</p>
      </div>
    </div>
  );
}

/**
 * Techniques tab content
 */
function TechniquesTab() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const techniquesExactMode = getTechniquesExactQueryMode();

  useEffect(() => {
    setHeaderTitles('Techniques', 'Inner Palace Combat Form');
  }, [setHeaderTitles]);

  if (techniquesExactMode === 'legacy') {
    return <TechniqueLibraryScreen />;
  }

  return <TechniquesScreenOwner forceFixture={techniquesExactMode === 'fixture'} />;
}

/**
 * Main game layout component
 */
export function GameLayout() {
  useRenderCounter(PERF_LABELS.renderGameLayout);
  useStoryTriggers();
  const activeTab = useUIStore((state) => state.activeTab);
  const showOfflineProgressModal = useUIStore((state) => state.showOfflineProgressModal);
  const showOfflineModalSetting = useUIStore((state) => state.settings.showOfflineModal);
  const showSystemStatusOverlay = useUIStore((state) => state.settings.showSystemStatusPanel);
  const worldBuildingModalKey = useUIStore((state) => state.worldBuildingModalKey);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const showManualSatchelModal = useUIStore((state) => state.showManualSatchelModal);
  const showTechniqueLearnedModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const showCurrentChapterExhaustedModal = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const showLifeSummaryModal = useUIStore((state) => state.showLifeSummaryModal);
  const showMigrationIssuesModal = useUIStore((state) => state.showMigrationIssuesModal);
  const showTutorialLedgerDrawer = useUIStore((state) => state.showTutorialLedgerDrawer);
  const daoHeartModalOpen = useUIStore((state) => state.daoHeartModalOpen);
  const daoHeartModalInitialTab = useUIStore((state) => state.daoHeartModalInitialTab);
  const closeDaoHeartModal = useUIStore((state) => state.closeDaoHeartModal);
  const activeOnboardingPrompt = useUIStore((state) => state.activeOnboardingPrompt);
  const combatPresentationMode = useUIStore((state) => state.combatPresentation.mode);
  const currentChapterExhaustedAcknowledgedThisLife = useUIStore((state) => state.currentChapterExhaustedAcknowledgedThisLife);
  const openCurrentChapterExhaustedModal = useUIStore((state) => state.openCurrentChapterExhaustedModal);
  const clearCurrentChapterExhaustedAcknowledgement = useUIStore((state) => state.clearCurrentChapterExhaustedAcknowledgement);
  const setLifeStartWizardOpenForNotifications = useUIStore((state) => state.setLifeStartWizardOpenForNotifications);
  const openTutorialLedgerDrawer = useUIStore((state) => state.openTutorialLedgerDrawer);
  const closeTutorialLedgerDrawer = useUIStore((state) => state.closeTutorialLedgerDrawer);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const storyIntroSeen = useStoryStore((state) => Boolean(state.seenFlags.story_intro_seen));
  const activeStoryCutsceneId = useStoryStore((state) => state.activeCutsceneId);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const realmIndex = useGameStore((state) => state.realm.index);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const onboardingActiveMilestoneId = useOnboardingStore((state) => state.activeMilestoneId);
  const onboardingCompletedMilestoneIds = useOnboardingStore((state) => state.completedMilestoneIds);
  const onboardingUnlockedTabs = useOnboardingStore((state) => state.unlockedTabs);
  const onboardingUnlockedWorldModules = useOnboardingStore((state) => state.unlockedWorldModules);
  const onboardingTeaserWorldModules = useOnboardingStore((state) => state.teaserWorldModules);
  const onboardingQueuedCardIds = useOnboardingStore((state) => state.queuedTutorialCardIds);
  const onboardingSeenCardIds = useOnboardingStore((state) => state.seenTutorialCardIds);
  const onboardingLedgerEntries = useOnboardingStore((state) => state.tutorialLedgerEntries);
  const onboardingFirstLifeOnlyComplete = useOnboardingStore((state) => state.firstLifeOnlyComplete);
  const onboardingDevOverride = useOnboardingStore((state) => state.devOverride);
  const onboardingFirstOutskirtsRewardClaimedAt = useOnboardingStore((state) => state.eventFacts.firstOutskirtsRewardClaimedAt);
  const onboardingLastGateDefeat = useOnboardingStore((state) => state.eventFacts.lastGateDefeat);
  const completeOnboardingMilestone = useOnboardingStore((state) => state.completeMilestone);
  const markOnboardingCardSeen = useOnboardingStore((state) => state.markCardSeen);
  const inventoryGold = useInventoryStore((state) => state.gold);
  const medicineStockCount = useInventoryStore((state) =>
    Object.entries(state.items).reduce((total, [itemId, qty]) => total + (itemId.startsWith('cons_') ? qty : 0), 0),
  );
  const herbStockCount = useInventoryStore((state) =>
    Object.entries(state.items).reduce((total, [itemId, qty]) => total + (itemId.includes('herb') ? qty : 0), 0),
  );
  const eligibleTechniqueCount = useTechCollectionStore((state) =>
    Object.values(state.unlockedTechs).filter((entry) => entry.unlocked).length,
  );
  const pouchEquippedCount = useMedicinePouchStore((state) =>
    Object.values(state.slots).filter((slot) => Boolean(slot.equippedItemId)).length,
  );
  const resetOnboardingLifeState = useUIStore((state) => state.resetOnboardingLifeState);
  const layoutBackgroundOverride = useUIStore((state) => state.layoutBackgroundOverride);
  const onboardingContent = useContentStore((state) => state.raw);
  const currentCityModules = useContentStore((state) => {
    const city = currentCityId ? state.maps.citiesById[currentCityId] : null;
    return city?.modules ?? state.citiesSorted[0]?.modules ?? EMPTY_CURRENT_CITY_MODULES;
  });
  const fixtureCityId = useContentStore((state) => (
    state.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : state.citiesSorted[0]?.id ?? null
  ));
  const lastPrestigeCountRef = useRef(prestigeCount);
  const fixtureRouteOpenedRef = useRef(false);
  const apothecaryExactFixtureRouteEnabled = isApothecaryExactFixtureRouteEnabled();
  const apothecaryExactModalOpen = showWorldBuildingModal && (worldBuildingModalKey === 'apothecary' || worldBuildingModalKey === 'alchemy');
  const suppressApothecaryExactFixtureChrome = apothecaryExactFixtureRouteEnabled && apothecaryExactModalOpen;
  const suppressCultivationExactQueryChrome = activeTab === 'cultivation' && isCultivationExactQueryModeEnabled();
  const pavilionExactFixtureRouteEnabled = isPavilionExactFixtureRouteEnabled();
  const techniquesExactModeEnabled = isTechniquesExactQueryModeEnabled();
  const suppressPavilionChrome = activeTab === 'records';
  const suppressTechniquesExactChrome = activeTab === 'techniques' && techniquesExactModeEnabled;
  const suppressExactCaptureChrome =
    suppressApothecaryExactFixtureChrome ||
    suppressCultivationExactQueryChrome ||
    suppressPavilionChrome ||
    suppressTechniquesExactChrome;
  const lifeStartWizardOpen = isLifeStartWizardRequired({
    selectedPath,
    selectedHeartLawId,
  });
  const shouldDelayLifeStartForStory = selectedPath === null && !storyIntroSeen;
  const exactFixtureOrCaptureMode = isOnboardingExactFixtureOrCaptureModeEnabled();
  const storyOrLifeStartBlocking = lifeStartWizardOpen || shouldDelayLifeStartForStory;
  const tabPolicy = useMemo(
    () => buildOnboardingTabPolicy({
      activeMilestoneId: onboardingActiveMilestoneId,
      unlockedTabs: onboardingUnlockedTabs,
      firstLifeOnlyComplete: onboardingFirstLifeOnlyComplete,
      devOverride: onboardingDevOverride,
      isExistingAdvancedSave: realmIndex > 0,
      storyOrLifeStartBlocking,
      settingsAsUtility: true,
      exactFixtureOrCaptureMode,
      hasInventoryEvidence: typeof onboardingFirstOutskirtsRewardClaimedAt === 'number',
    }),
    [
      exactFixtureOrCaptureMode,
      onboardingActiveMilestoneId,
      onboardingDevOverride,
      onboardingFirstLifeOnlyComplete,
      onboardingFirstOutskirtsRewardClaimedAt,
      onboardingUnlockedTabs,
      realmIndex,
      storyOrLifeStartBlocking,
    ],
  );
  const activeTabGuard = guardOnboardingTabRoute({
    policy: tabPolicy,
    tab: activeTab,
    exactFixtureOrCaptureMode,
  });
  const renderedTab = activeTabGuard.allowed ? activeTab : tabPolicy.forcedFallbackTab;
  const worldModulePolicy = useMemo(
    () => buildOnboardingWorldModulePolicy({
      activeMilestoneId: onboardingActiveMilestoneId,
      completedMilestoneIds: onboardingCompletedMilestoneIds,
      unlockedWorldModules: onboardingUnlockedWorldModules,
      teaserWorldModules: onboardingTeaserWorldModules,
      selectedCityModuleKeys: currentCityModules,
      deferredWorldModuleKeys: DEFERRED_WORLD_MODULES,
      firstLifeOnlyComplete: onboardingFirstLifeOnlyComplete,
      devOverride: onboardingDevOverride,
      isExistingAdvancedSave: realmIndex > 0,
      exactFixtureOrCaptureMode,
    }),
    [
      currentCityModules,
      exactFixtureOrCaptureMode,
      onboardingActiveMilestoneId,
      onboardingCompletedMilestoneIds,
      onboardingDevOverride,
      onboardingFirstLifeOnlyComplete,
      onboardingTeaserWorldModules,
      onboardingUnlockedWorldModules,
      realmIndex,
    ],
  );
  const onboardingMilestones = useMemo(
    () => getOnboardingMilestonesFromContent(onboardingContent),
    [onboardingContent],
  );
  const sourceSinkGuards = useMemo(
    () => buildOnboardingSourceSinkGuards({
      activeMilestoneId: onboardingActiveMilestoneId,
      currentCityId,
      availableWorldModules: worldModulePolicy.availableModules,
      teaserWorldModules: worldModulePolicy.teaserModules,
      currencies: { gold: inventoryGold },
      eligibleTechniqueCount,
      medicineStockCount,
      pouchEquippedCount,
      herbStockCount,
      lastGateDefeat: onboardingLastGateDefeat,
      firstLifeOnlyComplete: onboardingFirstLifeOnlyComplete,
    }),
    [
      currentCityId,
      eligibleTechniqueCount,
      herbStockCount,
      inventoryGold,
      medicineStockCount,
      onboardingActiveMilestoneId,
      onboardingFirstLifeOnlyComplete,
      onboardingLastGateDefeat,
      pouchEquippedCount,
      worldModulePolicy.availableModules,
      worldModulePolicy.teaserModules,
    ],
  );

  useEffect(() => {
    initRunDeltaEventBridge();
    initDaoImpressionEventBridge();
    initFailureReflectionEventBridge();
    initBreakthroughEchoEventBridge();
    initCombatAftermathEventBridge();
    initOnboardingEventBridge();
  }, []);

  useEffect(() => {
    if (storyOrLifeStartBlocking || onboardingActiveMilestoneId !== 'M0_life_start') return;
    completeOnboardingMilestone('M0_life_start');
    const onboardingStore = useOnboardingStore.getState();
    onboardingStore.applyUnlocks(resolveOnboardingUnlocksThroughMilestone({
      completedMilestoneIds: onboardingStore.completedMilestoneIds,
      activeMilestoneId: onboardingStore.activeMilestoneId,
    }));
  }, [completeOnboardingMilestone, onboardingActiveMilestoneId, storyOrLifeStartBlocking]);

  useEffect(() => {
    if (activeTabGuard.allowed) return;
    const fallbackTab = activeTabGuard.fallbackTab ?? tabPolicy.forcedFallbackTab;
    if (fallbackTab === activeTab) return;
    setActiveTab(fallbackTab);
  }, [activeTab, activeTabGuard.allowed, activeTabGuard.fallbackTab, setActiveTab, tabPolicy.forcedFallbackTab]);

  useEffect(() => {
    if (prestigeCount > lastPrestigeCountRef.current) {
      resetOnboardingLifeState();
    }
    lastPrestigeCountRef.current = prestigeCount;
  }, [prestigeCount, resetOnboardingLifeState]);

  useEffect(() => {
    if (!apothecaryExactFixtureRouteEnabled || fixtureRouteOpenedRef.current || !fixtureCityId) return;
    fixtureRouteOpenedRef.current = true;
    setActiveTab('adventure');
    openWorldBuildingModal({
      cityId: fixtureCityId,
      buildingKey: 'apothecary',
      intent: { apothecaryExactMode: 'fixture', apothecaryFocus: 'prescription' },
    });
  }, [apothecaryExactFixtureRouteEnabled, fixtureCityId, openWorldBuildingModal, setActiveTab]);

  useEffect(() => {
    if (!pavilionExactFixtureRouteEnabled || activeTab === 'records') return;
    setActiveTab('records');
  }, [activeTab, pavilionExactFixtureRouteEnabled, setActiveTab]);

  useEffect(() => {
    if (!techniquesExactModeEnabled || activeTab === 'techniques') return;
    setActiveTab('techniques');
  }, [activeTab, setActiveTab, techniquesExactModeEnabled]);

  useEffect(() => {
    let atAuthoredCap = false;
    try {
      const economic = buildLiveEconomicRecommendationEngine();
      const atCapByEconomy = economic.snapshot.phase.atContentCap;
      const fallbackAtCap = isAtSemesterCap(realmIndex) && getNextLiveRealm(realmIndex) === null;
      atAuthoredCap = atCapByEconomy || fallbackAtCap;
    } catch (error) {
      const fallbackAtCap = isAtSemesterCap(realmIndex) && getNextLiveRealm(realmIndex) === null;
      atAuthoredCap = fallbackAtCap;
      console.warn('[GameLayout] Cap truth fallback used', error);
    }

    const blockedByOtherModal = showOfflineProgressModal || showManualSatchelModal || showTechniqueLearnedModal || showWorldBuildingModal || showLifeSummaryModal || showMigrationIssuesModal || lifeStartWizardOpen || activeTab === 'prestige';

    if (!atAuthoredCap) {
      clearCurrentChapterExhaustedAcknowledgement();
      return;
    }

    if (!currentChapterExhaustedAcknowledgedThisLife && !showCurrentChapterExhaustedModal && !blockedByOtherModal) {
      openCurrentChapterExhaustedModal();
    }
  }, [
    clearCurrentChapterExhaustedAcknowledgement,
    currentChapterExhaustedAcknowledgedThisLife,
    openCurrentChapterExhaustedModal,
    realmIndex,
    activeTab,
    selectedHeartLawId,
    selectedPath,
    showCurrentChapterExhaustedModal,
    showManualSatchelModal,
    showOfflineProgressModal,
    showTechniqueLearnedModal,
    showWorldBuildingModal,
    lifeStartWizardOpen,
    showLifeSummaryModal,
    showMigrationIssuesModal,
  ]);

  // Render content based on active tab
  const renderContent = () => {
    switch (renderedTab) {
      case 'cultivation':
        return <CultivateScreen />;
      case 'status':
        return <StatusScreen />;
      case 'adventure':
        return <WorldScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'techniques':
        return <TechniquesTab />;
      case 'records':
        return <PavilionScreenOwner />;
      case 'prestige':
        return <PrestigeScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <PlaceholderContent tabName="Unknown" />;
    }
  };

  const rootClassNames = [
    'gameLayoutRoot',
    renderedTab === 'cultivation' ? 'gameLayoutRoot--cultivation' : '',
    renderedTab === 'adventure' ? 'gameLayoutRoot--world' : '',
    renderedTab === 'techniques' ? 'gameLayoutRoot--techniques' : '',
    renderedTab === 'records' ? 'gameLayoutRoot--records gameLayoutRoot--pavilion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isScrollable = renderedTab === 'status';
  const showLayoutBackgroundOverlay = renderedTab === 'adventure' && !!layoutBackgroundOverride;
  const showSectionCAuditHarness = isSectionCAuditQueryEnabled();
  const showPhase0CoreAuditHarness = isPhase0CoreAuditQueryEnabled();
  const showPhase6CombatAuditHarness = isPhase6CombatAuditQueryEnabled();
  const p5CloseoutFixture = getP5CloseoutFixtureId();
  const shouldShowOfflineProgress =
    showOfflineProgressModal && showOfflineModalSetting && !suppressExactCaptureChrome;
  const shouldShowLifeStartWizard =
    lifeStartWizardOpen && !suppressExactCaptureChrome && !shouldDelayLifeStartForStory && !shouldShowOfflineProgress;
  const guidanceSuppressionReason = useMemo(() => {
    if (suppressExactCaptureChrome || exactFixtureOrCaptureMode) return 'exact_capture' as const;
    if (shouldDelayLifeStartForStory || activeStoryCutsceneId) return 'story' as const;
    if (lifeStartWizardOpen || shouldShowLifeStartWizard) return 'life_start' as const;
    if (combatPresentationMode !== 'hidden') return 'combat' as const;
    if (
      shouldShowOfflineProgress ||
      showManualSatchelModal ||
      showTechniqueLearnedModal ||
      showWorldBuildingModal ||
      daoHeartModalOpen ||
      showTutorialLedgerDrawer ||
      showCurrentChapterExhaustedModal ||
      showLifeSummaryModal ||
      showMigrationIssuesModal
    ) {
      return 'modal' as const;
    }
    return null;
  }, [
    combatPresentationMode,
    activeStoryCutsceneId,
    exactFixtureOrCaptureMode,
    lifeStartWizardOpen,
    shouldDelayLifeStartForStory,
    shouldShowLifeStartWizard,
    shouldShowOfflineProgress,
    daoHeartModalOpen,
    showCurrentChapterExhaustedModal,
    showLifeSummaryModal,
    showManualSatchelModal,
    showMigrationIssuesModal,
    showTechniqueLearnedModal,
    showTutorialLedgerDrawer,
    showWorldBuildingModal,
    suppressExactCaptureChrome,
  ]);
  const milestoneSurface = useMemo(
    () => buildOnboardingMilestoneSurface({
      milestones: onboardingMilestones,
      activeMilestoneId: onboardingActiveMilestoneId,
      tabPolicy,
      worldModulePolicy,
      currentCityId,
      suppressedReason: guidanceSuppressionReason,
      sourceSinkGuards,
    }),
    [
      currentCityId,
      guidanceSuppressionReason,
      onboardingActiveMilestoneId,
      onboardingMilestones,
      sourceSinkGuards,
      tabPolicy,
      worldModulePolicy,
    ],
  );
  const unlockCeremonySurface = useMemo(
    () => buildOnboardingUnlockCeremonySurface({
      milestones: onboardingMilestones,
      queuedCardIds: onboardingQueuedCardIds,
      seenCardIds: onboardingSeenCardIds,
      suppressed: guidanceSuppressionReason !== null || activeOnboardingPrompt !== null,
    }),
    [
      activeOnboardingPrompt,
      guidanceSuppressionReason,
      onboardingMilestones,
      onboardingQueuedCardIds,
      onboardingSeenCardIds,
    ],
  );
  const tutorialLedgerSurface = useMemo(
    () => buildOnboardingLedgerSurface({
      milestones: onboardingMilestones,
      entries: onboardingLedgerEntries,
    }),
    [onboardingLedgerEntries, onboardingMilestones],
  );
  const handleOnboardingGuidanceAction = useCallback((action: OnboardingMilestoneActionSurface) => {
    performOnboardingRouteAction({
      target: action.target,
      tabPolicy,
      worldModulePolicy,
    });
  }, [tabPolicy, worldModulePolicy]);
  const handleUnlockCeremonyDismiss = useCallback((surface: OnboardingUnlockCeremonySurface) => {
    if (surface.state !== 'active') return;
    markOnboardingCardSeen(surface.card.cardId, surface.ledgerEntry);
  }, [markOnboardingCardSeen]);
  const unlockCeremonyVisible = unlockCeremonySurface?.state === 'active';

  useEffect(() => {
    setLifeStartWizardOpenForNotifications(lifeStartWizardOpen && shouldShowLifeStartWizard);
  }, [lifeStartWizardOpen, setLifeStartWizardOpenForNotifications, shouldShowLifeStartWizard]);

  if (p5CloseoutFixture) {
    return (
      <PerfProfiler id={PERF_LABELS.renderGameLayout}>
        <FxQualityProvider>
          <P5CloseoutHarness fixture={p5CloseoutFixture} />
        </FxQualityProvider>
      </PerfProfiler>
    );
  }

  return (
    <PerfProfiler id={PERF_LABELS.renderGameLayout}>
      <FxQualityProvider>
        <div className={rootClassNames}>
          <AudioBindings />
          {showLayoutBackgroundOverlay ? (
          <div
            className="gameLayoutBackgroundOverlay"
            style={{ backgroundImage: `url(${layoutBackgroundOverride})` }}
            aria-hidden
          />
          ) : null}
          <div className="gameLayoutTextureOverlay" aria-hidden />
          <div className={`gameLayoutContent ${isScrollable ? 'gameLayoutContent--observatory' : ''}`}>
            {renderContent()}
          </div>

          {!apothecaryExactFixtureRouteEnabled && <BottomTabBar />}

          {/* M.II.3-FIDELITY E1 — DR (app-shell/onboarding-owned; NOT fixed here): the bottom-anchored
              milestone scroll overlaps the Cultivation Seat's breath-line. Suppressing it on the
              cultivation tab is NOT safe — mp3-onboarding-ui-smoke enforces it on the fresh-life
              cultivation screen (it is intended onboarding guidance, not Seat chrome). Fixing the
              overlap is an onboarding-card placement decision for the app-shell owner (e.g. raise the
              card above the breath-line band, or anchor it to a corner on this route). Left as-is. */}
          <MilestoneScroll
            surface={milestoneSurface}
            onAction={handleOnboardingGuidanceAction}
            onOpenLedger={openTutorialLedgerDrawer}
          />
          <UnlockCeremonyHost
            surface={unlockCeremonySurface}
            onAction={(target) => performOnboardingRouteAction({ target, tabPolicy, worldModulePolicy })}
            onDismiss={handleUnlockCeremonyDismiss}
          />
          <TutorialLedgerDrawer
            open={showTutorialLedgerDrawer && !suppressExactCaptureChrome}
            surface={tutorialLedgerSurface}
            onClose={closeTutorialLedgerDrawer}
          />

          {shouldShowOfflineProgress && <OfflineProgressModal />}
          {showManualSatchelModal && !suppressExactCaptureChrome && <ManualSatchelModal />}
          {showTechniqueLearnedModal && !suppressExactCaptureChrome && <TechniqueLearnedModal />}
          {showWorldBuildingModal && <BuildingModalHost />}
          {daoHeartModalOpen && !suppressExactCaptureChrome ? (
            <DaoHeartModal onClose={closeDaoHeartModal} debugInitialTab={daoHeartModalInitialTab} />
          ) : null}
          {showCurrentChapterExhaustedModal && !suppressExactCaptureChrome && <CurrentChapterExhaustedModal />}
          {showLifeSummaryModal && !suppressExactCaptureChrome && <LifeSummaryModal />}
          {showMigrationIssuesModal && !suppressExactCaptureChrome && <MigrationIssuesModal />}
          {showSystemStatusOverlay && activeTab !== 'cultivation' && !apothecaryExactModalOpen && !suppressExactCaptureChrome && <SystemStatusPanelOverlay />}
          <CombatPresentationHost />
          {!suppressExactCaptureChrome && <OnboardingPromptRuntime />}
          {shouldShowLifeStartWizard && <LifeStartWizardModal />}
          {!suppressExactCaptureChrome && activeStoryCutsceneId && <StoryCutsceneOverlay />}
          {!suppressExactCaptureChrome && <CityArrivalBanner />}
          {!suppressExactCaptureChrome && !unlockCeremonyVisible && <OnboardingPromptHost />}
          {!suppressExactCaptureChrome && <NotificationToasts />}
          {showSectionCAuditHarness ? <SectionCAuditHarness /> : null}
          {showPhase0CoreAuditHarness ? <Phase0CoreAuditHarness /> : null}
          {showPhase6CombatAuditHarness ? <Phase6CombatAuditHarness /> : null}
        </div>
      </FxQualityProvider>
    </PerfProfiler>
  );
}
