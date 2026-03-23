import { getShellTabLabel } from '../ui/text/playerFacingLabels.js';
import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { useGameStore } from '../stores/gameStore.js';
import { formatNumber } from '../utils/numbers.js';
import './Sidebar.scss';

interface NavButtonProps {
  tab: GameTab;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`sidebarNavButton ${active ? 'sidebarNavButtonActive' : ''}`}
    >
      {label}
    </button>
  );
}

/**
 * Sidebar navigation with ink wash theme
 */
export function Sidebar() {
  const { activeTab, setActiveTab, showPrestige } = useUIStore();
  const { totalAuras } = useGameStore();

  return (
    <aside className='sidebar'>
      <nav className='sidebarNavList'>
        <NavButton
          tab="cultivation"
          label={getShellTabLabel('cultivation')}
          active={activeTab === 'cultivation'}
          onClick={() => setActiveTab('cultivation')}
        />
        <NavButton
          tab="status"
          label={getShellTabLabel('status')}
          active={activeTab === 'status'}
          onClick={() => setActiveTab('status')}
        />
        <NavButton
          tab="adventure"
          label={getShellTabLabel('adventure')}
          active={activeTab === 'adventure'}
          onClick={() => setActiveTab('adventure')}
        />
        <NavButton
          tab="inventory"
          label={getShellTabLabel('inventory')}
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
        />
        <NavButton
          tab="techniques"
          label={getShellTabLabel('techniques')}
          active={activeTab === 'techniques'}
          onClick={() => setActiveTab('techniques')}
        />
        <NavButton
          tab="settings"
          label={getShellTabLabel('settings')}
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      <div className={'sidebarFooter'}>
        <div className={'sidebarAuraText'}>
          Auras: <span className={'sidebarAuraValue'}>{formatNumber(totalAuras)}</span>
        </div>
        <button
          onClick={showPrestige}
          className={'button-standard sidebarPrestigeButton'}
        >
          {getShellTabLabel('prestige')}
        </button>
      </div>
    </aside>
  );
}
