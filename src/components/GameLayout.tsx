import { useUIStore } from '../stores/uiStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CultivateScreen } from './screens/CultivateScreen';
import { StatusScreen } from './screens/StatusScreen';
import { AdventureScreen } from './screens/AdventureScreen';
import { DungeonScreen } from './screens/DungeonScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { PrestigeScreen } from './screens/PrestigeScreen';
import { OfflineProgressModal } from './modals/OfflineProgressModal';
import { SettingsScreen } from './screens/SettingsScreen';
import './GameLayout.scss';

/**
 * Placeholder content for tabs
 */
function PlaceholderContent({ tabName }: { tabName: string }) {
  return (
    <div className="game-layout__placeholder">
      <div className="game-layout__placeholder-card">
        <div className="game-layout__placeholder-icon">🚧</div>
        <h2 className="game-layout__placeholder-title">{tabName} - Coming Soon</h2>
        <p className="game-layout__placeholder-text">This feature is under development</p>
      </div>
    </div>
  );
}

/**
 * Techniques tab content (placeholder for now)
 */
function TechniquesTab() {
  return <PlaceholderContent tabName="Techniques" />;
}

/**
 * Main game layout component
 */
export function GameLayout() {
  const activeTab = useUIStore((state) => state.activeTab);
  const showOfflineProgressModal = useUIStore((state) => state.showOfflineProgressModal);
  const showOfflineModalSetting = useUIStore((state) => state.settings.showOfflineModal);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'cultivation':
        return <CultivateScreen />;
      case 'status':
        return <StatusScreen />;
      case 'adventure':
        return <AdventureScreen />;
      case 'dungeon':
        return <DungeonScreen />;
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

  return (
    <div className="game-layout">
      <Header />
      <Sidebar />
      <main className="game-layout__main">
        <div className="game-layout__content">
          {renderContent()}
        </div>
      </main>

      {showOfflineProgressModal && showOfflineModalSetting && <OfflineProgressModal />}
    </div>
  );
}
