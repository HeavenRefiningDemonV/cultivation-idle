import { useUIStore } from '../stores/uiStore';
import { Header } from './Header';
import { InkWashBackground } from './InkWashBackground';
import { CultivateScreen } from './screens/CultivateScreen';
import { StatusScreen } from './screens/StatusScreen';
import { AdventureScreen } from './screens/AdventureScreen';
import { DungeonScreen } from './screens/DungeonScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { PrestigeScreen } from './screens/PrestigeScreen';
import { OfflineProgressModal } from './modals/OfflineProgressModal';
import { SettingsScreen } from './screens/SettingsScreen';
import { SidebarLayout } from './ui/SidebarLayout';

/**
 * Placeholder content for tabs
 */
function PlaceholderContent({ tabName }: { tabName: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-ink-paper mb-2">
          {tabName} - Coming Soon
        </h2>
        <p className="text-ink-light">
          This feature is under development
        </p>
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
  const setActiveTab = useUIStore((state) => state.setActiveTab);
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
    <div className="min-h-screen bg-ink-black text-ink-paper font-inter">
      <InkWashBackground />
      <Header />

      <SidebarLayout activeTab={activeTab} onSelectTab={setActiveTab}>
        <div className="relative z-10">{renderContent()}</div>
      </SidebarLayout>

      {showOfflineProgressModal && showOfflineModalSetting && <OfflineProgressModal />}
    </div>
  );
}
