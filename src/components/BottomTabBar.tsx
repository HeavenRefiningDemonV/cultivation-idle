import { useMemo } from 'react';
import type { GameTab } from '../stores/uiStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { useOnboardingStore } from '../stores/onboardingStore.js';
import { buildOnboardingTabPolicy } from '../systems/onboarding/onboardingTabPolicy.js';
import { isOnboardingExactFixtureOrCaptureModeEnabled } from '../systems/onboarding/onboardingRouteGuards.js';
import type { IconId } from '../ui/icons/index.js';
import { BottomNavDock, type BottomNavDockItem } from '../ui/shell/BottomNavDock.js';
import './BottomTabBar.scss';
import { getShellTabLabel } from '../ui/text/playerFacingLabels.js';

interface TabDefinition {
  id: GameTab;
}

const BOTTOM_TAB_BAR_ORDER = [
  'status',
  'cultivation',
  'adventure',
  'inventory',
  'techniques',
  'records',
  'prestige',
  'settings',
] as const satisfies readonly GameTab[];

const TABS: TabDefinition[] = BOTTOM_TAB_BAR_ORDER.map((id) => ({
  id,
}));

const TAB_ICONS = {
  status: 'placeholderRingSmall',
  cultivation: 'inkSwirl',
  adventure: 'placeholderRingLarge',
  inventory: 'artifactBundle',
  techniques: 'bookHeaven',
  records: 'recordSlip',
  prestige: 'spiritGrass',
  settings: 'inkWip',
} as const satisfies Record<GameTab, IconId>;

function buildDockItemLabel(tab: GameTab): string {
  return getShellTabLabel(tab);
}

function buildDockItem(tab: TabDefinition, activeTab: GameTab, setActiveTab: (tab: GameTab) => void): BottomNavDockItem {
  return {
    id: tab.id,
    label: buildDockItemLabel(tab.id),
    icon: TAB_ICONS[tab.id],
    active: activeTab === tab.id,
    onSelect: () => setActiveTab(tab.id),
  };
}

const BOTTOM_TAB_BAR_ITEM_CLASS = 'button-standard uiNoShift bottomTabBarButton';
const BOTTOM_TAB_BAR_DOCK_CLASS = 'bottomNavDock--inkPlaque';

const BOTTOM_TAB_BAR_HOST_ATTRS = Object.freeze({
  'data-shell-role': 'bottom-tab-compat-wrapper',
  'data-shell-owner': 'BottomTabBar',
}) as const;

const BOTTOM_TAB_BAR_COMPAT_POLICY = Object.freeze({
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
  const activeMilestoneId = useOnboardingStore((state) => state.activeMilestoneId);
  const unlockedTabs = useOnboardingStore((state) => state.unlockedTabs);
  const firstLifeOnlyComplete = useOnboardingStore((state) => state.firstLifeOnlyComplete);
  const devOverride = useOnboardingStore((state) => state.devOverride);
  const firstOutskirtsRewardClaimedAt = useOnboardingStore((state) => state.eventFacts.firstOutskirtsRewardClaimedAt);

  const tabPolicy = useMemo(
    () => buildOnboardingTabPolicy({
      activeMilestoneId,
      unlockedTabs,
      firstLifeOnlyComplete,
      devOverride,
      settingsAsUtility: true,
      supportedTabs: BOTTOM_TAB_BAR_ORDER,
      exactFixtureOrCaptureMode: isOnboardingExactFixtureOrCaptureModeEnabled(),
      hasInventoryEvidence: typeof firstOutskirtsRewardClaimedAt === 'number',
    }),
    [activeMilestoneId, devOverride, firstLifeOnlyComplete, firstOutskirtsRewardClaimedAt, unlockedTabs],
  );
  const allowedTabIds = useMemo(
    () => new Set<GameTab>([...tabPolicy.visibleTabs, ...tabPolicy.utilityTabs]),
    [tabPolicy.utilityTabs, tabPolicy.visibleTabs],
  );

  const items: BottomNavDockItem[] = TABS
    .filter((tab) => allowedTabIds.has(tab.id))
    .map((tab) => buildDockItem(tab, activeTab, setActiveTab));

  return (
    <BottomNavDock
      items={items}
      className={BOTTOM_TAB_BAR_DOCK_CLASS}
      itemClassName={BOTTOM_TAB_BAR_COMPAT_POLICY.itemClassName}
      preserveLegacyHooks={BOTTOM_TAB_BAR_COMPAT_POLICY.preserveLegacyHooks}
      hostAttrs={BOTTOM_TAB_BAR_COMPAT_POLICY.hostAttrs}
    />
  );
}
