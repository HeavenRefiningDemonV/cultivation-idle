import { useUIStore } from '../stores/uiStore';
import { Header } from './Header';
import { TabNav } from './TabNav';

/**
 * Placeholder content for tabs
 */
function PlaceholderContent({ tabName }: { tabName: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-slate-300 mb-2">
          {tabName} - Coming Soon
        </h2>
        <p className="text-slate-400">
          This feature is under development
        </p>
      </div>
    </div>
  );
}

/**
 * Cultivation tab content (placeholder for now)
 */
function CultivationTab() {
  return <PlaceholderContent tabName="Cultivation" />;
}

/**
 * Adventure tab content (placeholder for now)
 */
function AdventureTab() {
  return <PlaceholderContent tabName="Adventure" />;
}

/**
 * Inventory tab content (placeholder for now)
 */
function InventoryTab() {
  return <PlaceholderContent tabName="Inventory" />;
}

/**
 * Techniques tab content (placeholder for now)
 */
function TechniquesTab() {
  return <PlaceholderContent tabName="Techniques" />;
}

/**
 * Prestige tab content (placeholder for now)
 */
function PrestigeTab() {
  return <PlaceholderContent tabName="Prestige" />;
}

/**
 * Settings tab content (placeholder for now)
 */
function SettingsTab() {
  return <PlaceholderContent tabName="Settings" />;
}

/**
 * Main game layout component
 */
export function GameLayout() {
  const activeTab = useUIStore((state) => state.activeTab);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'cultivation':
        return <CultivationTab />;
      case 'adventure':
        return <AdventureTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'techniques':
        return <TechniquesTab />;
      case 'prestige':
        return <PrestigeTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <PlaceholderContent tabName="Unknown" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <Header />

      {/* Tab Navigation */}
      <TabNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {renderContent()}
      </main>
    </div>
  );
}
