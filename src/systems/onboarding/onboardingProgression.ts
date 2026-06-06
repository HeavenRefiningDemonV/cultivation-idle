import type { GameTab } from '../../stores/uiStore.js';
import type { LiveWorldModuleKey } from '../../content/types.js';
import type {
  OnboardingEventFactState,
  OnboardingMilestoneContent,
  OnboardingMilestoneId,
  OnboardingRuntimeMilestoneId,
  SaveOnboardingState,
} from './onboardingTypes.js';
import {
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
  ONBOARDING_MILESTONE_IDS,
  ONBOARDING_MILESTONE_INDEX,
} from './onboardingTypes.js';

export interface OnboardingSnapshot {
  now: number;
  selectedPath: string | null;
  selectedHeartLawId: string | null;
  realmIndex: number;
  substage: number;
  inventoryItemCount: number;
  currencies: { gold?: string; spiritStones?: string; merit?: string };
  manualCount: number;
  manualStudyActive: boolean;
  unlockedTechniqueCount: number;
  equippedTechniqueCount: number;
  pouchEquippedCount: number;
  activeExpeditionCount: number;
  forgeUpgradeEvidence: boolean;
  ruinsRunEvidence: boolean;
  bountyEvidence: boolean;
  trialAttemptEvidence: boolean;
  gateResolvedEvidence: boolean;
  foundationReached: boolean;
  eventFacts: OnboardingEventFactState;
}

const unique = <T extends string>(values: readonly T[]): T[] => Array.from(new Set(values));

export function getNextOnboardingMilestoneId(id: OnboardingMilestoneId): OnboardingRuntimeMilestoneId {
  const next = ONBOARDING_MILESTONE_IDS[ONBOARDING_MILESTONE_INDEX[id] + 1];
  return next ?? 'complete';
}

export function getMilestonesUpTo(id: OnboardingRuntimeMilestoneId | null): OnboardingMilestoneId[] {
  if (!id) return [];
  if (id === 'complete') return [...ONBOARDING_MILESTONE_IDS];
  const idx = ONBOARDING_MILESTONE_INDEX[id];
  return ONBOARDING_MILESTONE_IDS.slice(0, idx + 1);
}

export function getCompletedMilestonesThrough(id: OnboardingMilestoneId | null): OnboardingMilestoneId[] {
  if (!id) return [];
  return getMilestonesUpTo(id);
}

export function mergeOnboardingUnlocks(
  unlocks: Array<Partial<Pick<SaveOnboardingState, 'unlockedTabs' | 'unlockedWorldModules' | 'teaserWorldModules'>>>,
): Pick<SaveOnboardingState, 'unlockedTabs' | 'unlockedWorldModules' | 'teaserWorldModules'> {
  const tabs: GameTab[] = [];
  const worldModules: LiveWorldModuleKey[] = [];
  const teaserWorldModules: LiveWorldModuleKey[] = [];

  for (const unlock of unlocks) {
    tabs.push(...(unlock.unlockedTabs ?? []));
    worldModules.push(...(unlock.unlockedWorldModules ?? []));
    teaserWorldModules.push(...(unlock.teaserWorldModules ?? []));
  }

  const worldSet = new Set(worldModules);
  return {
    unlockedTabs: unique(tabs),
    unlockedWorldModules: unique(worldModules),
    teaserWorldModules: unique(teaserWorldModules).filter((moduleKey) => !worldSet.has(moduleKey)),
  };
}

export function resolveOnboardingUnlocksThroughMilestone(args: {
  milestones?: OnboardingMilestoneContent[];
  completedMilestoneIds: OnboardingMilestoneId[];
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
}): Pick<SaveOnboardingState, 'unlockedTabs' | 'unlockedWorldModules' | 'teaserWorldModules'> {
  const maxCompletedIndex = args.completedMilestoneIds.reduce(
    (max, id) => Math.max(max, ONBOARDING_MILESTONE_INDEX[id] ?? -1),
    -1,
  );
  const activeIndex = args.activeMilestoneId && args.activeMilestoneId !== 'complete'
    ? ONBOARDING_MILESTONE_INDEX[args.activeMilestoneId]
    : args.activeMilestoneId === 'complete'
      ? ONBOARDING_MILESTONE_IDS.length - 1
      : -1;
  const maxIndex = Math.max(maxCompletedIndex, activeIndex);

  const contentById = new Map((args.milestones ?? []).map((milestone) => [milestone.id, milestone]));
  const slices = ONBOARDING_MILESTONE_IDS.slice(0, maxIndex + 1).map((id) => {
    const authored = contentById.get(id)?.unlocks;
    const fallback = DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[id];
    return {
      unlockedTabs: authored?.tabs ?? fallback.tabs,
      unlockedWorldModules: authored?.worldModules ?? fallback.worldModules,
      teaserWorldModules: authored?.teaserWorldModules ?? fallback.teaserWorldModules,
    };
  });
  return mergeOnboardingUnlocks(slices);
}

export function resolveActiveOnboardingMilestone(args: {
  milestones: OnboardingMilestoneContent[];
  state: SaveOnboardingState;
  snapshot: OnboardingSnapshot;
}): OnboardingRuntimeMilestoneId | null {
  const { state, snapshot } = args;
  if (state.devOverride?.unlockAll) return 'complete';
  if (state.devOverride?.forceMilestoneId !== undefined) return state.devOverride.forceMilestoneId ?? null;
  if (state.firstLifeOnlyComplete || snapshot.foundationReached) return 'complete';
  if (!snapshot.selectedPath || !snapshot.selectedHeartLawId) return 'M0_life_start';

  if (snapshot.gateResolvedEvidence || snapshot.eventFacts.firstGateResolvedAt) return 'M10_foundation_graduation';
  if (snapshot.trialAttemptEvidence || snapshot.substage >= 9) return 'M9_gate_trial';
  if (snapshot.ruinsRunEvidence || snapshot.bountyEvidence || snapshot.eventFacts.firstRuinOrBountySupportAt) return 'M9_gate_trial';
  if (snapshot.forgeUpgradeEvidence || snapshot.eventFacts.firstForgeUpgradeAt) return 'M8_ruins_bounties';
  if (snapshot.pouchEquippedCount > 0 || snapshot.activeExpeditionCount > 0 || snapshot.eventFacts.firstPouchEquippedAt) return 'M7_forge';
  if (snapshot.equippedTechniqueCount > 0 || snapshot.eventFacts.firstTechniqueEquippedAt) return 'M6_apothecary_expedition';
  if (snapshot.unlockedTechniqueCount > 0 || snapshot.manualStudyActive || snapshot.eventFacts.firstManualStudyObservedAt) return 'M5_techniques_loadout';
  if (snapshot.manualCount > 0 || snapshot.eventFacts.firstManualAcquiredAt) return 'M4_pavilion_satchel';
  if (snapshot.eventFacts.firstOutskirtsRewardClaimedAt || snapshot.inventoryItemCount > 0 || snapshot.substage >= 3) return 'M3_world_outskirts';
  if (snapshot.eventFacts.statusOpenedAt || snapshot.substage >= 2) return 'M2_status_unlock';
  return 'M1_cultivation_only';
}
