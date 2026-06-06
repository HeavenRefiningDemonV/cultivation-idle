import type {
  OnboardingLedgerEntry,
  OnboardingMilestoneContent,
} from './onboardingTypes.js';
import { getOnboardingMilestoneById } from './onboardingContent.js';
import { getOnboardingPhaseLabel } from './onboardingMilestoneSurface.js';

export type OnboardingLedgerSurfaceState = 'empty' | 'ready';

export interface OnboardingLedgerEntrySurface {
  replayId: string;
  cardId: string;
  title: string;
  body: string;
  milestoneId: OnboardingLedgerEntry['milestoneId'];
  milestoneLabel: string;
  phaseLabel: string;
  unlockedAt: number;
  moreDetail: string | null;
}

export interface OnboardingLedgerSurface {
  state: OnboardingLedgerSurfaceState;
  title: string;
  emptyMessage: string;
  entries: OnboardingLedgerEntrySurface[];
}

export interface BuildOnboardingLedgerSurfaceInput {
  milestones: readonly OnboardingMilestoneContent[];
  entries: readonly OnboardingLedgerEntry[];
}

export function buildOnboardingLedgerSurface(
  input: BuildOnboardingLedgerSurfaceInput,
): OnboardingLedgerSurface {
  const seen = new Set<string>();
  const entries: OnboardingLedgerEntrySurface[] = [];

  for (const entry of [...input.entries].sort((left, right) => left.unlockedAt - right.unlockedAt)) {
    const key = `${entry.replayId}:${entry.milestoneId}:${entry.cardId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const milestone = getOnboardingMilestoneById(input.milestones, entry.milestoneId);
    entries.push({
      replayId: entry.replayId,
      cardId: entry.cardId,
      title: entry.title,
      body: entry.body,
      milestoneId: entry.milestoneId,
      milestoneLabel: milestone?.label ?? entry.title,
      phaseLabel: milestone ? getOnboardingPhaseLabel(milestone.phase) : 'Tutorial',
      unlockedAt: entry.unlockedAt,
      moreDetail: milestone?.tutorialCard.moreDetail ?? null,
    });
  }

  return {
    state: entries.length > 0 ? 'ready' : 'empty',
    title: 'Tutorial Ledger',
    emptyMessage: 'Lessons you have seen will appear here for replay.',
    entries,
  };
}
