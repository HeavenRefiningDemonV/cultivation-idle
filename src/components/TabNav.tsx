import { getShellTabLabel } from '../ui/text/playerFacingLabels.js';
import { useUIStore } from '../stores/uiStore.js';
import type { GameTab } from '../stores/uiStore.js';
import './TabNav.scss';

interface TabDefinition {
  id: GameTab;
  label: string;
  icon?: string;
}

const TABS: TabDefinition[] = [
  { id: 'cultivation', label: getShellTabLabel('cultivation') },
  { id: 'adventure', label: getShellTabLabel('adventure') },
  { id: 'inventory', label: getShellTabLabel('inventory') },
  { id: 'techniques', label: getShellTabLabel('techniques') },
  { id: 'prestige', label: getShellTabLabel('prestige') },
  { id: 'settings', label: getShellTabLabel('settings') },
];

export function TabNav() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <nav className={'tabNavNav'}>
      <div className={'tabNavInner'}>
        <div className={'tabNavList'}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${'button-standard'} ${'tabNavTab'} ${isActive ? 'tabNavTabActive' : ''}`}
              >
                {tab.label}
                {isActive && (
                  <div className={'tabNavActiveUnderline'} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
