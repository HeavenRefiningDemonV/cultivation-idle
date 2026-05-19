import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAllPrepBudgetRegistryEntries,
  getPrepBudgetByCurrentRealmId,
  getPrepBudgetByGateIndex,
  getPrepBudgetByNextCityId,
  getPrepBudgetByTransitionId,
} from '../../src/systems/economy/prepBudgetRegistry.js';

test('prep-budget registry covers all five live transitions in canonical order', () => {
  const entries = getAllPrepBudgetRegistryEntries();
  assert.equal(entries.length, 5);
  assert.deepEqual(
    entries.map((entry) => [entry.gateIndex, entry.transitionId]),
    [
      [1, 'qi_condensation_to_foundation'],
      [2, 'foundation_to_core_formation'],
      [3, 'core_formation_to_nascent_soul'],
      [4, 'nascent_soul_to_soul_formation'],
      [5, 'soul_formation_to_spirit_severing'],
    ],
  );
});

test('prep-budget registry is queryable by gate, transition, realm, and city', () => {
  assert.equal(getPrepBudgetByGateIndex(1)?.transitionId, 'qi_condensation_to_foundation');
  assert.equal(getPrepBudgetByTransitionId('foundation_to_core_formation')?.cityId, 'city_stonecrag_town');
  assert.equal(getPrepBudgetByCurrentRealmId('core_formation')?.transitionId, 'core_formation_to_nascent_soul');
  assert.equal(getPrepBudgetByNextCityId('city_ironpeak_bastion')?.transitionId, 'soul_formation_to_spirit_severing');
});

test('prep-budget registry encodes the locked forge floors, stock packages, and gold ranges', () => {
  const gateOne = getPrepBudgetByGateIndex(1);
  assert.ok(gateOne);
  assert.deepEqual(gateOne.minimumPrepPackage.forgeFloor, {
    weaponRefine: 2,
    accessoryRefine: 1,
    temperSuccesses: 1,
    runeRecommendation: { minimum: 0, recommendedLow: 0, recommendedHigh: 0, note: 'No rune required yet.' },
  });
  assert.deepEqual(gateOne.minimumPrepPackage.stockPackage.directCore, [
    { itemId: 'cons_healing_pellet_t1', qty: 10 },
    { itemId: 'cons_ironblood_pellet_t1', qty: 4 },
    { itemId: 'cons_qi_elixir_t1', qty: 4 },
  ]);
  assert.deepEqual(gateOne.recommendedPrepPackage.goldSpendRange, { minimum: 9000, recommended: 12000 });

  const gateThree = getPrepBudgetByGateIndex(3);
  assert.ok(gateThree);
  assert.equal(gateThree.minimumPrepPackage.forgeFloor.weaponRefine, 6);
  assert.equal(gateThree.recommendedPrepPackage.forgeFloor.weaponRefine, 7);
  assert.equal(gateThree.recommendedPrepPackage.forgeFloor.runeRecommendation.recommendedHigh, 1);
  assert.deepEqual(gateThree.recommendedPrepPackage.stockPackage.directCore, [
    { itemId: 'cons_healing_pellet_t1', qty: 25 },
    { itemId: 'cons_focus_tonic_t1', qty: 4 },
    { itemId: 'cons_qi_elixir_t2', qty: 4 },
  ]);

  const gateFive = getPrepBudgetByGateIndex(5);
  assert.ok(gateFive);
  assert.deepEqual(gateFive.minimumPrepPackage.goldSpendRange, { minimum: 1000000, recommended: 1400000 });
  assert.deepEqual(gateFive.recommendedPrepPackage.goldSpendRange, { minimum: 2300000, recommended: 3200000 });
  assert.equal(gateFive.recommendedPrepPackage.forgeFloor.runeRecommendation.recommendedHigh, 3);
});

test('prep-budget supplement lanes stay as supplement lanes instead of collapsing into fake hard requirements', () => {
  const gateThree = getPrepBudgetByGateIndex(3);
  const gateFour = getPrepBudgetByGateIndex(4);
  const gateFive = getPrepBudgetByGateIndex(5);

  assert.ok(gateThree);
  assert.ok(gateFour);
  assert.ok(gateFive);

  assert.deepEqual(gateThree.minimumPrepPackage.stockPackage.supplementLanes, [
    {
      key: 'defensive_specialty',
      label: 'Defensive specialty support',
      qty: 3,
      optionItemIds: ['cons_focus_tonic_t1', 'cons_ward_salt_t1'],
      pathBiasMode: 'as_applicable',
    },
  ]);
  assert.equal(gateFour.recommendedPrepPackage.stockPackage.supplementLanes.length, 2);
  assert.deepEqual(gateFive.recommendedPrepPackage.stockPackage.supplementLanes, [
    {
      key: 'quiet_breath_or_purity',
      label: 'Quiet Breath or Purity support',
      qty: 1,
      optionItemIds: ['cons_quiet_breath_tea_t1', 'cons_purity_elixir_t1'],
      pathBiasMode: 'as_applicable',
    },
  ]);
});
