import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';
import type {
  OnboardingMilestoneContent,
  OnboardingMilestoneId,
  SaveOnboardingState,
} from './onboardingTypes.js';
import { getOnboardingMilestoneById } from './onboardingContent.js';

export function isOnboardingComplete(state: SaveOnboardingState): boolean {
  return state.firstLifeOnlyComplete || state.activeMilestoneId === 'complete';
}

export function hasCompletedMilestone(state: SaveOnboardingState, id: OnboardingMilestoneId): boolean {
  return state.completedMilestoneIds.includes(id);
}

export function getCurrentOnboardingMilestoneContent(
  milestones: readonly OnboardingMilestoneContent[],
  state: SaveOnboardingState,
): OnboardingMilestoneContent | null {
  if (!state.activeMilestoneId || state.activeMilestoneId === 'complete') return null;
  return getOnboardingMilestoneById(milestones, state.activeMilestoneId);
}

export function getOnboardingUnlockSnapshot(state: SaveOnboardingState): {
  tabs: GameTab[];
  worldModules: LiveWorldModuleKey[];
  teaserWorldModules: LiveWorldModuleKey[];
} {
  return {
    tabs: [...state.unlockedTabs],
    worldModules: [...state.unlockedWorldModules],
    teaserWorldModules: [...state.teaserWorldModules],
  };
}
