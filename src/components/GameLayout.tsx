import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { CultivateScreen } from './screens/CultivateScreen';
import { StatusScreen } from './screens/StatusScreen';
import { WorldScreen } from './screens/WorldScreen';
import InventoryScreen from './screens/InventoryScreen';
import { PrestigeScreen } from './screens/PrestigeScreen';
import { OfflineProgressModal } from './modals/OfflineProgressModal';
import { ManualSatchelModal } from './modals/ManualSatchelModal';
import { TechniqueLearnedModal } from './modals/TechniqueLearnedModal';
import { SettingsScreen } from './screens/SettingsScreen';
import { SystemStatusPanelOverlay } from '../app/overlays/SystemStatusPanel';
import { CombatPresentationHost } from '../app/overlays/CombatPresentationHost';
import { TechniqueLibraryScreen } from './screens/TechniqueLibraryScreen';
import { LifeStartWizardModal } from './modals/LifeStartWizardModal';
import { NotificationToasts } from './NotificationToasts';
import { BottomTabBar } from './BottomTabBar';
import { WorldBuildingModal } from './modals/WorldBuildingModal';
import './GameLayout.scss';

/**
 * Placeholder content for tabs
 */
function PlaceholderContent({ tabName }: { tabName: string }) {
  return (
    <div className={'gameLayoutPlaceholder'}>
      <div className={'gameLayoutPlaceholderCard'}>
        <div className={'gameLayoutPlaceholderIcon'}>🚧</div>
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
  const layoutBackgroundOverride = useUIStore((state) => state.layoutBackgroundOverride);
  const isScrollable = activeTab === 'status' || activeTab === 'prestige';

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

  const rootStyle =
    activeTab === 'adventure' && layoutBackgroundOverride
      ? { backgroundImage: `url(${layoutBackgroundOverride})` }
      : undefined;

  return (
    <div className={rootClassNames} style={rootStyle}>
      <div className={`gameLayoutContent ${isScrollable ? 'gameLayoutContent--scrollable' : ''}`}>
        {renderContent()}
      </div>

      <BottomTabBar />

      {showOfflineProgressModal && showOfflineModalSetting && <OfflineProgressModal />}
      {showManualSatchelModal && <ManualSatchelModal />}
      {showTechniqueLearnedModal && <TechniqueLearnedModal />}
      {showWorldBuildingModal && <WorldBuildingModal />}
      {showSystemStatusOverlay && <SystemStatusPanelOverlay />}
      <CombatPresentationHost />
      <LifeStartWizardModal />
      <NotificationToasts />
    </div>
  );
}
