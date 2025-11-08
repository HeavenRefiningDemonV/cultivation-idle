import type { GameTab } from '../stores/uiStore';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { formatNumber } from '../utils/numbers';

interface NavButtonProps {
  tab: GameTab;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ tab, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-3 px-4 text-left font-cinzel text-lg
        border-2 transition-all duration-200
        ${
          active
            ? 'bg-qi-dark border-qi-blue text-qi-glow shadow-qi-glow'
            : 'bg-ink-dark border-ink-medium text-ink-paper hover:border-ink-light hover:bg-ink-medium'
        }
      `}
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
    <aside className="fixed left-0 top-20 bottom-0 w-56 bg-ink-darkest border-r-2 border-ink-dark z-30">
      <nav className="flex flex-col gap-3 p-4">
        <NavButton
          tab="cultivation"
          label="Cultivate"
          active={activeTab === 'cultivation'}
          onClick={() => setActiveTab('cultivation')}
        />
        <NavButton
          tab="adventure"
          label="Adventure"
          active={activeTab === 'adventure'}
          onClick={() => setActiveTab('adventure')}
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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-ink-dark">
        <div className="text-gold-accent text-sm font-mono mb-3 text-center">
          Auras: <span className="font-bold text-gold-bright">{formatNumber(totalAuras)}</span>
        </div>
        <button
          onClick={showPrestige}
          className="w-full py-3 px-4 bg-breakthrough-red hover:bg-breakthrough-pink border-2 border-breakthrough-pink text-ink-white font-cinzel text-lg transition-all shadow-breakthrough"
        >
          Rebirth
        </button>
      </div>
    </aside>
  );
}
