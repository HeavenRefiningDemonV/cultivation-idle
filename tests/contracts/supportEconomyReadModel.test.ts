import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildSupportEconomyReadModelFromState } from '../../src/systems/economy/supportEconomyReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('support economy read model resolves reserve targets, safe band, and fail-safe affordability from canonical truth', async () => {
  const validated = await getValidated();
  const model = buildSupportEconomyReadModelFromState({
    content: validated,
    cityId: 'city_stonecrag_town',
    currencies: { merit: '7', spiritStones: '2', gold: '1000000' },
  });

  assert.equal(model.nextGateIndex, 2);
  assert.equal(model.meritMinimumReserveLow, '6');
  assert.equal(model.meritMinimumReserveHigh, '8');
  assert.equal(model.targetMeritReserve, '15');
  assert.equal(model.meritReserveGap, '8');
  assert.equal(model.spiritStoneMinimumReserve, '3');
  assert.equal(model.spiritStoneMinimumGap, '1');
  assert.equal(model.meritReserveStatus, 'between_minimum_and_ideal');
  assert.equal(model.expectedMeritAfterThreeEligibleDefeats, '16');
  assert.equal(model.failSafeThreshold, 3);
  assert.equal(model.failSafeAffordableNow, false);
  assert.equal(model.failSafeAffordableAfterThreeEligibleDefeats, false);
});

test('support economy read model reports below-minimum and at-ideal merit states honestly', async () => {
  const validated = await getValidated();

  const below = buildSupportEconomyReadModelFromState({
    content: validated,
    cityId: 'city_pinewind_hamlet',
    currencies: { merit: '3', spiritStones: '0', gold: '1000000' },
  });
  assert.equal(below.meritReserveStatus, 'below_minimum');
  assert.equal(below.eligibleDefeatMeritReward, '2');

  const ideal = buildSupportEconomyReadModelFromState({
    content: validated,
    cityId: 'city_ironpeak_bastion',
    currencies: { merit: '40', spiritStones: '120', gold: '1000000' },
  });
  assert.equal(ideal.meritReserveStatus, 'at_ideal');
  assert.equal(ideal.reserveStatus, 'at_ideal');
  assert.equal(ideal.expectedMeritAfterThreeEligibleDefeats, '61');
  assert.equal(ideal.failSafeThreshold, 3);
});
