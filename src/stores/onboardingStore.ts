import { create } from 'zustand';
import type { GameTab } from './uiStore.js';
import type { LiveWorldModuleKey } from '../content/types.js';
import type {
  OnboardingEventFactState,
  OnboardingGateDefeatFact,
  OnboardingLedgerEntry,
  OnboardingMilestoneId,
  OnboardingRuntimeMilestoneId,
  OnboardingTimestampEventFactKey,
  SaveOnboardingState,
} from '../systems/onboarding/onboardingTypes.js';
import {
  compareOnboardingMilestones,
  DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE,
  isOnboardingMilestoneId,
  isOnboardingRuntimeMilestoneId,
  ONBOARDING_LIVE_WORLD_MODULE_KEYS,
  ONBOARDING_MILESTONE_IDS,
  ONBOARDING_SCHEMA_VERSION,
  ONBOARDING_TAB_KEYS,
} from '../systems/onboarding/onboardingTypes.js';
import { getNextOnboardingMilestoneId } from '../systems/onboarding/onboardingProgression.js';

type OnboardingUnlockPatch = Partial<Pick<SaveOnboardingState, 'unlockedTabs' | 'unlockedWorldModules' | 'teaserWorldModules'>>;

interface OnboardingStoreState extends SaveOnboardingState {
  activateMilestone: (milestoneId: OnboardingRuntimeMilestoneId | null, reason?: string) => void;
  completeMilestone: (milestoneId: OnboardingMilestoneId, completedAt?: number) => void;
  applyUnlocks: (unlocks: OnboardingUnlockPatch) => void;
  queueTutorialCard: (cardId: string) => void;
  markCardSeen: (
    cardId: string,
    ledgerEntry?: Omit<OnboardingLedgerEntry, 'unlockedAt'> & { unlockedAt?: number },
  ) => void;
  dismissCoachmark: (coachmarkId: string) => void;
  addLedgerEntry: (entry: OnboardingLedgerEntry) => void;
  recordEventFact: (fact: OnboardingTimestampEventFactKey, timestamp?: number) => void;
  recordGateDefeat: (fact: OnboardingGateDefeatFact) => void;
  resetForNewLife: (opts?: { preserveLedger?: boolean; reason?: string }) => void;
  applyMigration: (state: SaveOnboardingState) => void;
  setDevOverride: (override: SaveOnboardingState['devOverride']) => void;
  hydrate: (slice?: Partial<SaveOnboardingState> | null) => void;
  toSaveState: () => SaveOnboardingState;
}

const validTabSet = new Set<string>(ONBOARDING_TAB_KEYS);
const validModuleSet = new Set<string>(ONBOARDING_LIVE_WORLD_MODULE_KEYS);

const uniqueStrings = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string')));
};

const sanitizeTabs = (values: unknown): GameTab[] =>
  uniqueStrings(values).filter((value): value is GameTab => validTabSet.has(value));

const sanitizeModules = (values: unknown): LiveWorldModuleKey[] =>
  uniqueStrings(values).filter((value): value is LiveWorldModuleKey => validModuleSet.has(value));

const sanitizeMilestones = (values: unknown): OnboardingMilestoneId[] =>
  uniqueStrings(values)
    .filter(isOnboardingMilestoneId)
    .sort(compareOnboardingMilestones);

const sanitizeLedgerEntries = (values: unknown): OnboardingLedgerEntry[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const entries: OnboardingLedgerEntry[] = [];
  for (const value of values) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const entry = value as Partial<OnboardingLedgerEntry>;
    if (
      typeof entry.replayId !== 'string' ||
      typeof entry.cardId !== 'string' ||
      typeof entry.title !== 'string' ||
      typeof entry.body !== 'string' ||
      !isOnboardingMilestoneId(entry.milestoneId) ||
      typeof entry.unlockedAt !== 'number'
    ) {
      continue;
    }
    const key = `${entry.replayId}:${entry.milestoneId}:${entry.cardId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      replayId: entry.replayId,
      cardId: entry.cardId,
      title: entry.title,
      body: entry.body,
      milestoneId: entry.milestoneId,
      unlockedAt: entry.unlockedAt,
    });
  }
  return entries;
};

const sanitizeGateDefeatFact = (value: unknown): OnboardingGateDefeatFact | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.timestamp !== 'number' || !Number.isFinite(raw.timestamp)) return null;
  return {
    timestamp: raw.timestamp,
    ...(typeof raw.diagnosisCode === 'string' ? { diagnosisCode: raw.diagnosisCode } : {}),
    ...(typeof raw.topFixDestination === 'string' ? { topFixDestination: raw.topFixDestination } : {}),
    ...(typeof raw.topFixReason === 'string' ? { topFixReason: raw.topFixReason } : {}),
  };
};

const sanitizeEventFacts = (value: unknown): OnboardingEventFactState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const facts: OnboardingEventFactState = {};
  ([
    'statusOpenedAt',
    'firstOutskirtsRewardClaimedAt',
    'firstManualAcquiredAt',
    'firstManualStudyObservedAt',
    'firstTechniqueEquippedAt',
    'firstExpeditionStartedAt',
    'firstPouchEquippedAt',
    'firstForgeUpgradeAt',
    'firstRuinOrBountySupportAt',
    'firstGateResolvedAt',
    'firstFoundationBreakthroughAt',
  ] as const).forEach((key) => {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) {
      facts[key] = raw[key];
    }
  });
  const lastGateDefeat = sanitizeGateDefeatFact(raw.lastGateDefeat);
  if (lastGateDefeat) {
    facts.lastGateDefeat = lastGateDefeat;
  }
  return facts;
};

const sanitizeDevOverride = (value: unknown): SaveOnboardingState['devOverride'] => {
  if (value == null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  return {
    forceMilestoneId: raw.forceMilestoneId === undefined || raw.forceMilestoneId === null
      ? null
      : isOnboardingRuntimeMilestoneId(raw.forceMilestoneId)
        ? raw.forceMilestoneId
        : null,
    unlockAll: raw.unlockAll === undefined ? undefined : Boolean(raw.unlockAll),
  };
};

const saveFields = (state: SaveOnboardingState): SaveOnboardingState => ({
  schemaVersion: state.schemaVersion,
  activeMilestoneId: state.activeMilestoneId,
  completedMilestoneIds: [...state.completedMilestoneIds],
  unlockedTabs: [...state.unlockedTabs],
  unlockedWorldModules: [...state.unlockedWorldModules],
  teaserWorldModules: [...state.teaserWorldModules],
  seenTutorialCardIds: [...state.seenTutorialCardIds],
  queuedTutorialCardIds: [...state.queuedTutorialCardIds],
  dismissedCoachmarkIds: [...state.dismissedCoachmarkIds],
  tutorialLedgerEntries: state.tutorialLedgerEntries.map((entry) => ({ ...entry })),
  eventFacts: {
    ...state.eventFacts,
    lastGateDefeat: state.eventFacts.lastGateDefeat ? { ...state.eventFacts.lastGateDefeat } : undefined,
  },
  firstLifeOnlyComplete: state.firstLifeOnlyComplete,
  migratedFromVersion: state.migratedFromVersion,
  updatedAt: state.updatedAt,
  devOverride: state.devOverride ? { ...state.devOverride } : null,
});

export function createDefaultOnboardingState(now = Date.now()): SaveOnboardingState {
  return {
    schemaVersion: ONBOARDING_SCHEMA_VERSION,
    activeMilestoneId: 'M0_life_start',
    completedMilestoneIds: [],
    unlockedTabs: [],
    unlockedWorldModules: [],
    teaserWorldModules: [],
    seenTutorialCardIds: [],
    queuedTutorialCardIds: [],
    dismissedCoachmarkIds: [],
    tutorialLedgerEntries: [],
    eventFacts: {},
    firstLifeOnlyComplete: false,
    migratedFromVersion: null,
    updatedAt: now,
    devOverride: null,
  };
}

export function sanitizeOnboardingState(raw: unknown, fallback = createDefaultOnboardingState()): SaveOnboardingState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return saveFields(fallback);
  const input = raw as Record<string, unknown>;
  const completedMilestoneIds = sanitizeMilestones(input.completedMilestoneIds);
  const activeMilestoneId = isOnboardingRuntimeMilestoneId(input.activeMilestoneId)
    ? input.activeMilestoneId
    : input.activeMilestoneId === null
      ? null
      : fallback.activeMilestoneId;
  const firstLifeOnlyComplete = Boolean(input.firstLifeOnlyComplete) || activeMilestoneId === 'complete';

  return {
    schemaVersion: ONBOARDING_SCHEMA_VERSION,
    activeMilestoneId: firstLifeOnlyComplete ? 'complete' : activeMilestoneId,
    completedMilestoneIds: firstLifeOnlyComplete ? [...ONBOARDING_MILESTONE_IDS] : completedMilestoneIds,
    unlockedTabs: sanitizeTabs(input.unlockedTabs),
    unlockedWorldModules: sanitizeModules(input.unlockedWorldModules),
    teaserWorldModules: sanitizeModules(input.teaserWorldModules),
    seenTutorialCardIds: uniqueStrings(input.seenTutorialCardIds),
    queuedTutorialCardIds: uniqueStrings(input.queuedTutorialCardIds),
    dismissedCoachmarkIds: uniqueStrings(input.dismissedCoachmarkIds),
    tutorialLedgerEntries: sanitizeLedgerEntries(input.tutorialLedgerEntries),
    eventFacts: sanitizeEventFacts(input.eventFacts),
    firstLifeOnlyComplete,
    migratedFromVersion: typeof input.migratedFromVersion === 'string' ? input.migratedFromVersion : null,
    updatedAt: typeof input.updatedAt === 'number' && Number.isFinite(input.updatedAt) ? input.updatedAt : fallback.updatedAt,
    devOverride: sanitizeDevOverride(input.devOverride),
  };
}

const union = <T extends string>(left: readonly T[], right: readonly T[]): T[] => Array.from(new Set([...left, ...right]));

const addLedgerEntry = (entries: OnboardingLedgerEntry[], entry: OnboardingLedgerEntry): OnboardingLedgerEntry[] => {
  const key = `${entry.replayId}:${entry.milestoneId}:${entry.cardId}`;
  if (entries.some((existing) => `${existing.replayId}:${existing.milestoneId}:${existing.cardId}` === key)) {
    return entries;
  }
  return [...entries, { ...entry }];
};

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  ...createDefaultOnboardingState(),

  activateMilestone: (milestoneId) => {
    if (get().activeMilestoneId === milestoneId) return;
    set({ activeMilestoneId: milestoneId, updatedAt: Date.now() });
  },

  completeMilestone: (milestoneId, completedAt = Date.now()) => {
    const current = get();
    const completedMilestoneIds = sanitizeMilestones([...current.completedMilestoneIds, milestoneId]);
    const nextActive = milestoneId === 'M10_foundation_graduation'
      ? 'complete'
      : current.activeMilestoneId === milestoneId || current.activeMilestoneId === null
        ? getNextOnboardingMilestoneId(milestoneId)
        : current.activeMilestoneId;
    const graduation = milestoneId === 'M10_foundation_graduation';
    const milestoneUnlocks = DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[milestoneId];
    const newlyUnlockedWorldModules = new Set<LiveWorldModuleKey>(
      milestoneUnlocks.worldModules as readonly LiveWorldModuleKey[],
    );
    set({
      completedMilestoneIds,
      activeMilestoneId: graduation ? 'complete' : nextActive,
      firstLifeOnlyComplete: current.firstLifeOnlyComplete || graduation,
      unlockedTabs: union(current.unlockedTabs, milestoneUnlocks.tabs),
      unlockedWorldModules: union(current.unlockedWorldModules, milestoneUnlocks.worldModules),
      teaserWorldModules: union(current.teaserWorldModules, milestoneUnlocks.teaserWorldModules).filter(
        (moduleKey) => !newlyUnlockedWorldModules.has(moduleKey),
      ),
      updatedAt: completedAt,
    });
  },

  applyUnlocks: (unlocks) => {
    const current = get();
    const nextTabs = union(current.unlockedTabs, sanitizeTabs(unlocks.unlockedTabs));
    const nextWorld = union(current.unlockedWorldModules, sanitizeModules(unlocks.unlockedWorldModules));
    const nextTeaser = union(current.teaserWorldModules, sanitizeModules(unlocks.teaserWorldModules)).filter(
      (moduleKey) => !nextWorld.includes(moduleKey),
    );
    if (
      nextTabs.join('|') === current.unlockedTabs.join('|') &&
      nextWorld.join('|') === current.unlockedWorldModules.join('|') &&
      nextTeaser.join('|') === current.teaserWorldModules.join('|')
    ) {
      return;
    }
    set({ unlockedTabs: nextTabs, unlockedWorldModules: nextWorld, teaserWorldModules: nextTeaser, updatedAt: Date.now() });
  },

  queueTutorialCard: (cardId) => {
    if (!cardId || get().seenTutorialCardIds.includes(cardId) || get().queuedTutorialCardIds.includes(cardId)) return;
    set({ queuedTutorialCardIds: [...get().queuedTutorialCardIds, cardId], updatedAt: Date.now() });
  },

  markCardSeen: (cardId, ledgerEntry) => {
    if (!cardId) return;
    const current = get();
    const seenTutorialCardIds = current.seenTutorialCardIds.includes(cardId)
      ? current.seenTutorialCardIds
      : [...current.seenTutorialCardIds, cardId];
    const nextLedger = ledgerEntry
      ? addLedgerEntry(current.tutorialLedgerEntries, { ...ledgerEntry, unlockedAt: ledgerEntry.unlockedAt ?? Date.now() })
      : current.tutorialLedgerEntries;
    set({
      seenTutorialCardIds,
      queuedTutorialCardIds: current.queuedTutorialCardIds.filter((id) => id !== cardId),
      tutorialLedgerEntries: nextLedger,
      updatedAt: Date.now(),
    });
  },

  dismissCoachmark: (coachmarkId) => {
    if (!coachmarkId || get().dismissedCoachmarkIds.includes(coachmarkId)) return;
    set({ dismissedCoachmarkIds: [...get().dismissedCoachmarkIds, coachmarkId], updatedAt: Date.now() });
  },

  addLedgerEntry: (entry) => {
    const next = addLedgerEntry(get().tutorialLedgerEntries, entry);
    if (next === get().tutorialLedgerEntries) return;
    set({ tutorialLedgerEntries: next, updatedAt: Date.now() });
  },

  recordEventFact: (fact, timestamp = Date.now()) => {
    const current = get().eventFacts[fact];
    if (typeof current === 'number') return;
    set({ eventFacts: { ...get().eventFacts, [fact]: timestamp }, updatedAt: timestamp });
  },

  recordGateDefeat: (fact) => {
    set({
      eventFacts: {
        ...get().eventFacts,
        lastGateDefeat: { ...fact },
      },
      updatedAt: fact.timestamp,
    });
  },

  resetForNewLife: (opts) => {
    const current = get();
    const fresh = createDefaultOnboardingState(Date.now());
    set({
      ...fresh,
      tutorialLedgerEntries: opts?.preserveLedger === false ? [] : current.tutorialLedgerEntries.map((entry) => ({ ...entry })),
      seenTutorialCardIds: opts?.preserveLedger === false ? [] : [...current.seenTutorialCardIds],
      firstLifeOnlyComplete: current.firstLifeOnlyComplete,
      activeMilestoneId: current.firstLifeOnlyComplete ? 'complete' : fresh.activeMilestoneId,
      completedMilestoneIds: current.firstLifeOnlyComplete ? [...ONBOARDING_MILESTONE_IDS] : [],
    });
  },

  applyMigration: (state) => {
    get().hydrate(state);
  },

  setDevOverride: (override) => {
    set({ devOverride: sanitizeDevOverride(override), updatedAt: Date.now() });
  },

  hydrate: (slice) => {
    set(sanitizeOnboardingState(slice ?? createDefaultOnboardingState(), createDefaultOnboardingState()));
  },

  toSaveState: () => saveFields(get()),
}));
