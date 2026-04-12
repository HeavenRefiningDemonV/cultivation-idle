import assert from 'node:assert/strict';
import test from 'node:test';

import { COMBAT_TRIO_TRUTH, bestUsedWhenClauseToSentence } from '../../src/systems/world/combatTrioTruth.js';

test('combat trio truth locks canonical role, sentence, and boundaries', () => {
  assert.deepEqual(COMBAT_TRIO_TRUTH.outskirts, {
    roleTag: 'Gold & Common Mats',
    bestUsedWhenClause: 'you need gold, common materials, or low-risk combat reps.',
    bestUsedWhenSentence: 'Best used when you need gold, common materials, or low-risk combat reps.',
    boundaryLine: 'Not the best source for targeted city materials.',
  });
  assert.deepEqual(COMBAT_TRIO_TRUTH.ruins, {
    roleTag: 'Targeted Mats',
    bestUsedWhenClause: 'you need targeted local materials and deterministic support rewards.',
    bestUsedWhenSentence: 'Best used when you need targeted local materials and deterministic support rewards.',
    boundaryLine: 'Gold is secondary here; the run is for targeted local materials and support stability.',
  });
  assert.deepEqual(COMBAT_TRIO_TRUTH.gateTrial, {
    roleTag: 'Gate Progress',
    bestUsedWhenClause: 'you are ready to resolve the current gate trial.',
    bestUsedWhenSentence: 'Best used when you are ready to resolve the current gate trial.',
  });
});

test('best-used formatter accepts clauses and avoids double-prefix drift', () => {
  assert.equal(
    bestUsedWhenClauseToSentence('you need support-economy progress, refreshes, or route guidance.'),
    'Best used when you need support-economy progress, refreshes, or route guidance.',
  );
  assert.equal(
    bestUsedWhenClauseToSentence('Best used when you are ready to resolve the current gate trial.'),
    'Best used when you are ready to resolve the current gate trial.',
  );
});
