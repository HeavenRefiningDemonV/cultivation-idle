import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore.js';
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
import { CityArrivalBanner } from './system/CityArrivalBanner.js';
import { BottomTabBar } from './BottomTabBar.js';
import { WorldBuildingModal } from './modals/WorldBuildingModal.js';
import { AudioBindings } from '../app/AudioBindings.js';
import { GameIcon } from '../ui/icons/index.js';
import { buildLiveEconomicRecommendationEngine } from '../systems/economy/economicRecommendationEngine.js';
import { getNextLiveRealm, isAtSemesterCap } from '../systems/progression/runtime/index.js';
import { useGameStore } from '../stores/gameStore.js';
import { useHeartLawStore } from '../stores/heartLawStore.js';
import { usePrestigeStore } from '../stores/prestigeStore.js';
import { CurrentChapterExhaustedModal } from './modals/CurrentChapterExhaustedModal.js';
import { OnboardingPromptHost } from './system/OnboardingPromptHost.js';
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
        <h2 className={'gameLayoutPlaceholderTitle'}>{tabName} - Coming Soon</h2>
        <p className={'gameLayoutPlaceholderText'}>This feature is under development</p>
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
  const showManualSatchelModal = useUIStore((state) => state.showManualSatchelModal);
  const showTechniqueLearnedModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const showCurrentChapterExhaustedModal = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const currentChapterExhaustedAcknowledgedThisLife = useUIStore((state) => state.currentChapterExhaustedAcknowledgedThisLife);
  const openCurrentChapterExhaustedModal = useUIStore((state) => state.openCurrentChapterExhaustedModal);
  const clearCurrentChapterExhaustedAcknowledgement = useUIStore((state) => state.clearCurrentChapterExhaustedAcknowledgement);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const realmIndex = useGameStore((state) => state.realm.index);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const resetOnboardingLifeState = useUIStore((state) => state.resetOnboardingLifeState);
  const layoutBackgroundOverride = useUIStore((state) => state.layoutBackgroundOverride);
  const isScrollable = activeTab === 'status' || activeTab === 'prestige';
  const lastPrestigeCountRef = useRef(prestigeCount);

  useEffect(() => {
    if (prestigeCount > lastPrestigeCountRef.current) {
      resetOnboardingLifeState();
    }
    lastPrestigeCountRef.current = prestigeCount;
  }, [prestigeCount, resetOnboardingLifeState]);

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

    const lifeStartWizardOpen = selectedPath === null || selectedHeartLawId === null;
    const blockedByOtherModal = showOfflineProgressModal || showManualSatchelModal || showTechniqueLearnedModal || showWorldBuildingModal || lifeStartWizardOpen || activeTab === 'prestige';

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
    activeTab === 'adventure' ? 'gameLayoutRoot--world' : '',
    activeTab === 'techniques' ? 'gameLayoutRoot--techniques' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showLayoutBackgroundOverlay = activeTab === 'adventure' && !!layoutBackgroundOverride;

  return (
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

      <BottomTabBar />

      {showOfflineProgressModal && showOfflineModalSetting && <OfflineProgressModal />}
      {showManualSatchelModal && <ManualSatchelModal />}
      {showTechniqueLearnedModal && <TechniqueLearnedModal />}
      {showWorldBuildingModal && <WorldBuildingModal />}
      {showCurrentChapterExhaustedModal && <CurrentChapterExhaustedModal />}
      {showSystemStatusOverlay && <SystemStatusPanelOverlay />}
      <CombatPresentationHost />
      <LifeStartWizardModal />
      <CityArrivalBanner />
      <OnboardingPromptHost />
      <NotificationToasts />
    </div>
  );
}
