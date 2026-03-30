import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { BottomNavDock, type BottomNavDockItem } from '../ui/shell/BottomNavDock.js';
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
    active: activeTab === tab.id,
    onSelect: () => setActiveTab(tab.id),
  }));

  return <BottomNavDock items={items} itemClassName="button-standard uiNoShift bottomTabBarButton" preserveLegacyHooks />;
}
