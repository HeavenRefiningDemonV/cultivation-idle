import type { LiveWorldModuleKey } from '../../content/types.js';
import type {
  OnboardingLockedSurface,
  OnboardingRouteHint,
  OnboardingRuntimeMilestoneId,
  SaveOnboardingState,
} from './onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
  ONBOARDING_LIVE_WORLD_MODULE_KEYS,
} from './onboardingTypes.js';

export type OnboardingWorldModuleState = 'available' | 'teaser' | 'hidden' | 'deferred';

export interface BuildOnboardingWorldModulePolicyInput {
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  completedMilestoneIds?: readonly string[];
  unlockedWorldModules?: readonly LiveWorldModuleKey[];
  teaserWorldModules?: readonly LiveWorldModuleKey[];
  selectedCityModuleKeys: readonly string[];
  deferredWorldModuleKeys?: readonly string[];
  firstLifeOnlyComplete?: boolean;
  devOverride?: SaveOnboardingState['devOverride'];
  isExistingAdvancedSave?: boolean;
  exactFixtureOrCaptureMode?: boolean;
}

export interface OnboardingWorldModulePolicy {
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  availableModules: LiveWorldModuleKey[];
  teaserModules: LiveWorldModuleKey[];
  hiddenModules: LiveWorldModuleKey[];
  deferredModules: string[];
  lockedModules: Partial<Record<LiveWorldModuleKey, OnboardingLockedSurface>>;
  moduleStates: Partial<Record<LiveWorldModuleKey, OnboardingWorldModuleState>>;
  routeHints: Partial<Record<LiveWorldModuleKey, OnboardingRouteHint>>;
  debugReasons: string[];
}

const LIVE_MODULE_SET = new Set<string>(ONBOARDING_LIVE_WORLD_MODULE_KEYS);

const MODULE_LABELS: Record<LiveWorldModuleKey, string> = {
  outskirts: 'Outskirts',
  trainingHall: 'Training Hall',
  manualPavilion: 'Manual Pavilion',
  apothecary: 'Apothecary',
  expeditions: 'Expeditions',
  forge: 'Forge',
  ruins: 'Ruins',
  bounties: 'Bounty Board',
  gateTrial: 'Gate Trial',
};

const MODULE_REQUIREMENTS: Partial<Record<LiveWorldModuleKey, string>> = {
  outskirts: 'Reach the first World milestone.',
  trainingHall: 'Reach the first World milestone and choose a path.',
  manualPavilion: 'Claim Outskirts gains, then reach the Manual Pavilion milestone.',
  apothecary: 'Reach the preparation milestone where herbs and medicine connect.',
  expeditions: 'Reach the preparation milestone where passive support routes open.',
  forge: 'Reach the Forge milestone after preparation starts.',
  ruins: 'Reach the support rotation milestone.',
  bounties: 'Reach the support rotation milestone.',
  gateTrial: 'Reach the final Gate Trial milestone.',
};

const uniqueInOrder = <T extends string>(values: readonly T[]): T[] => Array.from(new Set(values));

const isLiveWorldModuleKey = (value: string): value is LiveWorldModuleKey => LIVE_MODULE_SET.has(value);

const resolveEffectiveMilestone = (
  activeMilestoneId: OnboardingRuntimeMilestoneId | null,
  devOverride: SaveOnboardingState['devOverride'] | undefined,
): OnboardingRuntimeMilestoneId | null => {
  if (devOverride && Object.prototype.hasOwnProperty.call(devOverride, 'forceMilestoneId')) {
    return devOverride.forceMilestoneId ?? null;
  }
  return activeMilestoneId;
};

function buildRouteHint(
  moduleKey: LiveWorldModuleKey,
  state: OnboardingWorldModuleState,
  activeMilestoneId: OnboardingRuntimeMilestoneId | null,
): OnboardingRouteHint {
  const label = MODULE_LABELS[moduleKey];
  const requirement = MODULE_REQUIREMENTS[moduleKey] ?? 'Progress further in Qi Condensation.';
  const reason = state === 'teaser'
    ? `${label} is close, but it is not ready to open yet.`
    : `${label} unlocks later in the first-life curriculum.`;

  return {
    label,
    target: { kind: 'world_module', moduleKey },
    reason: `${reason} ${requirement}`,
    milestoneId: activeMilestoneId,
  };
}

function buildLockedModule(
  moduleKey: LiveWorldModuleKey,
  state: Exclude<OnboardingWorldModuleState, 'available'>,
  activeMilestoneId: OnboardingRuntimeMilestoneId | null,
): OnboardingLockedSurface {
  const label = MODULE_LABELS[moduleKey];
  const routeHint = buildRouteHint(moduleKey, state, activeMilestoneId);
  return {
    key: moduleKey,
    label,
    state: state === 'deferred' ? 'deferred' : state,
    reason: state === 'deferred'
      ? 'This service is not part of the current live city schema.'
      : routeHint.reason,
    requirement: state === 'deferred'
      ? 'Use another live city service.'
      : MODULE_REQUIREMENTS[moduleKey] ?? 'Progress further in Qi Condensation.',
    routeHint,
    milestoneId: activeMilestoneId,
  };
}

function getFallbackUnlocks(activeMilestoneId: OnboardingRuntimeMilestoneId | null): {
  worldModules: readonly LiveWorldModuleKey[];
  teaserWorldModules: readonly LiveWorldModuleKey[];
} {
  if (!activeMilestoneId || activeMilestoneId === 'complete') {
    return { worldModules: [], teaserWorldModules: [] };
  }
  return DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[activeMilestoneId];
}

export function buildOnboardingWorldModulePolicy(
  input: BuildOnboardingWorldModulePolicyInput,
): OnboardingWorldModulePolicy {
  const activeMilestoneId = resolveEffectiveMilestone(input.activeMilestoneId, input.devOverride);
  const debugReasons: string[] = [];
  const selectedCityModules = uniqueInOrder(input.selectedCityModuleKeys);
  const deferredSet = new Set(input.deferredWorldModuleKeys ?? []);
  const liveCityModules = selectedCityModules.filter(isLiveWorldModuleKey);
  const deferredModules = selectedCityModules.filter((moduleKey) => deferredSet.has(moduleKey));

  const unlockAll =
    input.devOverride?.unlockAll === true ||
    input.firstLifeOnlyComplete === true ||
    activeMilestoneId === 'complete' ||
    input.isExistingAdvancedSave === true ||
    input.exactFixtureOrCaptureMode === true;

  const fallbackUnlocks = getFallbackUnlocks(activeMilestoneId);
  const unlockedSet = new Set<LiveWorldModuleKey>(
    input.unlockedWorldModules ?? fallbackUnlocks.worldModules,
  );
  const teaserSet = new Set<LiveWorldModuleKey>(
    input.teaserWorldModules ?? fallbackUnlocks.teaserWorldModules,
  );

  const availableModules: LiveWorldModuleKey[] = [];
  const teaserModules: LiveWorldModuleKey[] = [];
  const hiddenModules: LiveWorldModuleKey[] = [];
  const lockedModules: Partial<Record<LiveWorldModuleKey, OnboardingLockedSurface>> = {};
  const moduleStates: Partial<Record<LiveWorldModuleKey, OnboardingWorldModuleState>> = {};
  const routeHints: Partial<Record<LiveWorldModuleKey, OnboardingRouteHint>> = {};

  if (unlockAll) {
    debugReasons.push('first-life onboarding no longer restricts live city modules');
  }

  for (const moduleKey of liveCityModules) {
    let state: OnboardingWorldModuleState;
    if (deferredSet.has(moduleKey)) {
      state = 'deferred';
    } else if (unlockAll || unlockedSet.has(moduleKey)) {
      state = 'available';
    } else if (teaserSet.has(moduleKey)) {
      state = 'teaser';
    } else {
      state = 'hidden';
    }

    moduleStates[moduleKey] = state;
    if (state === 'available') {
      availableModules.push(moduleKey);
    } else if (state === 'teaser') {
      teaserModules.push(moduleKey);
      lockedModules[moduleKey] = buildLockedModule(moduleKey, state, activeMilestoneId);
      routeHints[moduleKey] = lockedModules[moduleKey]?.routeHint;
    } else {
      hiddenModules.push(moduleKey);
      lockedModules[moduleKey] = buildLockedModule(moduleKey, state, activeMilestoneId);
      routeHints[moduleKey] = lockedModules[moduleKey]?.routeHint;
    }
  }

  for (const moduleKey of deferredModules) {
    if (isLiveWorldModuleKey(moduleKey)) continue;
    debugReasons.push(`${moduleKey} is deferred by live city schema`);
  }

  return {
    activeMilestoneId,
    availableModules,
    teaserModules,
    hiddenModules,
    deferredModules,
    lockedModules,
    moduleStates,
    routeHints,
    debugReasons,
  };
}
