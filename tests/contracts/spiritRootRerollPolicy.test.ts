import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateRerollGuidance } from '../../src/systems/doctrine/index.js';

test('gate 1 first reroll is honestly overspending under the current live cost', () => {
  const guidance = evaluateRerollGuidance({
    rerollCount: 0,
    rerollCost: 1000,
    currentPhaseGoldBudget: 600,
  });
  assert.equal(guidance.state, 'overspending');
  assert.equal(guidance.healthyMaxRerolls, 2);
  assert.equal(guidance.projectedSpentAfterNext > guidance.currentPhaseGoldBudget * 0.05, true);
});

test('a comfortably in-budget reroll is safe', () => {
  const guidance = evaluateRerollGuidance({
    rerollCount: 0,
    rerollCost: 100,
    currentPhaseGoldBudget: 3000,
  });
  assert.equal(guidance.state, 'safe');
  assert.equal(guidance.healthyMaxRerolls, 3);
  assert.equal(guidance.projectedSpentAfterNext <= guidance.currentPhaseGoldBudget * 0.05, true);
});

test('inside budget but expensive rerolls become caution', () => {
  const guidance = evaluateRerollGuidance({
    rerollCount: 1,
    rerollCost: 90,
    currentPhaseGoldBudget: 3000,
  });
  assert.equal(guidance.state, 'caution');
  assert.equal(guidance.projectedSpentAfterNext <= guidance.currentPhaseGoldBudget * 0.05, true);
});

test('inside budget but beyond healthy reroll expectation becomes caution with the expectation reason', () => {
  const guidance = evaluateRerollGuidance({
    rerollCount: 6,
    rerollCost: 10,
    currentPhaseGoldBudget: 160000,
  });
  assert.equal(guidance.state, 'caution');
  assert.equal(guidance.nextRerollNumber > guidance.healthyMaxRerolls, true);
  assert.equal(guidance.reason.includes('healthy reroll expectation'), true);
});

test('large projected overspend remains overspending', () => {
  const guidance = evaluateRerollGuidance({
    rerollCount: 5,
    rerollCost: 32000,
    currentPhaseGoldBudget: 47500,
  });
  assert.equal(guidance.state, 'overspending');
  assert.equal(guidance.projectedSpentAfterNext > guidance.currentPhaseGoldBudget * 0.05, true);
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
