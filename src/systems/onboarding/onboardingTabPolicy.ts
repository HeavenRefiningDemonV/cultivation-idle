import type { GameTab } from '../../stores/uiStore.js';
import type {
  OnboardingLockedSurface,
  OnboardingRuntimeMilestoneId,
  SaveOnboardingState,
} from './onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
  ONBOARDING_TAB_KEYS,
} from './onboardingTypes.js';

const DEFAULT_SUPPORTED_TABS = [...ONBOARDING_TAB_KEYS] as GameTab[];
const SETTINGS_TAB: GameTab = 'settings';

const TAB_LABELS: Record<GameTab, string> = {
  cultivation: 'Cultivation',
  status: 'Status',
  adventure: 'World',
  inventory: 'Inventory',
  records: 'Manual Pavilion',
  techniques: 'Techniques',
  prestige: 'Prestige',
  settings: 'Settings',
};

const TAB_REQUIREMENTS: Partial<Record<GameTab, string>> = {
  status: 'Break through to Qi Condensation II.',
  adventure: 'Reach the Outskirts milestone in Qi Condensation III.',
  inventory: 'Claim first loot or reach the Manual Pavilion milestone.',
  records: 'Reach the Manual Pavilion milestone.',
  techniques: 'Study a manual until it can become a combat technique.',
  prestige: 'Complete the first-life onboarding arc.',
};

export interface BuildOnboardingTabPolicyInput {
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  completedMilestoneIds?: readonly string[];
  unlockedTabs?: readonly GameTab[];
  firstLifeOnlyComplete?: boolean;
  devOverride?: SaveOnboardingState['devOverride'];
  isExistingAdvancedSave?: boolean;
  storyOrLifeStartBlocking?: boolean;
  settingsAsUtility?: boolean;
  exactFixtureOrCaptureMode?: boolean;
  hasInventoryEvidence?: boolean;
  supportedTabs?: readonly GameTab[];
}

export interface OnboardingTabPolicy {
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  visibleTabs: GameTab[];
  hiddenTabs: GameTab[];
  utilityTabs: GameTab[];
  lockedTabs: Partial<Record<GameTab, OnboardingLockedSurface>>;
  forcedFallbackTab: GameTab;
  shouldSuppressProgressionNav: boolean;
  debugReasons: string[];
}

const uniqueInOrder = <T extends string>(values: readonly T[]): T[] => Array.from(new Set(values));

const resolveEffectiveMilestone = (
  activeMilestoneId: OnboardingRuntimeMilestoneId | null,
  devOverride: SaveOnboardingState['devOverride'] | undefined,
): OnboardingRuntimeMilestoneId | null => {
  if (devOverride && Object.prototype.hasOwnProperty.call(devOverride, 'forceMilestoneId')) {
    return devOverride.forceMilestoneId ?? null;
  }
  return activeMilestoneId;
};

const progressionTabs = (supportedTabs: readonly GameTab[], settingsAsUtility: boolean): GameTab[] =>
  supportedTabs.filter((tab) => !(settingsAsUtility && tab === SETTINGS_TAB));

function buildLockedTab(tab: GameTab, activeMilestoneId: OnboardingRuntimeMilestoneId | null): OnboardingLockedSurface {
  return {
    key: tab,
    label: TAB_LABELS[tab],
    state: 'hidden',
    reason: `${TAB_LABELS[tab]} opens later in the first-life curriculum.`,
    requirement: TAB_REQUIREMENTS[tab] ?? 'Progress further in Qi Condensation.',
    routeHint: {
      label: TAB_LABELS[tab],
      target: { kind: 'tab', tab },
      reason: TAB_REQUIREMENTS[tab] ?? 'Progress further in Qi Condensation.',
      milestoneId: activeMilestoneId,
    },
    milestoneId: activeMilestoneId,
  };
}

export function buildOnboardingTabPolicy(input: BuildOnboardingTabPolicyInput): OnboardingTabPolicy {
  const supportedTabs = uniqueInOrder(input.supportedTabs ?? DEFAULT_SUPPORTED_TABS);
  const settingsAsUtility = input.settingsAsUtility ?? true;
  const utilityTabs = settingsAsUtility && supportedTabs.includes(SETTINGS_TAB) ? [SETTINGS_TAB] : [];
  const supportedProgressionTabs = progressionTabs(supportedTabs, settingsAsUtility);
  const activeMilestoneId = resolveEffectiveMilestone(input.activeMilestoneId, input.devOverride);
  const debugReasons: string[] = [];

  const unlockAll =
    input.devOverride?.unlockAll === true ||
    input.firstLifeOnlyComplete === true ||
    activeMilestoneId === 'complete' ||
    input.isExistingAdvancedSave === true ||
    input.exactFixtureOrCaptureMode === true;

  if (unlockAll) {
    debugReasons.push('first-life onboarding no longer restricts supported tabs');
    return {
      activeMilestoneId,
      visibleTabs: supportedProgressionTabs,
      hiddenTabs: [],
      utilityTabs,
      lockedTabs: {},
      forcedFallbackTab: supportedProgressionTabs[0] ?? utilityTabs[0] ?? 'cultivation',
      shouldSuppressProgressionNav: false,
      debugReasons,
    };
  }

  if (input.storyOrLifeStartBlocking || activeMilestoneId === 'M0_life_start') {
    debugReasons.push('life start owns the foreground');
    const lockedTabs = Object.fromEntries(
      supportedProgressionTabs.map((tab) => [tab, buildLockedTab(tab, activeMilestoneId)]),
    ) as Partial<Record<GameTab, OnboardingLockedSurface>>;
    return {
      activeMilestoneId,
      visibleTabs: [],
      hiddenTabs: supportedProgressionTabs,
      utilityTabs,
      lockedTabs,
      forcedFallbackTab: 'cultivation',
      shouldSuppressProgressionNav: true,
      debugReasons,
    };
  }

  const fallbackUnlocks = activeMilestoneId
    ? DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[activeMilestoneId].tabs
    : [];
  const unlockedTabs = input.unlockedTabs && input.unlockedTabs.length > 0
    ? [...input.unlockedTabs]
    : [...fallbackUnlocks];

  if (activeMilestoneId === 'M3_world_outskirts' && input.hasInventoryEvidence) {
    unlockedTabs.push('inventory');
  }

  const visibleTabs = uniqueInOrder(unlockedTabs)
    .filter((tab) => supportedProgressionTabs.includes(tab));
  const hiddenTabs = supportedProgressionTabs.filter((tab) => !visibleTabs.includes(tab));
  const lockedTabs = Object.fromEntries(
    hiddenTabs.map((tab) => [tab, buildLockedTab(tab, activeMilestoneId)]),
  ) as Partial<Record<GameTab, OnboardingLockedSurface>>;

  return {
    activeMilestoneId,
    visibleTabs,
    hiddenTabs,
    utilityTabs,
    lockedTabs,
    forcedFallbackTab: visibleTabs[0] ?? utilityTabs[0] ?? 'cultivation',
    shouldSuppressProgressionNav: visibleTabs.length === 0,
    debugReasons,
  };
}
