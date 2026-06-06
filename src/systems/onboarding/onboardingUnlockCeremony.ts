import type {
  OnboardingLedgerEntry,
  OnboardingMilestoneContent,
  OnboardingRouteTarget,
} from './onboardingTypes.js';

export type OnboardingUnlockCeremonyState = 'active' | 'suppressed';

export interface OnboardingUnlockCeremonyCardSurface {
  cardId: string;
  title: string;
  body: string;
  ctaLabel: string;
  moreDetail: string | null;
  milestoneId: OnboardingMilestoneContent['id'];
  route: OnboardingRouteTarget;
}

export interface OnboardingUnlockCeremonySurface {
  state: OnboardingUnlockCeremonyState;
  card: OnboardingUnlockCeremonyCardSurface;
  ledgerEntry: OnboardingLedgerEntry;
  remainingCount: number;
}

export interface BuildOnboardingUnlockCeremonySurfaceInput {
  milestones: readonly OnboardingMilestoneContent[];
  queuedCardIds: readonly string[];
  seenCardIds: readonly string[];
  suppressed: boolean;
  now?: number;
}

const SUPPRESSED_CARD: OnboardingUnlockCeremonyCardSurface = {
  cardId: '',
  title: '',
  body: '',
  ctaLabel: '',
  moreDetail: null,
  milestoneId: 'M0_life_start',
  route: { kind: 'none' },
};

const SUPPRESSED_LEDGER_ENTRY: OnboardingLedgerEntry = {
  replayId: '',
  cardId: '',
  title: '',
  body: '',
  milestoneId: 'M0_life_start',
  unlockedAt: 0,
};

function findMilestoneByCardId(
  milestones: readonly OnboardingMilestoneContent[],
  cardId: string,
): OnboardingMilestoneContent | null {
  return milestones.find((milestone) => milestone.tutorialCard.id === cardId) ?? null;
}

export function buildOnboardingUnlockCeremonySurface(
  input: BuildOnboardingUnlockCeremonySurfaceInput,
): OnboardingUnlockCeremonySurface | null {
  if (input.suppressed) {
    return {
      state: 'suppressed',
      card: SUPPRESSED_CARD,
      ledgerEntry: SUPPRESSED_LEDGER_ENTRY,
      remainingCount: 0,
    };
  }

  const seen = new Set(input.seenCardIds);
  const queuedMilestones = input.queuedCardIds
    .filter((cardId) => !seen.has(cardId))
    .map((cardId) => findMilestoneByCardId(input.milestones, cardId))
    .filter((milestone): milestone is OnboardingMilestoneContent => milestone !== null);

  const milestone = queuedMilestones[0];
  if (!milestone) return null;

  const card = milestone.tutorialCard;
  const now = input.now ?? Date.now();
  return {
    state: 'active',
    card: {
      cardId: card.id,
      title: card.title,
      body: card.body,
      ctaLabel: card.cta,
      moreDetail: card.moreDetail ?? null,
      milestoneId: milestone.id,
      route: milestone.objective.route,
    },
    ledgerEntry: {
      replayId: milestone.replayId,
      cardId: card.id,
      title: card.title,
      body: card.body,
      milestoneId: milestone.id,
      unlockedAt: now,
    },
    remainingCount: queuedMilestones.length,
  };
}
