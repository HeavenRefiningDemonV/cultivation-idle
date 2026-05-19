import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateRerollGuidance } from '../../src/systems/doctrine/index.js';

test('gate 1 first reroll is honestly overspending under the current live cost', () => {
  assert.deepEqual(
    evaluateRerollGuidance({
      rerollCount: 0,
      rerollCost: 1000,
      currentPhaseGoldBudget: 600,
    }),
    {
      state: 'overspending',
      rerollCount: 0,
      goldCost: 1000,
      reason: 'This reroll would exceed the current gate-phase Spirit Root budget and risks cannibalizing prep.',
    },
  );
});

test('a comfortably in-budget reroll is safe', () => {
  assert.deepEqual(
    evaluateRerollGuidance({
      rerollCount: 0,
      rerollCost: 1000,
      currentPhaseGoldBudget: 3000,
    }),
    {
      state: 'safe',
      rerollCount: 0,
      goldCost: 1000,
      reason: 'This reroll remains comfortably inside the current gate-phase Spirit Root budget.',
    },
  );
});

test('inside budget but expensive rerolls become caution', () => {
  assert.deepEqual(
    evaluateRerollGuidance({
      rerollCount: 1,
      rerollCost: 2000,
      currentPhaseGoldBudget: 3000,
    }),
    {
      state: 'caution',
      rerollCount: 1,
      goldCost: 2000,
      reason: 'This reroll stays inside budget, but Spirit Root spending is becoming expensive relative to current prep.',
    },
  );
});

test('inside budget but beyond healthy reroll expectation becomes caution with the expectation reason', () => {
  assert.deepEqual(
    evaluateRerollGuidance({
      rerollCount: 6,
      rerollCost: 64000,
      currentPhaseGoldBudget: 160000,
    }),
    {
      state: 'caution',
      rerollCount: 6,
      goldCost: 64000,
      reason: 'This reroll stays inside budget, but it exceeds the healthy reroll expectation for this gate phase.',
    },
  );
});

test('large projected overspend remains overspending', () => {
  assert.deepEqual(
    evaluateRerollGuidance({
      rerollCount: 5,
      rerollCost: 32000,
      currentPhaseGoldBudget: 47500,
    }),
    {
      state: 'overspending',
      rerollCount: 5,
      goldCost: 32000,
      reason: 'This reroll would exceed the current gate-phase Spirit Root budget and risks cannibalizing prep.',
    },
  );
});

test('zero or negative budget is never safe for a paid reroll', () => {
  assert.equal(
    evaluateRerollGuidance({
      rerollCount: 0,
      rerollCost: 1000,
      currentPhaseGoldBudget: 0,
    }).state,
    'overspending',
  );

  assert.equal(
    evaluateRerollGuidance({
      rerollCount: 0,
      rerollCost: 1000,
      currentPhaseGoldBudget: -100,
    }).state,
    'overspending',
  );
});
