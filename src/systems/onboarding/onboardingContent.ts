import type { ValidatedContent } from '../../content/index.js';
import type { OnboardingMilestoneContent, OnboardingMilestoneId } from './onboardingTypes.js';
import { ONBOARDING_MILESTONE_IDS } from './onboardingTypes.js';

export const ONBOARDING_MILESTONE_ORDER: readonly OnboardingMilestoneId[] = ONBOARDING_MILESTONE_IDS;

export function sortOnboardingMilestones(milestones: readonly OnboardingMilestoneContent[]): OnboardingMilestoneContent[] {
  return [...milestones].sort((left, right) => left.order - right.order);
}

export function getOnboardingMilestoneById(
  milestones: readonly OnboardingMilestoneContent[],
  id: OnboardingMilestoneId,
): OnboardingMilestoneContent | null {
  return milestones.find((milestone) => milestone.id === id) ?? null;
}

export function getOnboardingMilestonesFromContent(content: ValidatedContent | null): OnboardingMilestoneContent[] {
  if (!content?.onboarding_milestones?.milestones) return [];
  return sortOnboardingMilestones(content.onboarding_milestones.milestones);
}
