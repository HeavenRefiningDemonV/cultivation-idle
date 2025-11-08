import { useUIStore } from '../stores/uiStore';
import type { GameTab } from '../stores/uiStore';

/**
 * Tab definition
 */
interface TabDefinition {
  id: GameTab;
  label: string;
  icon?: string; // Could use lucide-react icons later
}

/**
 * Available tabs
 */
const TABS: TabDefinition[] = [
  { id: 'cultivation', label: 'Cultivation' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'settings', label: 'Settings' },
];

/**
 * TabNav component - Navigation tabs for game sections
 */
export function TabNav() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-3 font-medium text-sm transition-all duration-200
                  border-b-2 relative
                  ${
                    isActive
                      ? 'text-cyan-400 border-cyan-400 bg-slate-700/50'
                      : 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-700/30'
                  }
                `}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
