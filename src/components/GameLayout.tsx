import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { CultivateScreen } from './screens/CultivateScreen.js';
import { StatusScreen } from './screens/StatusScreen.js';
import { WorldScreen } from './screens/WorldScreen.js';
import InventoryScreen from './screens/InventoryScreen.js';
import { PrestigeScreen } from './screens/PrestigeScreen.js';
import { OfflineProgressModal } from './modals/OfflineProgressModal.js';
import { ManualSatchelModal } from './modals/ManualSatchelModal.js';
import { TechniqueLearnedModal } from './modals/TechniqueLearnedModal.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SystemStatusPanelOverlay } from '../app/overlays/SystemStatusPanel.js';
import { CombatPresentationHost } from '../app/overlays/CombatPresentationHost.js';
import { TechniqueLibraryScreen } from './screens/TechniqueLibraryScreen.js';
import { LifeStartWizardModal } from './modals/LifeStartWizardModal.js';
import { NotificationToasts } from './NotificationToasts.js';
import { FxQualityProvider } from '../ui/fx/FxQualityProvider.js';
import { CityArrivalBanner } from './system/CityArrivalBanner.js';
import { BottomTabBar } from './BottomTabBar.js';
import { WorldBuildingModal } from './modals/WorldBuildingModal.js';
import { isApothecaryExactFixtureRouteEnabled } from '../features/apothecary/exact/index.js';
import { isCultivationExactQueryModeEnabled } from '../features/cultivation/exact/cultivationExactPresentation.js';
import { PavilionScreenOwner, isPavilionExactFixtureRouteEnabled } from '../features/pavilion/index.js';
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
import { SectionCAuditHarness, isSectionCAuditQueryEnabled } from '../dev/sectionCAudit/SectionCAuditHarness.js';
import { Phase0CoreAuditHarness, isPhase0CoreAuditQueryEnabled } from '../dev/phase0CoreAudit/Phase0CoreAuditHarness.js';
import { Phase6CombatAuditHarness, isPhase6CombatAuditQueryEnabled } from '../dev/phase6CombatAudit/Phase6CombatAuditHarness.js';
import { isLifeStartWizardRequired } from '../systems/ui/lifeStart/lifeStartWizardContract.js';
import './GameLayout.scss';

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

  useEffect(() => {
    setHeaderTitles('Technique Library', 'Equip techniques, view mastery, and manage loadouts');
  }, [setHeaderTitles]);

  return <TechniqueLibraryScreen />;
}

/**
 * Main game layout component
 */
export function GameLayout() {
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
  const currentChapterExhaustedAcknowledgedThisLife = useUIStore((state) => state.currentChapterExhaustedAcknowledgedThisLife);
  const openCurrentChapterExhaustedModal = useUIStore((state) => state.openCurrentChapterExhaustedModal);
  const clearCurrentChapterExhaustedAcknowledgement = useUIStore((state) => state.clearCurrentChapterExhaustedAcknowledgement);
  const setLifeStartWizardOpenForNotifications = useUIStore((state) => state.setLifeStartWizardOpenForNotifications);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const realmIndex = useGameStore((state) => state.realm.index);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const resetOnboardingLifeState = useUIStore((state) => state.resetOnboardingLifeState);
  const layoutBackgroundOverride = useUIStore((state) => state.layoutBackgroundOverride);
  const fixtureCityId = useContentStore((state) => (
    state.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : state.citiesSorted[0]?.id ?? null
  ));
  const isScrollable = activeTab === 'status';
  const lastPrestigeCountRef = useRef(prestigeCount);
  const fixtureRouteOpenedRef = useRef(false);
  const apothecaryExactFixtureRouteEnabled = isApothecaryExactFixtureRouteEnabled();
  const apothecaryExactModalOpen = showWorldBuildingModal && (worldBuildingModalKey === 'apothecary' || worldBuildingModalKey === 'alchemy');
  const suppressApothecaryExactFixtureChrome = apothecaryExactFixtureRouteEnabled && apothecaryExactModalOpen;
  const suppressCultivationExactQueryChrome = activeTab === 'cultivation' && isCultivationExactQueryModeEnabled();
  const pavilionExactFixtureRouteEnabled = isPavilionExactFixtureRouteEnabled();
  const suppressPavilionChrome = activeTab === 'records';
  const suppressExactCaptureChrome = suppressApothecaryExactFixtureChrome || suppressCultivationExactQueryChrome || suppressPavilionChrome;

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
    showLifeSummaryModal,
    showMigrationIssuesModal,
  ]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
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
    activeTab === 'cultivation' ? 'gameLayoutRoot--cultivation' : '',
    activeTab === 'adventure' ? 'gameLayoutRoot--world' : '',
    activeTab === 'techniques' ? 'gameLayoutRoot--techniques' : '',
    activeTab === 'records' ? 'gameLayoutRoot--records gameLayoutRoot--pavilion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showLayoutBackgroundOverlay = activeTab === 'adventure' && !!layoutBackgroundOverride;
  const lifeStartWizardOpen = isLifeStartWizardRequired({
    selectedPath,
    selectedHeartLawId,
  });
  const showSectionCAuditHarness = isSectionCAuditQueryEnabled();
  const showPhase0CoreAuditHarness = isPhase0CoreAuditQueryEnabled();
  const showPhase6CombatAuditHarness = isPhase6CombatAuditQueryEnabled();

  useEffect(() => {
    setLifeStartWizardOpenForNotifications(lifeStartWizardOpen);
  }, [lifeStartWizardOpen, setLifeStartWizardOpenForNotifications]);

  return (
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
        <div className={`gameLayoutContent ${isScrollable ? 'gameLayoutContent--scrollable' : ''}`}>
          {renderContent()}
        </div>

        {!apothecaryExactFixtureRouteEnabled && !suppressPavilionChrome && <BottomTabBar />}

        {showOfflineProgressModal && showOfflineModalSetting && !suppressExactCaptureChrome && <OfflineProgressModal />}
        {showManualSatchelModal && !suppressExactCaptureChrome && <ManualSatchelModal />}
        {showTechniqueLearnedModal && !suppressExactCaptureChrome && <TechniqueLearnedModal />}
        {showWorldBuildingModal && <WorldBuildingModal />}
        {showCurrentChapterExhaustedModal && !suppressExactCaptureChrome && <CurrentChapterExhaustedModal />}
        {showLifeSummaryModal && !suppressExactCaptureChrome && <LifeSummaryModal />}
        {showMigrationIssuesModal && !suppressExactCaptureChrome && <MigrationIssuesModal />}
        {showSystemStatusOverlay && activeTab !== 'cultivation' && !apothecaryExactModalOpen && !suppressExactCaptureChrome && <SystemStatusPanelOverlay />}
        <CombatPresentationHost />
        {!suppressExactCaptureChrome && <OnboardingPromptRuntime />}
        {!suppressExactCaptureChrome && <LifeStartWizardModal />}
        {!suppressExactCaptureChrome && <CityArrivalBanner />}
        {!suppressExactCaptureChrome && <OnboardingPromptHost />}
        {!suppressExactCaptureChrome && <NotificationToasts />}
        {showSectionCAuditHarness ? <SectionCAuditHarness /> : null}
        {showPhase0CoreAuditHarness ? <Phase0CoreAuditHarness /> : null}
        {showPhase6CombatAuditHarness ? <Phase6CombatAuditHarness /> : null}
      </div>
    </FxQualityProvider>
  );
}
