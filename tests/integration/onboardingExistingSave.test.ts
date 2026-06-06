import assert from 'node:assert/strict';
import test from 'node:test';

import { CURRENT_SAVE_VERSION } from '../../src/save/migrations/saveVersion.js';
import { v2_1_0_backfill_onboarding_state } from '../../src/save/migrations/steps/v2_1_0/backfillOnboardingState.js';
import type { MigrationContext } from '../../src/save/migrations/migrationTypes.js';
import { ONBOARDING_MILESTONE_IDS } from '../../src/systems/onboarding/onboardingTypes.js';

const NOW = 2_700_000;

function migrationContext(): MigrationContext {
  return {
    mode: 'apply',
    sourceVersion: '2.0.0',
    sourceVersionKind: 'legacy-versioned',
    targetVersion: CURRENT_SAVE_VERSION,
    nowMs: NOW,
  };
}

function foundationSaveWithMalformedOnboarding(): Record<string, unknown> {
  return {
    version: '2.0.0',
    timestamp: NOW,
    gameState: {
      realm: { index: 1, substage: 1, name: 'Foundation Building' },
      selectedPath: 'heaven',
    },
    heartLawState: {
      selectedHeartLawId: 'heart_law_quiet_breath',
    },
    onboardingState: {
      schemaVersion: 'onboarding-v1',
      activeMilestoneId: 'M0_life_start',
      completedMilestoneIds: [],
      unlockedTabs: [],
      unlockedWorldModules: [],
      teaserWorldModules: [],
      seenTutorialCardIds: [],
      queuedTutorialCardIds: ['card_life_start'],
      dismissedCoachmarkIds: [],
      tutorialLedgerEntries: [],
      eventFacts: {},
      firstLifeOnlyComplete: false,
      migratedFromVersion: '2.0.0',
      updatedAt: NOW - 1,
      devOverride: null,
    },
  };
}

test('v2.1.0 onboarding migration repairs Foundation saves whose tutorial state would hide advanced tabs', () => {
  const result = v2_1_0_backfill_onboarding_state.run(
    foundationSaveWithMalformedOnboarding(),
    migrationContext(),
  );
  const onboardingState = result.save.onboardingState as {
    activeMilestoneId: string;
    firstLifeOnlyComplete: boolean;
    completedMilestoneIds: string[];
    queuedTutorialCardIds: string[];
  };

  assert.equal(onboardingState.activeMilestoneId, 'complete');
  assert.equal(onboardingState.firstLifeOnlyComplete, true);
  assert.deepEqual(onboardingState.completedMilestoneIds, [...ONBOARDING_MILESTONE_IDS]);
  assert.deepEqual(onboardingState.queuedTutorialCardIds, []);
  assert.equal(
    result.warnings.some((entry) => entry.code === 'advanced-save-onboarding-reinferred'),
    true,
  );
});
