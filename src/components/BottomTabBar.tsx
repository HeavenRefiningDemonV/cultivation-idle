import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { BottomNavDock, type BottomNavDockItem } from '../ui/chrome/BottomNavDock.js';
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

  const items: BottomNavDockItem[] = TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    title: tab.label,
  }));

  return <BottomNavDock items={items} activeId={activeTab} onSelect={(id) => setActiveTab(id as GameTab)} ariaLabel="Primary navigation" />;
}
