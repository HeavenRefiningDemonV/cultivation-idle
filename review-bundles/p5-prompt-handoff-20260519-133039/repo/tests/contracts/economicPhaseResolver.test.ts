import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildEconomicPhaseSnapshotFromState } from '../../src/systems/economy/economicPhaseResolver.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('economic phase resolver maps the live realm to the correct next unresolved transition', async () => {
  const validated = await getValidated();
  const snapshot = buildEconomicPhaseSnapshotFromState({
    content: validated,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    currentRealmIndex: 1,
    selectedPath: 'earth',
    trialProgressById: {
      trial_novices_clearing: {
        attempts: 1,
        sessionAttempts: 1,
        eligibleFailures: 0,
        resolution: 'cleared',
        cleared: true,
        lastAttemptAt: 1,
        lastClearAt: 1,
        bypassedAt: null,
        attemptStartAt: null,
        lastAttemptSummary: null,
      },
    },
  });

  assert.equal(snapshot.currentRealmId, 'foundation_establishment');
  assert.equal(snapshot.currentGateIndex, 2);
  assert.equal(snapshot.currentGateTransitionId, 'foundation_to_core_formation');
  assert.equal(snapshot.currentGateResolved, false);
  assert.equal(snapshot.nextUnresolvedTransitionId, 'foundation_to_core_formation');
  assert.equal(snapshot.currentCityId, 'city_stonecrag_town');
  assert.equal(snapshot.currentCityIndex, 1);
  assert.equal(snapshot.citySupportIdentity, 'forge-and-ore');
});

test('economic phase resolver handles content-cap state cleanly without inventing gate 6 or city 6', async () => {
  const validated = await getValidated();
  const resolvedTrials = Object.fromEntries(
    validated.trials.map((trial) => [
      trial.id,
      {
        attempts: 1,
        sessionAttempts: 1,
        eligibleFailures: 0,
        resolution: 'cleared' as const,
        cleared: true,
        lastAttemptAt: 1,
        lastClearAt: 1,
        bypassedAt: null,
        attemptStartAt: null,
        lastAttemptSummary: null,
      },
    ]),
  );

  const snapshot = buildEconomicPhaseSnapshotFromState({
    content: validated,
    currentCityId: 'city_ironpeak_bastion',
    unlockedCityIds: validated.cities.map((city) => city.id),
    currentRealmIndex: 5,
    selectedPath: 'martial',
    trialProgressById: resolvedTrials,
  });

  assert.equal(snapshot.atContentCap, true);
  assert.equal(snapshot.currentRealmId, 'spirit_severing');
  assert.equal(snapshot.currentGateIndex, 5);
  assert.equal(snapshot.currentGateTransition, null);
  assert.equal(snapshot.currentGateTransitionId, null);
  assert.equal(snapshot.nextUnresolvedGateTransition, null);
  assert.equal(snapshot.nextUnresolvedTransitionId, null);
  assert.equal(snapshot.currentCityIndex, 4);
});
