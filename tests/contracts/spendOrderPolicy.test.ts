import assert from 'node:assert/strict';
import test from 'node:test';

import { getSpendOrderPolicy, getAllSpendOrderPolicies } from '../../src/systems/economy/spendOrderPolicy.js';

test('spend-order policy preserves priorities 1 through 7 in the locked order', () => {
  const policy = getSpendOrderPolicy({ gateIndex: 3, currentCityId: 'city_spirit_cavern_city', currentGateResolved: false });
  assert.deepEqual(
    policy.priorities.map((entry) => [entry.order, entry.id]),
    [
      [1, 'maintain_consumable_floor'],
      [2, 'reach_minimum_forge_floor'],
      [3, 'build_merit_reserve'],
      [4, 'build_spirit_stone_reserve'],
      [5, 'reach_recommended_forge_floor'],
      [6, 'buy_full_gate_prep_package'],
      [7, 'build_correction_and_optional_runes'],
    ],
  );
});

test('spend-order policy reuses the locked reserve targets and spend ceilings', () => {
  const policies = getAllSpendOrderPolicies();
  assert.deepEqual(
    policies.map((entry) => ({
      gateIndex: entry.gateIndex,
      merit: entry.meritReserveTarget,
      spiritMinimum: entry.spiritStoneReserve.minimum,
      spiritIdeal: entry.spiritStoneReserve.ideal,
      pavilion: entry.pavilionSpendCeilingBeforeResolve,
      reroll: entry.spiritRootRerollSpendCeilingBeforeResolve,
    })),
    [
      { gateIndex: 1, merit: 10, spiritMinimum: 0, spiritIdeal: 0, pavilion: 1500, reroll: 600 },
      { gateIndex: 2, merit: 15, spiritMinimum: 3, spiritIdeal: 5, pavilion: 6000, reroll: 3000 },
      { gateIndex: 3, merit: 20, spiritMinimum: 8, spiritIdeal: 15, pavilion: 25000, reroll: 12000 },
      { gateIndex: 4, merit: 25, spiritMinimum: 20, spiritIdeal: 40, pavilion: 90000, reroll: 47500 },
      { gateIndex: 5, merit: 35, spiritMinimum: 50, spiritIdeal: 100, pavilion: 300000, reroll: 160000 },
    ],
  );
});

test('spend-order policy exposes the current-city cultivation prep mapping and stock floors', () => {
  const pinewind = getSpendOrderPolicy({
    gateIndex: 1,
    currentCityId: 'city_pinewind_hamlet',
    selectedPath: 'heaven',
    currentGateResolved: false,
  });
  assert.equal(pinewind.consumableFloor.healingFloor, 20);
  assert.equal(pinewind.consumableFloor.specialtyFloor, 0);
  assert.equal(pinewind.consumableFloor.cultivationPrepFloor, 4);
  assert.equal(pinewind.consumableFloor.cultivationPrepItemId, 'cons_qi_elixir_t1');
  assert.equal(pinewind.pathBiasHint, 'Heaven-biased');

  const ironpeak = getSpendOrderPolicy({
    gateIndex: 5,
    currentCityId: 'city_ironpeak_bastion',
    selectedPath: 'martial',
    currentGateResolved: false,
  });
  assert.equal(ironpeak.consumableFloor.healingFloor, 30);
  assert.equal(ironpeak.consumableFloor.specialtyFloor, 6);
  assert.equal(ironpeak.consumableFloor.cultivationPrepFloor, 6);
  assert.equal(ironpeak.consumableFloor.cultivationPrepItemId, 'cons_mastery_tonic_t1');
  assert.equal(ironpeak.pathBiasHint, 'Martial-biased');
});
