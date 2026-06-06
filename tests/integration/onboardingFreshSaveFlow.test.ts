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

const NOW = 1_800_000;

function loadMilestones(): OnboardingMilestoneContent[] {
  const raw = JSON.parse(
    readFileSync('public/cultivation_idle_content_bible_v1_config/onboarding_milestones.json', 'utf8'),
  ) as { milestones: OnboardingMilestoneContent[] };
  return raw.milestones;
}

function activeMilestone() {
  return useOnboardingStore.getState().activeMilestoneId;
}

function completedMilestones() {
  return useOnboardingStore.getState().completedMilestoneIds;
}

test.beforeEach(() => {
  __resetOnboardingEventBridgeForTests();
  useContentStore.setState({
    raw: { onboarding_milestones: { milestones: loadMilestones() } } as never,
  });
  useOnboardingStore.getState().hydrate(createDefaultOnboardingState(NOW));
  initOnboardingEventBridge();
});

test.afterEach(() => {
  __resetOnboardingEventBridgeForTests();
});

test('fresh first-life events complete milestones in order without tutorial-card shortcuts', () => {
  GameEvents.emit({
    type: 'progression/life_started',
    payload: {
      timestamp: NOW + 1,
      runStartTime: NOW,
      elapsedMsSinceLifeStart: 1,
      lifeOrdinal: 1,
      sessionKind: 'first_life',
      trigger: 'fresh_start',
    },
  });
  assert.equal(activeMilestone(), 'M1_cultivation_only');
  assert.deepEqual(completedMilestones(), ['M0_life_start']);
  assert.deepEqual(useOnboardingStore.getState().unlockedTabs, ['cultivation']);

  useOnboardingStore.getState().queueTutorialCard('card_status_unlock');
  useOnboardingStore.getState().markCardSeen('card_status_unlock');
  assert.equal(activeMilestone(), 'M1_cultivation_only', 'reading a card must not complete gameplay milestones');

  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: NOW + 2,
      fromRealmIndex: 0,
      fromSubstage: 1,
      toRealmIndex: 0,
      toSubstage: 2,
      major: false,
    },
  });
  assert.equal(activeMilestone(), 'M2_status_unlock');

  GameEvents.emit({ type: 'ui/tab_changed', payload: { previous: 'cultivation', next: 'status' } });
  assert.equal(activeMilestone(), 'M3_world_outskirts');

  GameEvents.emit({
    type: 'combat/resolved',
    payload: { timestamp: NOW + 3, outcome: 'victory', source: 'outskirts', cityId: 'city_pinewind_hamlet' },
  });
  assert.equal(activeMilestone(), 'M4_pavilion_satchel');

  GameEvents.emit({
    type: 'pavilion/buy_success',
    payload: { pavilionId: 'pavilion_pinewind', slotIndex: 0, techniqueId: 'tech_test', outcome: 'manual', mode: 'buy' },
  });
  assert.equal(activeMilestone(), 'M5_techniques_loadout');

  GameEvents.emit({
    type: 'techniques/equip_changed',
    payload: { techniqueId: 'tech_test', slotType: 'active', slotIndex: 0, action: 'equip' },
  });
  assert.equal(activeMilestone(), 'M6_apothecary_expedition');

  GameEvents.emit({
    type: 'expeditions/started',
    payload: {
      timestamp: NOW + 4,
      slotIndex: 0,
      expeditionTypeId: 'herb_gathering',
      durationId: 'short',
      durationSeconds: 60,
      cityId: 'city_pinewind_hamlet',
    },
  });
  assert.equal(activeMilestone(), 'M6_apothecary_expedition', 'starting a route alone should not stock the pouch');

  GameEvents.emit({ type: 'pouch/equip', payload: { slotKey: 'healing', itemId: 'cons_healing_pellet_t1' } });
  assert.equal(activeMilestone(), 'M7_forge');

  GameEvents.emit({ type: 'forge/refine_result', payload: { ok: false } });
  assert.equal(activeMilestone(), 'M7_forge', 'failed forge actions must not complete the forge milestone');

  GameEvents.emit({ type: 'forge/refine_result', payload: { ok: true } });
  assert.equal(activeMilestone(), 'M8_ruins_bounties');

  GameEvents.emit({
    type: 'combat/resolved',
    payload: { timestamp: NOW + 5, outcome: 'defeat', source: 'ruins', cityId: 'city_pinewind_hamlet' },
  });
  assert.equal(activeMilestone(), 'M8_ruins_bounties', 'ruin defeats must not complete support routing');

  GameEvents.emit({
    type: 'combat/resolved',
    payload: { timestamp: NOW + 6, outcome: 'victory', source: 'ruins', ruinId: 'ruin_pinewind' },
  });
  assert.equal(activeMilestone(), 'M9_gate_trial');

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: NOW + 7,
      trialId: 'trial_foundation_gate',
      gateIndex: 0,
      attemptId: 'attempt-defeat',
      outcome: 'defeated',
      durationSec: 42,
      countsTowardFailSafe: true,
      eligibleFailCountAfterAttempt: 1,
      diagnosisCode: 'healing_low',
      topFixDestination: 'apothecary',
      topFixReason: 'Stock medicine before another attempt.',
    },
  });
  assert.equal(activeMilestone(), 'M9_gate_trial', 'Gate defeat must not complete M9');
  assert.equal(useOnboardingStore.getState().eventFacts.lastGateDefeat?.topFixDestination, 'apothecary');

  GameEvents.emit({
    type: 'trials/attempt_resolved',
    payload: {
      timestamp: NOW + 8,
      trialId: 'trial_foundation_gate',
      gateIndex: 0,
      attemptId: 'attempt-clear',
      outcome: 'cleared',
      durationSec: 37,
      countsTowardFailSafe: true,
    },
  });
  assert.equal(activeMilestone(), 'M10_foundation_graduation');

  GameEvents.emit({
    type: 'progression/breakthrough_completed',
    payload: {
      timestamp: NOW + 9,
      fromRealmIndex: 0,
      fromSubstage: 9,
      toRealmIndex: 1,
      toSubstage: 1,
      major: true,
    },
  });
  assert.equal(activeMilestone(), 'complete');
  assert.equal(useOnboardingStore.getState().firstLifeOnlyComplete, true);

  useOnboardingStore.getState().resetForNewLife();
  assert.equal(activeMilestone(), 'complete', 'later lives must not replay full first-life onboarding by default');
});

