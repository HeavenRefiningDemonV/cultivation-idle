import type { GameTab } from '../stores/uiStore';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { formatNumber } from '../utils/numbers';
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
      className={`buttonStandard sidebarNavButton ${active ? 'sidebarNavButtonActive' : ''}`}
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
    <aside className={'sidebar'}>
      <nav className={'sidebarNavList'}>
        <NavButton
          tab="cultivation"
          label="Cultivate"
          active={activeTab === 'cultivation'}
          onClick={() => setActiveTab('cultivation')}
        />
        <NavButton
          tab="status"
          label="Status"
          active={activeTab === 'status'}
          onClick={() => setActiveTab('status')}
        />
        <NavButton
          tab="adventure"
          label="Adventure"
          active={activeTab === 'adventure'}
          onClick={() => setActiveTab('adventure')}
        />
        <NavButton
          tab="dungeon"
          label="Dungeon"
          active={activeTab === 'dungeon'}
          onClick={() => setActiveTab('dungeon')}
        />
        <NavButton
          tab="inventory"
          label="Inventory"
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
        />
        <NavButton
          tab="techniques"
          label="Techniques"
          active={activeTab === 'techniques'}
          onClick={() => setActiveTab('techniques')}
        />
        <NavButton
          tab="settings"
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      {/* Bottom Section - Prestige */}
      <div className={'sidebarFooter'}>
        <div className={'sidebarAuraText'}>
          Auras: <span className={'sidebarAuraValue'}>{formatNumber(totalAuras)}</span>
        </div>
        <button
          onClick={showPrestige}
          className={'buttonStandard sidebarPrestigeButton'}
        >
          Rebirth
        </button>
      </div>
    </aside>
  );
}
