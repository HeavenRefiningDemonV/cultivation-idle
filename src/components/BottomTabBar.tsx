import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import './BottomTabBar.scss';
import { getShellTabLabel } from '../ui/text/playerFacingLabels.js';

interface TabDefinition {
  id: GameTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'status', label: getShellTabLabel('status') },
  { id: 'cultivation', label: getShellTabLabel('cultivation') },
  { id: 'adventure', label: getShellTabLabel('adventure') },
  { id: 'inventory', label: getShellTabLabel('inventory') },
  { id: 'techniques', label: getShellTabLabel('techniques') },
  { id: 'prestige', label: getShellTabLabel('prestige') },
  { id: 'settings', label: getShellTabLabel('settings') },
];

export function BottomTabBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <nav className="bottomTabBar" aria-label="Primary navigation">
      <div className="bottomTabBarInner">
        <div className="bottomTabBarList">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`button-standard uiNoShift bottomTabBarButton ${isActive ? 'bottomTabBarButton--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
