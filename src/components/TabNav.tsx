import { useUIStore } from '../stores/uiStore';
import type { GameTab } from '../stores/uiStore';
import './TabNav.scss';

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
    <nav className="tab-nav">
      <div className="tab-nav__inner">
        <div className="tab-nav__list">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-nav__tab ${isActive ? 'tab-nav__tab--active' : ''}`}
              >
                {tab.label}
                {isActive && (
                  <div className="tab-nav__underline" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
