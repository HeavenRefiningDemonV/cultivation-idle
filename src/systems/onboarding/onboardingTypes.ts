import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';

export const ONBOARDING_SCHEMA_VERSION = 'onboarding-v1' as const;

export const ONBOARDING_MILESTONE_IDS = [
  'M0_life_start',
  'M1_cultivation_only',
  'M2_status_unlock',
  'M3_world_outskirts',
  'M4_pavilion_satchel',
  'M5_techniques_loadout',
  'M6_apothecary_expedition',
  'M7_forge',
  'M8_ruins_bounties',
  'M9_gate_trial',
  'M10_foundation_graduation',
] as const;

export type OnboardingMilestoneId = (typeof ONBOARDING_MILESTONE_IDS)[number];
export type OnboardingRuntimeMilestoneId = OnboardingMilestoneId | 'complete';

export const ONBOARDING_PHASES = [
  'life_start',
  'cultivation',
  'diagnosis',
  'field_loop',
  'knowledge',
  'buildcraft',
  'preparation',
  'gear_floor',
  'support_rotation',
  'gate_exam',
  'graduation',
] as const;

export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];

export const ONBOARDING_TAB_KEYS = [
  'cultivation',
  'status',
  'adventure',
  'inventory',
  'techniques',
  'records',
  'prestige',
  'settings',
] as const satisfies readonly GameTab[];

export const ONBOARDING_LIVE_WORLD_MODULE_KEYS = [
  'outskirts',
  'ruins',
  'gateTrial',
  'trainingHall',
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
] as const satisfies readonly LiveWorldModuleKey[];

export type OnboardingRouteTarget =
  | { kind: 'none' }
  | { kind: 'life_start' }
  | { kind: 'tab'; tab: GameTab }
  | { kind: 'world_module'; moduleKey: LiveWorldModuleKey; cityId?: string | null }
  | { kind: 'modal'; modalKey: 'manualSatchel' | 'medicinePouch' | 'tutorialLedger' };

export type OnboardingCompletionDescriptor =
  | { kind: 'store_fact'; fact: string }
  | { kind: 'event'; eventType: string; match?: Record<string, unknown> }
  | { kind: 'compound'; all?: OnboardingCompletionDescriptor[]; any?: OnboardingCompletionDescriptor[] };

export interface OnboardingUnlockDescriptor {
  tabs: GameTab[];
  worldModules: LiveWorldModuleKey[];
  teaserWorldModules: LiveWorldModuleKey[];
  flags?: string[];
}

export interface OnboardingObjectiveDescriptor {
  title: string;
  why: string;
  route: OnboardingRouteTarget;
  completion: OnboardingCompletionDescriptor;
  rewardPreview?: string;
  optionalTip?: string;
}

export interface OnboardingTutorialCardDescriptor {
  id: string;
  title: string;
  body: string;
  cta: string;
  moreDetail?: string;
}

export interface OnboardingMilestoneContent {
  id: OnboardingMilestoneId;
  order: number;
  label: string;
  phase: OnboardingPhase;
  firstLifeOnly: boolean;
  trigger: Record<string, unknown>;
  unlocks: OnboardingUnlockDescriptor;
  objective: OnboardingObjectiveDescriptor;
  tutorialCard: OnboardingTutorialCardDescriptor;
  sourceSinkNote: string | null;
  replayId: string;
  migrationHints?: Array<Record<string, unknown>>;
}

export interface OnboardingMilestonesConfig {
  version: typeof ONBOARDING_SCHEMA_VERSION;
  designNotes?: string[];
  milestones: OnboardingMilestoneContent[];
}

export interface OnboardingLedgerEntry {
  replayId: string;
  cardId: string;
  title: string;
  body: string;
  milestoneId: OnboardingMilestoneId;
  unlockedAt: number;
}

export interface OnboardingRouteHint {
  label: string;
  target?: {
    kind: 'tab' | 'world_module' | 'screen' | 'none';
    tab?: GameTab;
    moduleKey?: LiveWorldModuleKey;
  };
  reason: string;
  milestoneId?: OnboardingRuntimeMilestoneId | null;
}

export interface OnboardingLockedSurface {
  key: string;
  label: string;
  state: 'locked' | 'teaser' | 'hidden' | 'deferred';
  reason: string;
  requirement?: string;
  routeHint?: OnboardingRouteHint;
  milestoneId?: OnboardingRuntimeMilestoneId | null;
}

export interface OnboardingEventFactState {
  statusOpenedAt?: number;
  firstOutskirtsRewardClaimedAt?: number;
  firstManualAcquiredAt?: number;
  firstManualStudyObservedAt?: number;
  firstTechniqueEquippedAt?: number;
  firstExpeditionStartedAt?: number;
  firstPouchEquippedAt?: number;
  firstForgeUpgradeAt?: number;
  firstRuinOrBountySupportAt?: number;
  firstGateResolvedAt?: number;
  firstFoundationBreakthroughAt?: number;
  lastGateDefeat?: OnboardingGateDefeatFact;
}

export interface OnboardingGateDefeatFact {
  timestamp: number;
  diagnosisCode?: string;
  topFixDestination?: string;
  topFixReason?: string;
}

export type OnboardingTimestampEventFactKey = Exclude<keyof OnboardingEventFactState, 'lastGateDefeat'>;

export interface SaveOnboardingState {
  schemaVersion: typeof ONBOARDING_SCHEMA_VERSION;
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  completedMilestoneIds: OnboardingMilestoneId[];
  unlockedTabs: GameTab[];
  unlockedWorldModules: LiveWorldModuleKey[];
  teaserWorldModules: LiveWorldModuleKey[];
  seenTutorialCardIds: string[];
  queuedTutorialCardIds: string[];
  dismissedCoachmarkIds: string[];
  tutorialLedgerEntries: OnboardingLedgerEntry[];
  eventFacts: OnboardingEventFactState;
  firstLifeOnlyComplete: boolean;
  migratedFromVersion: string | null;
  updatedAt: number;
  devOverride?: {
    forceMilestoneId?: OnboardingRuntimeMilestoneId | null;
    unlockAll?: boolean;
  } | null;
}

export const ONBOARDING_MILESTONE_INDEX: Record<OnboardingMilestoneId, number> = Object.fromEntries(
  ONBOARDING_MILESTONE_IDS.map((id, index) => [id, index]),
) as Record<OnboardingMilestoneId, number>;

export const DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE = {
  M0_life_start: { tabs: [], worldModules: [], teaserWorldModules: [] },
  M1_cultivation_only: { tabs: ['cultivation'], worldModules: [], teaserWorldModules: [] },
  M2_status_unlock: { tabs: ['cultivation', 'status'], worldModules: [], teaserWorldModules: [] },
  M3_world_outskirts: {
    tabs: ['cultivation', 'status', 'adventure'],
    worldModules: ['outskirts', 'trainingHall'],
    teaserWorldModules: ['manualPavilion'],
  },
  M4_pavilion_satchel: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion'],
    teaserWorldModules: [],
  },
  M5_techniques_loadout: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion'],
    teaserWorldModules: [],
  },
  M6_apothecary_expedition: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions'],
    teaserWorldModules: ['forge'],
  },
  M7_forge: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge'],
    teaserWorldModules: [],
  },
  M8_ruins_bounties: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties'],
    teaserWorldModules: ['gateTrial'],
  },
  M9_gate_trial: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
    teaserWorldModules: [],
  },
  M10_foundation_graduation: {
    tabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques'],
    worldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
    teaserWorldModules: [],
  },
} as const satisfies Record<OnboardingMilestoneId, OnboardingUnlockDescriptor>;

export function isOnboardingMilestoneId(value: unknown): value is OnboardingMilestoneId {
  return typeof value === 'string' && (ONBOARDING_MILESTONE_IDS as readonly string[]).includes(value);
}

export function isOnboardingRuntimeMilestoneId(value: unknown): value is OnboardingRuntimeMilestoneId {
  return value === 'complete' || isOnboardingMilestoneId(value);
}

export function compareOnboardingMilestones(left: OnboardingMilestoneId, right: OnboardingMilestoneId): number {
  return ONBOARDING_MILESTONE_INDEX[left] - ONBOARDING_MILESTONE_INDEX[right];
}
