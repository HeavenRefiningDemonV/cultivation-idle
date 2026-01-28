import type { GameTab } from '../stores/uiStore';
import { useUIStore } from '../stores/uiStore';
import './BottomTabBar.scss';

interface TabDefinition {
  id: GameTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'status', label: 'Status' },
  { id: 'cultivation', label: 'Cultivation' },
  { id: 'adventure', label: 'World' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'settings', label: 'Settings' },
];

export function BottomTabBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <nav className="bottomTabBar" aria-label="Primary navigation">
      <div className="bottomTabBarList">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`button-standard bottomTabBarButton ${isActive ? 'bottomTabBarButton--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

    </nav>
  );
}
