import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { createDefaultOnboardingState, useOnboardingStore } from '../../src/stores/onboardingStore.js';
import {
  __resetOnboardingEventBridgeForTests,
  initOnboardingEventBridge,
} from '../../src/systems/onboarding/onboardingEventBridge.js';
import type { OnboardingMilestoneContent } from '../../src/systems/onboarding/onboardingTypes.js';
import { ONBOARDING_MILESTONE_IDS } from '../../src/systems/onboarding/onboardingTypes.js';

const NOW = 2_600_000;
const FOUNDATION_CARD_ID = 'card_foundation_graduation';

function loadMilestones(): OnboardingMilestoneContent[] {
  const raw = JSON.parse(
    readFileSync('public/cultivation_idle_content_bible_v1_config/onboarding_milestones.json', 'utf8'),
  ) as { milestones: OnboardingMilestoneContent[] };
  return raw.milestones;
}

function completedThrough(indexInclusive: number) {
  return ONBOARDING_MILESTONE_IDS.slice(0, indexInclusive + 1);
}

test.beforeEach(() => {
  __resetOnboardingEventBridgeForTests();
  useContentStore.setState({
    raw: { onboarding_milestones: { milestones: loadMilestones() } } as never,
  });
});

test.afterEach(() => {
  __resetOnboardingEventBridgeForTests();
});

test('Gate clear completes M9 and activates M10 without showing the Foundation graduation card early', () => {
  useOnboardingStore.getState().hydrate({
    ...createDefaultOnboardingState(NOW),
    activeMilestoneId: 'M9_gate_trial',
    completedMilestoneIds: completedThrough(8),
  });
  initOnboardingEventBridge();

  GameEvents.emit({
    type: 'progression/gate_resolved',
    payload: {
      timestamp: NOW + 1,
      runStartTime: NOW,
      elapsedMsSinceLifeStart: 1,
      trialId: 'trial_foundation_gate',
      fromRealmId: 'qi_condensation',
      toRealmId: 'foundation_building',
      gateIndex: 1,
      cityId: 'city_pinewind_hamlet',
      resolution: 'cleared',
    },
  });

  const state = useOnboardingStore.getState();
  assert.equal(state.activeMilestoneId, 'M10_foundation_graduation');
  assert.equal(state.completedMilestoneIds.includes('M9_gate_trial'), true);
  assert.equal(state.completedMilestoneIds.includes('M10_foundation_graduation'), false);
  assert.equal(state.firstLifeOnlyComplete, false);
  assert.equal(state.queuedTutorialCardIds.includes(FOUNDATION_CARD_ID), false);
});

test('Foundation breakthrough completes M10 and queues the graduation card exactly once', () => {
  useOnboardingStore.getState().hydrate({
    ...createDefaultOnboardingState(NOW),
    activeMilestoneId: 'M10_foundation_graduation',
    completedMilestoneIds: completedThrough(9),
  });
  initOnboardingEventBridge();

  const breakthroughEvent = {
    type: 'progression/breakthrough_completed' as const,
    payload: {
      timestamp: NOW + 2,
      fromRealmIndex: 0,
      fromSubstage: 9,
      toRealmIndex: 1,
      toSubstage: 1,
      major: true,
    },
  };

  GameEvents.emit(breakthroughEvent);
  GameEvents.emit(breakthroughEvent);

  const state = useOnboardingStore.getState();
  assert.equal(state.activeMilestoneId, 'complete');
  assert.equal(state.firstLifeOnlyComplete, true);
  assert.deepEqual(
    state.queuedTutorialCardIds.filter((cardId) => cardId === FOUNDATION_CARD_ID),
    [FOUNDATION_CARD_ID],
  );
});

test('Already complete or later-life saves do not replay the full Foundation graduation card', () => {
  useOnboardingStore.getState().hydrate({
    ...createDefaultOnboardingState(NOW),
    activeMilestoneId: 'complete',
    completedMilestoneIds: [...ONBOARDING_MILESTONE_IDS],
    firstLifeOnlyComplete: true,
    queuedTutorialCardIds: [],
    seenTutorialCardIds: [],
  });
  initOnboardingEventBridge();

  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: NOW + 3,
      fromRealmIndex: 0,
      fromSubstage: 9,
      toRealmIndex: 1,
      toSubstage: 1,
      major: true,
    },
  });

  assert.equal(useOnboardingStore.getState().queuedTutorialCardIds.includes(FOUNDATION_CARD_ID), false);
});
