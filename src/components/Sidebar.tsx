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
      className={`game-sidebar__nav-button${active ? ' game-sidebar__nav-button--active' : ''}`}
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
    <aside className="game-sidebar">
      <nav className="game-sidebar__nav-list">
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
      <div className="game-sidebar__footer">
        <div className="game-sidebar__aura-text">
          Auras: <span className="game-sidebar__aura-value">{formatNumber(totalAuras)}</span>
        </div>
        <button
          onClick={showPrestige}
          className="game-sidebar__prestige-button"
        >
          Rebirth
        </button>
      </div>
    </aside>
  );
}
