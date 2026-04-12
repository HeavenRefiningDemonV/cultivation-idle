import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { BottomNavDock, type BottomNavDockItem } from '../ui/shell/BottomNavDock.js';
import './BottomTabBar.scss';
import { getShellTabLabel } from '../ui/text/playerFacingLabels.js';

interface TabDefinition {
  id: GameTab;
}

export const BOTTOM_TAB_BAR_ORDER = [
  'status',
  'cultivation',
  'adventure',
  'inventory',
  'techniques',
  'prestige',
  'settings',
] as const satisfies readonly GameTab[];

const TABS: TabDefinition[] = BOTTOM_TAB_BAR_ORDER.map((id) => ({
  id,
}));

function buildDockItemLabel(tab: GameTab): string {
  return getShellTabLabel(tab);
}

function buildDockItem(tab: TabDefinition, activeTab: GameTab, setActiveTab: (tab: GameTab) => void): BottomNavDockItem {
  return {
    id: tab.id,
    label: buildDockItemLabel(tab.id),
    active: activeTab === tab.id,
    onSelect: () => setActiveTab(tab.id),
  };
}

const BOTTOM_TAB_BAR_ITEM_CLASS = 'button-standard uiNoShift bottomTabBarButton';

const BOTTOM_TAB_BAR_HOST_ATTRS = Object.freeze({
  'data-shell-role': 'bottom-tab-compat-wrapper',
  'data-shell-owner': 'BottomTabBar',
}) as const;

export const BOTTOM_TAB_BAR_COMPAT_POLICY = Object.freeze({
  preserveLegacyHooks: true,
  itemClassName: BOTTOM_TAB_BAR_ITEM_CLASS,
  hostAttrs: BOTTOM_TAB_BAR_HOST_ATTRS,
  labelSource: 'getShellTabLabel',
  navOwner: 'BottomNavDock',
  order: BOTTOM_TAB_BAR_ORDER,
});

export function BottomTabBar() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const items: BottomNavDockItem[] = TABS.map((tab) => buildDockItem(tab, activeTab, setActiveTab));

  return (
    <BottomNavDock
      items={items}
      className={activeTab === 'adventure' ? 'bottomNavDock--world' : undefined}
      itemClassName={BOTTOM_TAB_BAR_COMPAT_POLICY.itemClassName}
      preserveLegacyHooks={BOTTOM_TAB_BAR_COMPAT_POLICY.preserveLegacyHooks}
      hostAttrs={BOTTOM_TAB_BAR_COMPAT_POLICY.hostAttrs}
    />
  );
}
